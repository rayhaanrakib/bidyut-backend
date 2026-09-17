import { prisma } from '@lib/prisma';
import { redis } from '@lib/redis';
import { AppError } from '@utils/AppError';

export const getGridStatus = async (areaId: string) => {
  const cacheKey = `grid-status:${areaId}`;
 
  try {
    const cached = await redis.get(cacheKey);

    if (cached) {
      return {
        cache: 'HIT' as const,
        data: JSON.parse(cached),
      };
    }
  } catch {
  }

  const area = await prisma.area.findFirst({
    where: {
      id: areaId,
      isDeleted: false,
    },
    include: {
      feeder: {
        select: {
          name: true,
          substation: {
            select: {
              name: true,
              zone: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!area) {
    throw new AppError(404, 'Area not found');
  }

  const now = new Date();

  const [ongoing, upcoming, activeReports] = await Promise.all([
    prisma.schedule.findFirst({
      where: {
        areaId,
        status: 'ONGOING',
        startTime: {
          lte: now,
        },
        endTime: {
          gte: now,
        },
      },
    }),

    prisma.schedule.findFirst({
      where: {
        areaId,
        status: 'SCHEDULED',
        startTime: {
          gt: now,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    }),

    prisma.outageReport.count({
      where: {
        areaId,
        status: {
          in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'],
        },
      },
    }),
  ]);

  const data = {
    area: {
      id: area.id,
      name: area.name,
      feeder: area.feeder?.name ?? null,
      substation: area.feeder?.substation?.name ?? null,
      zone: area.feeder?.substation?.zone?.name ?? null,
    },

    loadSheddingNow: Boolean(ongoing),

    currentOutage: ongoing
      ? {
          title: ongoing.title,
          type: ongoing.type,
          endsAt: ongoing.endTime,
        }
      : null,

    nextScheduled: upcoming
      ? {
          title: upcoming.title,
          type: upcoming.type,
          startsAt: upcoming.startTime,
          endsAt: upcoming.endTime,
        }
      : null,

    activeOutageReports: activeReports,
  };

  try {
    await redis.set(cacheKey, JSON.stringify(data), {
      EX: 60,
    });
  } catch {
  }

  return {
    cache: 'MISS' as const,
    data,
  };
};
