import { notificationResolver } from '~/data/resolvers/notificationResolver';
import { NOTIFICATION_SELECT } from '~/data/resolvers/utils/notifications';
import type { GraphQLContext } from '~/types/graphql';

const userId = '60d5ec49ad414d7a8d5464a0';

function mockContext(user: GraphQLContext['user'] = null): GraphQLContext {
  return {
    prisma: {
      notification: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as unknown as GraphQLContext['prisma'],
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user,
    userId: user?._id ? String(user._id) : null,
    requestId: 'test-request-id',
  };
}

function authedContext(): GraphQLContext {
  return mockContext({
    _id: userId,
    username: 'alice',
    email: 'alice@example.com',
  } as NonNullable<GraphQLContext['user']>);
}

describe('notificationResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.notifications', () => {
    it('requires authentication', async () => {
      const ctx = mockContext(null);

      await expect(notificationResolver.Query.notifications(null, {}, ctx)).rejects.toMatchObject({
        message: 'Authentication required',
        extensions: { code: 'UNAUTHENTICATED' },
      });
      expect(ctx.prisma.notification.findMany).not.toHaveBeenCalled();
    });

    it('queries new notifications for the user, newest first, default limit 50', async () => {
      const ctx = authedContext();

      const result = await notificationResolver.Query.notifications(null, {}, ctx);

      expect(ctx.prisma.notification.findMany).toHaveBeenCalledWith({
        where: { userId, status: 'new' },
        orderBy: { created: 'desc' },
        take: 50,
        select: NOTIFICATION_SELECT,
      });
      expect(result).toEqual([]);
    });

    it('clamps limit to a maximum of 100', async () => {
      const ctx = authedContext();

      await notificationResolver.Query.notifications(null, { limit: 500 }, ctx);

      expect(ctx.prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 })
      );
    });

    it('clamps limit to a minimum of 1', async () => {
      const ctx = authedContext();

      await notificationResolver.Query.notifications(null, { limit: 0 }, ctx);

      expect(ctx.prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 1 })
      );
    });

    it('floors a fractional limit', async () => {
      const ctx = authedContext();

      await notificationResolver.Query.notifications(null, { limit: 2.7 }, ctx);

      expect(ctx.prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 2 })
      );
    });

    it('maps rows to the GraphQL shape, keeping legacy COMMENTED values', async () => {
      const ctx = authedContext();
      const created = new Date('2026-01-01T00:00:00.000Z');
      (ctx.prisma.notification.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'n1',
          userId,
          userIdBy: '60d5ec49ad414d7a8d5464a1',
          label: 'nice point',
          status: 'new',
          notificationType: 'COMMENTED',
          postId: '60d5ec49ad414d7a8d5464a2',
          created,
        },
        {
          id: 'n2',
          userId,
          userIdBy: '60d5ec49ad414d7a8d5464a1',
          label: 'Bob has started following you.',
          status: 'new',
          notificationType: 'FOLLOW',
          postId: null,
          created,
        },
      ]);

      const result = await notificationResolver.Query.notifications(null, {}, ctx);

      expect(result).toEqual([
        {
          _id: 'n1',
          userId,
          userIdBy: '60d5ec49ad414d7a8d5464a1',
          label: 'nice point',
          status: 'new',
          notificationType: 'COMMENTED',
          postId: '60d5ec49ad414d7a8d5464a2',
          created,
        },
        {
          _id: 'n2',
          userId,
          userIdBy: '60d5ec49ad414d7a8d5464a1',
          label: 'Bob has started following you.',
          status: 'new',
          notificationType: 'FOLLOW',
          postId: undefined,
          created,
        },
      ]);
    });
  });
});
