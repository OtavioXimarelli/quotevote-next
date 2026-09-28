import { quoteResolver } from '~/data/resolvers/quoteResolver';

const date = new Date('2026-01-01T00:00:00.000Z');

function createContext() {
  return {
    prisma: {
      quote: {
        findMany: jest.fn(),
      },
    },
  };
}

describe('quoteResolver', () => {
  it('returns the newest quotes through Prisma', async () => {
    const context = createContext();
    context.prisma.quote.findMany.mockResolvedValue([
      {
        id: '60d5ec49ad414d7a8d5464b1',
        userId: '60d5ec49ad414d7a8d5464a0',
        postId: '60d5ec49ad414d7a8d5464c2',
        quote: 'A thoughtful line',
        startWordIndex: 1,
        endWordIndex: 3,
        created: date,
      },
    ]);

    const result = await quoteResolver.Query.latestQuotes({}, { limit: 5 }, context as never);

    expect(context.prisma.quote.findMany).toHaveBeenCalledWith({
      orderBy: { created: 'desc' },
      take: 5,
      select: {
        id: true,
        userId: true,
        postId: true,
        quote: true,
        startWordIndex: true,
        endWordIndex: true,
        created: true,
      },
    });
    expect(result).toEqual([
      {
        _id: '60d5ec49ad414d7a8d5464b1',
        userId: '60d5ec49ad414d7a8d5464a0',
        postId: '60d5ec49ad414d7a8d5464c2',
        quote: 'A thoughtful line',
        startWordIndex: 1,
        endWordIndex: 3,
        created: date,
      },
    ]);
  });
});
