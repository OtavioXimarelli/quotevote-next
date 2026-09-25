import type { Prisma, PrismaClient } from '@prisma/client';
import { pubsub } from '~/data/utils/pubsub';
import { NOTIFICATION_CREATED } from '~/data/utils/constants';
import type { Notification, NotificationType } from '~/types/common';

type NotificationsPrisma = Pick<PrismaClient, 'notification'>;

/**
 * Fields read for a notification. Selected explicitly because legacy documents
 * have no createdAt/updatedAt, and Prisma fails a read that returns a required
 * field it cannot find.
 */
export const NOTIFICATION_SELECT = {
  id: true,
  userId: true,
  userIdBy: true,
  label: true,
  status: true,
  notificationType: true,
  postId: true,
  created: true,
} as const satisfies Prisma.NotificationSelect;

type NotificationRecord = Prisma.NotificationGetPayload<{ select: typeof NOTIFICATION_SELECT }>;

/**
 * Map a Prisma notification row to the GraphQL shape (`id` → `_id`).
 */
export const toNotificationEntity = (record: NotificationRecord): Notification => ({
  _id: record.id,
  userId: record.userId,
  userIdBy: record.userIdBy,
  label: record.label,
  status: record.status,
  notificationType: record.notificationType,
  postId: record.postId ?? undefined,
  created: record.created,
});

export interface AddNotificationInput {
  userId: string;
  userIdBy: string;
  notificationType: NotificationType;
  label: string;
  postId?: string;
}

/**
 * Create a notification and publish it via PubSub for real-time delivery.
 */
export const addNotification = async (
  prisma: NotificationsPrisma,
  input: AddNotificationInput
): Promise<Notification> => {
  const { userId, userIdBy, notificationType, label, postId } = input;

  const record = await prisma.notification.create({
    data: {
      userId,
      userIdBy,
      postId,
      notificationType,
      label,
      status: 'new',
      created: new Date(),
    },
    select: NOTIFICATION_SELECT,
  });
  const notification = toNotificationEntity(record);

  await pubsub.publish(NOTIFICATION_CREATED, { notification });

  return notification;
};
