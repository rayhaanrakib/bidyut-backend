import { User } from '@/generated/prisma/client';
import { prisma } from '@lib/prisma';
import { AppError } from '@utils/AppError';
import { getPagination } from '@utils/pagination';
import { ReportOutageInput } from '@modules/outage/outage.interface';

const NEXT_STATUSES: Record<string, string[]> = {
  PENDING: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: [],  
  CANCELLED: [],
};

const reportInclude = {
  area: { select: { id: true, name: true, feeder: { select: { id: true, name: true } } } },
  customer: { select: { id: true, name: true, email: true, category: true } },
  technician: { select: { id: true, name: true, email: true } },
};

export const reportOutage = async (customer: User, input: ReportOutageInput) => {
  const area = await prisma.area.findFirst({ where: { id: input.areaId, isDeleted: false } });
  if (!area) throw new AppError(404, 'Area not found');

  const report = await prisma.outageReport.create({
    data: {
      title: input.title,
      description: input.description,
      areaId: input.areaId,
      customerId: customer.id,
    },
  });

  return report;
};

export const listForRole = async (user: User, query: Record<string, unknown>) => {
  const { page, limit, skip, sortBy, sortOrder, meta } = getPagination(query, 'reportedAt');
  const where: any = {};
  if (user.role === 'CUSTOMER') where.customerId = user.id;
  if (user.role === 'FIELD_TECHNICIAN') where.technicianId = user.id;

  if (query.status) where.status = query.status;
  if (query.areaId) where.areaId = query.areaId;
  if (query.isPriority) where.isPriority = query.isPriority === 'true';
  if (query.search) {
    where.OR = [
      { description: { contains: query.search, mode: 'insensitive' } },
      { title: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const orderBy: any =
    !query.sortBy ? [{ isPriority: 'desc' }, { reportedAt: sortOrder }] : { [sortBy]: sortOrder };

  const [total, items] = await Promise.all([
    prisma.outageReport.count({ where }),
    prisma.outageReport.findMany({ where, skip, take: limit, orderBy, include: reportInclude }),
  ]);
  return { items, meta: meta(total) };
};

export const getByIdScoped = async (user: User, id: string) => {
  const report = await prisma.outageReport.findUnique({ where: { id }, include: reportInclude });
  if (!report) throw new AppError(404, 'Outage report not found');

  const isStaff = user.role === 'ADMIN' || user.role === 'POWER_OPERATOR';
  const isOwner = report.customerId === user.id;
  const isAssignedTech = report.technicianId === user.id;
  if (!isStaff && !isOwner && !isAssignedTech) throw new AppError(403, 'You cannot view this report');
  return report;
};
