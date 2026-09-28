import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import type * as Common from '~/types/common';
import type { GraphQLContext } from '~/types/graphql';

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

/**
 * Fields read for a reaction. Selected explicitly because legacy documents may
 * lack createdAt/updatedAt, and Prisma fails a read that returns a required
 * field it cannot find.
 */
const REACTION_SELECT = {
  id: true,
  userId: true,
  actionId: true,
  messageId: true,
  emoji: true,
  created: true,
} as const satisfies Prisma.ReactionSelect;

type ReactionRecord = Prisma.ReactionGetPayload<{ select: typeof REACTION_SELECT }>;

function toReaction(record: ReactionRecord): Common.Reaction {
  return {
    _id: record.id,
    userId: record.userId,
    actionId: record.actionId ?? undefined,
    messageId: record.messageId ?? undefined,
    emoji: record.emoji,
    created: record.created,
  };
}

function requireUserId(context: GraphQLContext): string {
  if (!context.user?._id) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user._id.toString();
}

function isObjectId(id: string): boolean {
  return OBJECT_ID_PATTERN.test(id);
}

function isUniqueConflict(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/**
 * One reaction per user per action. Prisma has no compound unique on
 * (userId, actionId), so this mirrors the Mongoose upsert: update when a row
 * exists, otherwise create, and retry the update if a concurrent insert wins.
 */
async function upsertActionReaction(
  prisma: GraphQLContext['prisma'],
  userId: string,
  actionId: string,
  emoji: string
): Promise<ReactionRecord> {
  const existing = await prisma.reaction.findFirst({
    where: { userId, actionId },
    select: REACTION_SELECT,
  });
  if (existing) {
    return prisma.reaction.update({
      where: { id: existing.id },
      data: { emoji },
      select: REACTION_SELECT,
    });
  }

  try {
    return await prisma.reaction.create({
      data: { userId, actionId, emoji },
      select: REACTION_SELECT,
    });
  } catch (error) {
    if (!isUniqueConflict(error)) throw error;
    const raced = await prisma.reaction.findFirst({
      where: { userId, actionId },
      select: REACTION_SELECT,
    });
    if (!raced) throw error;
    return prisma.reaction.update({
      where: { id: raced.id },
      data: { emoji },
      select: REACTION_SELECT,
    });
  }
}

export const reactionResolver = {
  Query: {
    actionReactions: async (
      _parent: unknown,
      args: { actionId: string },
      context: GraphQLContext
    ): Promise<Common.Reaction[]> => {
      if (!isObjectId(args.actionId)) return [];

      const reactions = await context.prisma.reaction.findMany({
        where: { actionId: args.actionId },
        orderBy: { created: 'desc' },
        select: REACTION_SELECT,
      });
      return reactions.map(toReaction);
    },
  },

  Mutation: {
    addActionReaction: async (
      _parent: unknown,
      args: { reaction: Common.ReactionInput },
      context: GraphQLContext
    ): Promise<Common.Reaction> => {
      const userId = requireUserId(context);
      const actionId = args.reaction.actionId;
      if (!actionId || !isObjectId(actionId)) {
        throw new GraphQLError('Invalid actionId', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const rxn = await upsertActionReaction(context.prisma, userId, actionId, args.reaction.emoji);
      return toReaction(rxn);
    },

    updateActionReaction: async (
      _parent: unknown,
      args: { _id: string; emoji: string },
      context: GraphQLContext
    ): Promise<Common.Reaction> => {
      const userId = requireUserId(context);
      const existing = isObjectId(args._id)
        ? await context.prisma.reaction.findUnique({
            where: { id: args._id },
            select: REACTION_SELECT,
          })
        : null;
      if (!existing) {
        throw new GraphQLError('Reaction not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (existing.userId !== userId) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      const rxn = await context.prisma.reaction.update({
        where: { id: args._id },
        data: { emoji: args.emoji },
        select: REACTION_SELECT,
      });
      return toReaction(rxn);
    },

    deleteActionReaction: async (
      _parent: unknown,
      args: { _id: string },
      context: GraphQLContext
    ): Promise<boolean> => {
      const userId = requireUserId(context);
      const existing = isObjectId(args._id)
        ? await context.prisma.reaction.findUnique({
            where: { id: args._id },
            select: REACTION_SELECT,
          })
        : null;
      if (!existing) {
        throw new GraphQLError('Reaction not found', {
          extensions: { code: 'NOT_FOUND' },
        });
      }

      if (existing.userId !== userId) {
        throw new GraphQLError('Not authorized', {
          extensions: { code: 'FORBIDDEN' },
        });
      }

      await context.prisma.reaction.delete({ where: { id: args._id } });
      return true;
    },
  },
};
