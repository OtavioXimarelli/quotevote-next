import { quoteResolver } from '~/data/resolvers/quoteResolver';
import type { GraphQLContext } from '~/types/graphql';

const date = new Date('2026-01-01T00:00:00.000Z');
const userId = '60d5ec49ad414d7a8d5464a0';
const postId = '60d5ec49ad414d7a8d5464c2';
const quoteId = '60d5ec49ad414d7a8d5464b1';

const QUOTE_SELECT = {
  id: true,
  userId: true,
  postId: true,
  quote: true,
  startWordIndex: true,
  endWordIndex: true,
  deleted: true,
  created: true,
};

function mockContext(user: GraphQLContext['user'] = null) {
  return {
    prisma: {
      quote: {
        findMany: jest.fn(),
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
    },
    req: {} as GraphQLContext['req'],
    res: {} as GraphQLContext['res'],
    pubsub: {} as GraphQLContext['pubsub'],
    user,
    userId: user?._id ? String(user._id) : null,
    requestId: 'test-request-id',
  };
}

function authedUser(admin = false): NonNullable<GraphQLContext['user']> {
  return {
    _id: userId,
    username: 'alice',
    email: 'alice@example.com',
    admin,
  } as NonNullable<GraphQLContext['user']>;
}

describe('quoteResolver', () => {
  it('returns the newest non-deleted quotes through Prisma', async () => {
    const context = mockContext();
    context.prisma.quote.findMany.mockResolvedValue([
      {
        id: quoteId,
        userId,
        postId,
        quote: 'A thoughtful line',
        startWordIndex: 1,
        endWordIndex: 3,
        deleted: false,
        created: date,
      },
    ]);

    const result = await quoteResolver.Query.latestQuotes({}, { limit: 5 }, context as never);

    expect(context.prisma.quote.findMany).toHaveBeenCalledWith({
      where: { deleted: false },
      orderBy: { created: 'desc' },
      take: 5,
      select: QUOTE_SELECT,
    });
    expect(result).toEqual([
      {
        _id: quoteId,
        userId,
        postId,
        quote: 'A thoughtful line',
        startWordIndex: 1,
        endWordIndex: 3,
        created: date,
      },
    ]);
  });

  describe('Mutation.addQuote', () => {
    it('requires authentication', async () => {
      await expect(
        quoteResolver.Mutation.addQuote(
          null,
          {
            quote: {
              postId,
              quoter: userId,
              quoted: '60d5ec49ad414d7a8d546499',
              quote: 'line',
              startWordIndex: 0,
              endWordIndex: 1,
            },
          },
          mockContext(null) as never
        )
      ).rejects.toThrow(/Authentication required/);
    });

    it('creates a quote, updates trending, and logs activity', async () => {
      const context = mockContext(authedUser());
      context.prisma.post.findUnique.mockResolvedValue({
        id: postId,
        title: 'Hello',
        deleted: false,
        pointTimestamp: date,
        dayPoints: 1,
      });
      context.prisma.quote.create.mockResolvedValue({
        id: quoteId,
        userId,
        postId,
        quote: 'line',
        startWordIndex: 0,
        endWordIndex: 1,
        deleted: false,
        created: date,
      });
      context.prisma.post.update.mockResolvedValue({});

      const result = await quoteResolver.Mutation.addQuote(
        null,
        {
          quote: {
            postId,
            quoter: 'ignored-client-id',
            quoted: '60d5ec49ad414d7a8d546499',
            quote: 'line',
            startWordIndex: 0,
            endWordIndex: 1,
          },
        },
        context as never
      );

      expect(context.prisma.quote.create).toHaveBeenCalledWith({
        data: {
          userId,
          postId,
          quote: 'line',
          startWordIndex: 0,
          endWordIndex: 1,
          created: expect.any(Date),
        },
        select: QUOTE_SELECT,
      });
      expect(context.prisma.activity.create).toHaveBeenCalled();
      expect(result._id).toBe(quoteId);
      expect(result.userId).toBe(userId);
    });
  });

  describe('Mutation.deleteQuote', () => {
    it('soft-deletes when the owner requests it', async () => {
      const context = mockContext(authedUser());
      context.prisma.quote.findUnique.mockResolvedValue({
        id: quoteId,
        userId,
        deleted: false,
      });
      context.prisma.quote.update.mockResolvedValue({ id: quoteId });

      const result = await quoteResolver.Mutation.deleteQuote(null, { quoteId }, context as never);

      expect(context.prisma.quote.update).toHaveBeenCalledWith({
        where: { id: quoteId },
        data: { deleted: true },
        select: { id: true },
      });
      expect(result).toEqual({ _id: quoteId });
    });

    it('forbids deleting another users quote', async () => {
      const context = mockContext(authedUser());
      context.prisma.quote.findUnique.mockResolvedValue({
        id: quoteId,
        userId: '60d5ec49ad414d7a8d546499',
        deleted: false,
      });

      await expect(
        quoteResolver.Mutation.deleteQuote(null, { quoteId }, context as never)
      ).rejects.toThrow(/Not authorized/);
    });
  });
});
