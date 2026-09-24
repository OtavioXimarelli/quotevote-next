import { GraphQLError } from 'graphql';
import { POST_RECORD_SELECT } from '~/data/utils/postPrismaMapper';
import { postsResolver } from '~/data/resolvers/postsResolver';
import type { GraphQLContext } from '~/types/graphql';

const userId = '507f1f77bcf86cd799439011';
const tagId = '507f1f77bcf86cd799439012';
const postId = '507f1f77bcf86cd799439013';

function mockContext(): GraphQLContext {
  return {
    prisma: {
      user: {
        findMany: jest.fn(),
      },
      post: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
    } as unknown as GraphQLContext['prisma'],
    user: null,
    userId: null,
    requestId: 'test-request-id',
  } as GraphQLContext;
}

describe('postsResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Query.posts', () => {
    it('throws BAD_USER_INPUT GraphQLError when invalid userId is provided', async () => {
      const ctx = mockContext();

      await expect(postsResolver.Query.posts(null, { userId: 'invalid-id' }, ctx)).rejects.toThrow(
        new GraphQLError('Invalid userId format', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      );

      expect(ctx.prisma.post.findMany).not.toHaveBeenCalled();
    });

    it('throws BAD_USER_INPUT GraphQLError when invalid tagId is provided', async () => {
      const ctx = mockContext();

      await expect(postsResolver.Query.posts(null, { tagId: 'invalid-id' }, ctx)).rejects.toThrow(
        new GraphQLError('Invalid tagId format', {
          extensions: { code: 'BAD_USER_INPUT' },
        })
      );

      expect(ctx.prisma.post.findMany).not.toHaveBeenCalled();
    });

    it('returns empty result early if a username search matches no users', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await postsResolver.Query.posts(null, { searchKey: '@nonexistent' }, ctx);

      expect(result.entities).toEqual([]);
      expect(result.pagination.total_count).toBe(0);
      expect(ctx.prisma.post.findMany).not.toHaveBeenCalled();
    });

    it('filters by matching user ID when a username is searched and found', async () => {
      const ctx = mockContext();
      (ctx.prisma.user.findMany as jest.Mock)
        .mockResolvedValueOnce([{ id: userId }])
        .mockResolvedValueOnce([{ id: userId, username: 'alice', name: 'Alice' }]);
      (ctx.prisma.post.count as jest.Mock).mockResolvedValue(1);
      (ctx.prisma.post.findMany as jest.Mock).mockResolvedValue([
        {
          id: postId,
          userId,
          tagId,
          title: 'Title',
          text: 'Text',
          votedBy: [],
          created: new Date(),
        },
      ]);

      const result = await postsResolver.Query.posts(null, { searchKey: '@alice' }, ctx);

      expect(ctx.prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            deleted: { not: true },
          }),
        })
      );
      expect(result.entities[0].userId).toBe(userId);
      expect(result.entities[0]._id).toBe(postId);
      expect(result.entities[0].tagId).toBe(tagId);
    });

    it('filters by tagId and approved, and sorts by dayPoints when interactions is true', async () => {
      const ctx = mockContext();
      (ctx.prisma.post.count as jest.Mock).mockResolvedValue(0);
      (ctx.prisma.post.findMany as jest.Mock).mockResolvedValue([]);

      await postsResolver.Query.posts(null, { tagId, approved: true, interactions: true }, ctx);

      expect(ctx.prisma.post.findMany).toHaveBeenCalledWith({
        where: {
          deleted: { not: true },
          tagId,
          approved: { gt: 0 },
        },
        orderBy: [{ dayPoints: 'desc' }, { created: 'desc' }],
        skip: 0,
        take: 15,
        select: POST_RECORD_SELECT,
      });
    });

    it('drops hashtag prefix matches that fail the word boundary', async () => {
      const ctx = mockContext();
      (ctx.prisma.post.findMany as jest.Mock).mockResolvedValue([
        {
          id: postId,
          userId,
          tagId,
          title: 'A #climate note',
          text: 'Body',
          votedBy: [],
          created: new Date('2026-01-02T00:00:00.000Z'),
        },
        {
          id: '507f1f77bcf86cd799439014',
          userId,
          tagId,
          title: 'A #climatechange note',
          text: 'Body',
          votedBy: [],
          created: new Date('2026-01-01T00:00:00.000Z'),
        },
      ]);
      (ctx.prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      const result = await postsResolver.Query.posts(
        null,
        { searchKey: '#climate', limit: 15 },
        ctx
      );

      expect(result.entities.map((post) => post._id)).toEqual([postId]);
      expect(result.pagination.total_count).toBe(1);
      expect(ctx.prisma.post.count).not.toHaveBeenCalled();
      expect(ctx.prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ select: POST_RECORD_SELECT })
      );
    });

    it('uses contains search for plain text and hashtags', async () => {
      const ctx = mockContext();
      (ctx.prisma.post.count as jest.Mock).mockResolvedValue(0);
      (ctx.prisma.post.findMany as jest.Mock).mockResolvedValue([]);

      await postsResolver.Query.posts(null, { searchKey: '#climate debate' }, ctx);

      expect(ctx.prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: [
              {
                OR: [
                  { title: { contains: '#climate', mode: 'insensitive' } },
                  { text: { contains: '#climate', mode: 'insensitive' } },
                ],
              },
              {
                OR: [
                  { title: { contains: 'debate', mode: 'insensitive' } },
                  { text: { contains: 'debate', mode: 'insensitive' } },
                ],
              },
            ],
          }),
        })
      );
    });
  });
});
