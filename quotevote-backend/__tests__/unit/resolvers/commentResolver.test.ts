import { commentResolver } from '~/data/resolvers/commentResolver';
import type { GraphQLContext } from '~/types/graphql';

const date = new Date('2026-01-01T00:00:00.000Z');
const userId = '60d5ec49ad414d7a8d5464a0';
const postOwnerId = '60d5ec49ad414d7a8d546499';
const postId = '60d5ec49ad414d7a8d5464c2';
const commentId = '60d5ec49ad414d7a8d5464b1';

const COMMENT_SELECT = {
  id: true,
  userId: true,
  postId: true,
  content: true,
  startWordIndex: true,
  endWordIndex: true,
  url: true,
  reaction: true,
  deleted: true,
  created: true,
};

jest.mock('~/data/utils/pubsub', () => ({
  pubsub: {
    publish: jest.fn().mockResolvedValue(undefined),
  },
}));

function mockContext(user: GraphQLContext['user'] = null) {
  return {
    prisma: {
      comment: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      post: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      activity: {
        create: jest.fn().mockResolvedValue({ id: 'activity-1' }),
      },
      notification: {
        create: jest.fn().mockResolvedValue({
          id: 'notif-1',
          userId: postOwnerId,
          userIdBy: userId,
          label: 'note',
          status: 'new',
          notificationType: 'COMMENT',
          postId,
          created: date,
        }),
      },
    },
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user,
    userId: user?._id ? String(user._id) : null,
    requestId: 'test-request-id',
  };
}

function authedUser(): NonNullable<GraphQLContext['user']> {
  return {
    _id: userId,
    username: 'alice',
    email: 'alice@example.com',
  } as NonNullable<GraphQLContext['user']>;
}

describe('commentResolver', () => {
  describe('Mutation.addComment', () => {
    it('requires authentication', async () => {
      await expect(
        commentResolver.Mutation.addComment(
          null,
          {
            comment: {
              userId,
              postId,
              content: 'hello',
              startWordIndex: 0,
              endWordIndex: 1,
            },
          },
          mockContext(null) as never
        )
      ).rejects.toThrow(/Authentication required/);
    });

    it('creates a comment with side effects and notifies the post author', async () => {
      const context = mockContext(authedUser());
      context.prisma.post.findUnique.mockResolvedValue({
        id: postId,
        title: 'Hello',
        userId: postOwnerId,
        deleted: false,
        pointTimestamp: date,
        dayPoints: 2,
      });
      context.prisma.comment.create.mockResolvedValue({
        id: commentId,
        userId,
        postId,
        content: 'hello',
        startWordIndex: 0,
        endWordIndex: 1,
        url: null,
        reaction: null,
        deleted: false,
        created: date,
      });
      context.prisma.post.update.mockResolvedValue({});

      const result = await commentResolver.Mutation.addComment(
        null,
        {
          comment: {
            userId: 'ignored',
            postId,
            content: 'hello',
            startWordIndex: 0,
            endWordIndex: 1,
          },
        },
        context as never
      );

      expect(context.prisma.comment.create).toHaveBeenCalledWith({
        data: {
          userId,
          postId,
          content: 'hello',
          startWordIndex: 0,
          endWordIndex: 1,
          url: undefined,
          reaction: undefined,
          created: expect.any(Date),
        },
        select: COMMENT_SELECT,
      });
      expect(context.prisma.activity.create).toHaveBeenCalled();
      expect(context.prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: postOwnerId,
            userIdBy: userId,
            notificationType: 'COMMENT',
          }),
        })
      );
      expect(result._id).toBe(commentId);
    });

    it('skips notification when commenting on own post', async () => {
      const context = mockContext(authedUser());
      context.prisma.post.findUnique.mockResolvedValue({
        id: postId,
        title: 'Hello',
        userId,
        deleted: false,
        pointTimestamp: date,
        dayPoints: 0,
      });
      context.prisma.comment.create.mockResolvedValue({
        id: commentId,
        userId,
        postId,
        content: 'hello',
        startWordIndex: 0,
        endWordIndex: 1,
        url: null,
        reaction: null,
        deleted: false,
        created: date,
      });
      context.prisma.post.update.mockResolvedValue({});

      await commentResolver.Mutation.addComment(
        null,
        {
          comment: {
            userId,
            postId,
            content: 'hello',
            startWordIndex: 0,
            endWordIndex: 1,
          },
        },
        context as never
      );

      expect(context.prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('Mutation.deleteComment', () => {
    it('soft-deletes when the owner requests it', async () => {
      const context = mockContext(authedUser());
      context.prisma.comment.findUnique.mockResolvedValue({
        id: commentId,
        userId,
        deleted: false,
      });
      context.prisma.comment.update.mockResolvedValue({ id: commentId });

      const result = await commentResolver.Mutation.deleteComment(
        null,
        { commentId },
        context as never
      );

      expect(context.prisma.comment.update).toHaveBeenCalledWith({
        where: { id: commentId },
        data: { deleted: true },
        select: { id: true },
      });
      expect(result).toEqual({ _id: commentId });
    });

    it('forbids deleting another users comment', async () => {
      const context = mockContext(authedUser());
      context.prisma.comment.findUnique.mockResolvedValue({
        id: commentId,
        userId: postOwnerId,
        deleted: false,
      });

      await expect(
        commentResolver.Mutation.deleteComment(null, { commentId }, context as never)
      ).rejects.toThrow(/Not authorized/);
    });
  });
});
