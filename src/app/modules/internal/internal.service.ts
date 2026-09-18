import config from "../../config";
import { sendEmail } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { logActivity } from "../../utils/activity";

export const dispatchNotificationsService = async () => {
  const now = new Date();
  const in24h = new Date(now.getTime() + 86_400_000);

  // Announce schedules starting within 24 hours
  const schedules = await prisma.schedule.findMany({
    where: {
      status: "SCHEDULED",
      notificationSentAt: null,
      startTime: {
        gte: now,
        lte: in24h,
      },
    },
    include: {
      area: true,
      feeder: {
        include: {
          areas: true,
        },
      },
    },
  });

  let emailsSent = 0;

  for (const schedule of schedules) {
    const areas = schedule.areaId ? [schedule.area] : (schedule.feeder?.areas ?? []);

    for (const area of areas) {
      const customers = await prisma.user.findMany({
        where: {
          areaId: area?.id,
          role: "CUSTOMER",
          isDeleted: false,
          status: "ACTIVE",
        },
      });

      for (const customer of customers) {
        await sendEmail(
          customer.email,
          "⚠️ Upcoming load shedding in your area",
          "schedule-notice",
          {
            name: customer.name,
            title: schedule.title,
            start: schedule.startTime.toLocaleString(),
            end: schedule.endTime.toLocaleString(),
          },
        ).catch(() => null);

        await prisma.notification.create({
          data: {
            userId: customer.id,
            type: "SCHEDULE_ALERT",
            title: "Upcoming load shedding",
            body: schedule.title,
          },
        });

        emailsSent++;
      }
    }

    await prisma.schedule.update({
      where: {
        id: schedule.id,
      },
      data: {
        notificationSentAt: new Date(),
      },
    });
  }

  // Flag SLA breaches
  const breachBefore = new Date(now.getTime() - config.slaBreachHours * 3_600_000);

  const breached = await prisma.outageReport.updateMany({
    where: {
      isPriority: true,
      slaBreached: false,
      status: {
        in: ["PENDING", "ASSIGNED", "IN_PROGRESS"],
      },
      reportedAt: {
        lt: breachBefore,
      },
    },
    data: {
      slaBreached: true,
    },
  });

  if (breached.count > 0) {
    await logActivity("SLA_BREACHED", "OutageReport", null, null, {
      count: breached.count,
    });
  }

  return {
    schedulesAnnounced: schedules.length,
    emailsSent,
    slaBreachesFlagged: breached.count,
  };
};
