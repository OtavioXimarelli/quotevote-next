import type { Prisma } from '@prisma/client';
import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';

/**
 * Fields read for a quote. Selected explicitly because legacy documents may
 * lack createdAt/updatedAt, and Prisma fails a read that returns a required
 * field it cannot find.
 */
const QUOTE_SELECT = {
  id: true,
  userId: true,
  postId: true,
  quote: true,
  startWordIndex: true,
  endWordIndex: true,
  created: true,
} as const satisfies Prisma.QuoteSelect;

type QuoteRecord = Prisma.QuoteGetPayload<{ select: typeof QUOTE_SELECT }>;

function toQuote(record: QuoteRecord): Common.Quote {
  return {
    _id: record.id,
    userId: record.userId,
    postId: record.postId,
    quote: record.quote,
    startWordIndex: record.startWordIndex ?? undefined,
    endWordIndex: record.endWordIndex ?? undefined,
    created: record.created,
  };
}

export const quoteResolver = {
  Query: {
    latestQuotes: async (
      _parent: unknown,
      args: { limit: number },
      context: GraphQLContext
    ): Promise<Common.Quote[]> => {
      const quotes = await context.prisma.quote.findMany({
        orderBy: { created: 'desc' },
        take: args.limit,
        select: QUOTE_SELECT,
      });
      return quotes.map(toQuote);
    },
  },
};
