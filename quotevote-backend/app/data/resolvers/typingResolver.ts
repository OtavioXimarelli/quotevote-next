import { GraphQLError } from 'graphql';
import type * as Common from '~/types/common';
import {
  SUBSCRIPTION_EVENTS,
  type GraphQLContext,
  type TypingPayload,
  type TypingResult,
} from '~/types/graphql';

const TYPING_EXPIRATION_MS = 10_000;

type UpdateTypingArgs = {
  typing: {
    messageRoomId: string;
    isTyping: boolean;
  };
};

export const typingResolver = {
  Query: {
    getTypingUsers: async (
      _parent: unknown,
      args: { messageRoomId: string },
      context: GraphQLContext
    ): Promise<Common.Typing[]> => {
      const now = new Date();
      return context.prisma.typing.findMany({
        where: {
          messageRoomId: args.messageRoomId,
          isTyping: true,
          expiresAt: { gt: now },
        },
        select: {
          messageRoomId: true,
          userId: true,
          isTyping: true,
          timestamp: true,
        },
      });
    },
  },

  Mutation: {
    updateTyping: async (
      _parent: unknown,
      args: UpdateTypingArgs,
      context: GraphQLContext
    ): Promise<TypingResult> => {
      if (!context.user?._id) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const { messageRoomId, isTyping } = args.typing;
      const userId = context.user._id.toString();
      const now = new Date();

      if (isTyping) {
        const expiresAt = new Date(now.getTime() + TYPING_EXPIRATION_MS);
        await context.prisma.typing.upsert({
          where: { messageRoomId_userId: { messageRoomId, userId } },
          create: { messageRoomId, userId, isTyping, timestamp: now, expiresAt },
          update: { isTyping, timestamp: now, expiresAt },
        });
      } else {
        await context.prisma.typing.deleteMany({ where: { messageRoomId, userId } });
      }

      const payload: TypingPayload = {
        messageRoomId,
        userId,
        isTyping,
        timestamp: now.getTime(),
      };
      await context.pubsub.publish(SUBSCRIPTION_EVENTS.TYPING_UPDATED, { typing: payload });

      return { success: true, messageRoomId, isTyping };
    },
  },
};
