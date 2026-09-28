import type { Prisma } from '@prisma/client';
import type * as Common from '~/types/common';

/**
 * Fields read for a comment. Selected explicitly because legacy documents may
 * lack createdAt/updatedAt, and Prisma fails a read that returns a required
 * field it cannot find.
 */
export const COMMENT_SELECT = {
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
} as const satisfies Prisma.CommentSelect;

export type CommentRecord = Prisma.CommentGetPayload<{ select: typeof COMMENT_SELECT }>;

export function toComment(record: CommentRecord): Common.Comment {
  return {
    _id: record.id,
    userId: record.userId,
    postId: record.postId ?? undefined,
    content: record.content,
    startWordIndex: record.startWordIndex ?? 0,
    endWordIndex: record.endWordIndex ?? 0,
    url: record.url ?? undefined,
    reaction: record.reaction ?? undefined,
    deleted: record.deleted,
    created: record.created,
  };
}

/**
 * Fields read for a quote. Selected explicitly for the same legacy-doc reasons
 * as COMMENT_SELECT.
 */
export const QUOTE_SELECT = {
  id: true,
  userId: true,
  postId: true,
  quote: true,
  startWordIndex: true,
  endWordIndex: true,
  deleted: true,
  created: true,
} as const satisfies Prisma.QuoteSelect;

export type QuoteRecord = Prisma.QuoteGetPayload<{ select: typeof QUOTE_SELECT }>;

export function toQuote(record: QuoteRecord): Common.Quote {
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
