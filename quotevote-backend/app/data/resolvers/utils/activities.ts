import type { Prisma, PrismaClient } from '@prisma/client';
import { logger } from '~/data/utils/logger';
import type { Activity, ActivityEventType } from '~/types/common';

type ActivitiesPrisma = Pick<PrismaClient, 'activity'>;

/**
 * Fields read for an activity. Selected explicitly because legacy documents
 * have no createdAt/updatedAt, and Prisma fails a read that returns a required
 * field it cannot find.
 */
export const ACTIVITY_SELECT = {
  id: true,
  userId: true,
  postId: true,
  voteId: true,
  commentId: true,
  quoteId: true,
  activityType: true,
  content: true,
  created: true,
} as const satisfies Prisma.ActivitySelect;

type ActivityRecord = Prisma.ActivityGetPayload<{ select: typeof ACTIVITY_SELECT }>;

/**
 * Map a Prisma activity row to the GraphQL shape (`id` → `_id`, null → undefined).
 */
export const toActivityEntity = (record: ActivityRecord): Activity => ({
  _id: record.id,
  userId: record.userId,
  postId: record.postId ?? undefined,
  voteId: record.voteId ?? undefined,
  commentId: record.commentId ?? undefined,
  quoteId: record.quoteId ?? undefined,
  activityType: record.activityType,
  content: record.content ?? undefined,
  created: record.created,
});

export interface ActivityIds {
  userId: string;
  postId?: string;
  voteId?: string;
  commentId?: string;
  quoteId?: string;
}

/**
 * Log a user activity event (POSTED, COMMENTED, VOTED, QUOTED, etc.)
 */
export const logActivity = async (
  prisma: ActivitiesPrisma,
  activityType: ActivityEventType,
  ids: ActivityIds,
  content?: string
): Promise<void> => {
  await prisma.activity.create({
    data: {
      activityType,
      ...ids,
      content,
      created: new Date(),
    },
    select: { id: true },
  });
  logger.debug('Added new activity', { activityType, ids, content });
};
