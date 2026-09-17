import { prisma } from '@lib/prisma';

const DAY = 86_400_000;

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const operationalStats = async () => {
  const [
    totalReports, pending, assigned, inProgress, resolvedToday,
    customers, technicians, activeSla, upcomingSchedules,
  ] = await Promise.all([
    prisma.outageReport.count(),
    prisma.outageReport.count({ where: { status: 'PENDING' } }),
    prisma.outageReport.count({ where: { status: 'ASSIGNED' } }),
    prisma.outageReport.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.outageReport.count({ where: { status: 'RESOLVED', resolvedAt: { gte: startOfToday() } } }),
    prisma.user.count({ where: { role: 'CUSTOMER', isDeleted: false } }),
    prisma.user.count({ where: { role: 'FIELD_TECHNICIAN', isDeleted: false } }),
    prisma.user.count({ where: { slaActive: true, slaExpiryDate: { gt: new Date() } } }),
    prisma.schedule.count({ where: { status: 'SCHEDULED', startTime: { gte: new Date() } } }),
  ]);

  return {
    outages: { totalReports, pending, assigned, inProgress, resolvedToday },
    users: { customers, technicians, activeSlaSubscriptions: activeSla },
    upcomingSchedules,
  };
};

export const heatmap = async (days = 30) => {
  const since = new Date(Date.now() - days * DAY);

  const areas = await prisma.area.findMany({
    where: { isDeleted: false },
    select: { id: true, name: true, feeder: { select: { name: true } } },
  });
  const reports = await prisma.outageReport.findMany({
    where: { reportedAt: { gte: since } },
    select: { areaId: true, reportedAt: true, resolvedAt: true },
  });

  const stats: Record<string, { reportCount: number; resolved: number; totalMinutes: number }> = {};
  for (const r of reports) {
    const s = (stats[r.areaId] ??= { reportCount: 0, resolved: 0, totalMinutes: 0 }); // strict-safe indexing
    s.reportCount++;
    if (r.resolvedAt) {
      s.resolved++;
      s.totalMinutes += (r.resolvedAt.getTime() - r.reportedAt.getTime()) / 60_000;
    }
  }

  const rows = areas
    .map((a) => {
      const s = stats[a.id] ?? { reportCount: 0, resolved: 0, totalMinutes: 0 };
      return {
        areaId: a.id,
        areaName: a.name,
        feederName: a.feeder?.name,
        reportCount: s.reportCount,
        avgResolutionMinutes: s.resolved > 0 ? Math.round(s.totalMinutes / s.resolved) : null,
      };
    })
    .sort((x, y) => y.reportCount - x.reportCount); // worst-hit first

  return { windowDays: days, rows };
};

export const customerSummary = async (userId: string) => {
  const [totalReports, openReports, resolvedReports, payments, user] = await Promise.all([
    prisma.outageReport.count({ where: { customerId: userId } }),
    prisma.outageReport.count({ where: { customerId: userId, status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] } } }),
    prisma.outageReport.count({ where: { customerId: userId, status: 'RESOLVED' } }),
    prisma.payment.aggregate({ where: { userId, status: 'COMPLETED' }, _sum: { amountPaisa: true }, _count: true }),
    prisma.user.findUnique({ where: { id: userId }, select: { slaActive: true, slaExpiryDate: true } }),
  ]);

  return {
    totalReports,
    openReports,
    resolvedReports,
    completedPayments: payments._count,
    totalSpentBDT: (payments._sum.amountPaisa ?? 0) / 100,
    sla: user,
  };
};

export const technicianSummary = async (userId: string) => {
  const [assigned, resolved, resolvedReports] = await Promise.all([
    prisma.outageReport.count({ where: { technicianId: userId } }),
    prisma.outageReport.count({ where: { technicianId: userId, status: 'RESOLVED' } }),
    prisma.outageReport.findMany({
      where: { technicianId: userId, status: 'RESOLVED', resolvedAt: { not: null } },
      select: { reportedAt: true, resolvedAt: true },
    }),
  ]);

  const totalMinutes = resolvedReports.reduce(
    (sum, r) => sum + (r.resolvedAt!.getTime() - r.reportedAt.getTime()) / 60_000,
    0,
  );

  return {
    assignedReports: assigned,
    resolvedReports: resolved,
    avgResolutionMinutes: resolved > 0 ? Math.round(totalMinutes / resolved) : null,
  };
};