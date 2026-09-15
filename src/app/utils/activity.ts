import { prisma } from '@lib/prisma';

export async function logActivity(
  action: string,
  entity: string,
  entityId: string | null,
  actorId: string | null,
  metadata?: Record<string, unknown>,
) {
  try {
    await prisma.activityLog.create({
      data: { action, entity, entityId, actorId, metadata: (metadata ?? undefined) as any },
    });
  } catch (err) {
    console.error('Activity log failed:', err);
  }
}