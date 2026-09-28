import { GraphQLObjectType, GraphQLString, type GraphQLFieldConfigMap } from 'graphql';
import type { GraphQLContext } from '~/types/graphql';
import type * as Common from '~/types/common';
import { UserType } from './User';
import { MessageType } from './Message';
import { toPublicUser } from '~/data/utils/userPrismaMapper';

export const ReactionType: GraphQLObjectType<Common.Reaction, GraphQLContext> =
  new GraphQLObjectType<Common.Reaction, GraphQLContext>({
    name: 'Reaction',
    description: 'Emoji reaction on a message or action (vote/comment/etc).',
    fields: (): GraphQLFieldConfigMap<Common.Reaction, GraphQLContext> => ({
      _id: { type: GraphQLString },
      created: { type: GraphQLString },
      userId: { type: GraphQLString },
      messageId: { type: GraphQLString },
      actionId: { type: GraphQLString },
      emoji: { type: GraphQLString },
      user: {
        type: UserType,
        resolve: async (rxn, _args, context) => {
          const user = await context.prisma.user.findUnique({ where: { id: rxn.userId } });
          return user ? toPublicUser(user) : null;
        },
      },
      message: {
        type: MessageType,
        resolve: async (rxn, _args, context) => {
          if (!rxn.messageId) return null;
          const message = await context.prisma.message.findUnique({
            where: { id: rxn.messageId },
          });
          if (!message) return null;
          return {
            _id: message.id,
            messageRoomId: message.messageRoomId,
            userId: message.userId,
            userName: message.userName ?? undefined,
            title: message.title ?? undefined,
            text: message.text,
            type: (message.type as Common.MessageType | undefined) ?? undefined,
            mutation_type: message.mutationType ?? undefined,
            deleted: message.deleted,
            readBy: message.readBy,
            readByDetailed: message.readByDetailed,
            deliveredTo: message.deliveredTo,
            created: message.created,
            updatedAt: message.updatedAt,
          } satisfies Common.Message;
        },
      },
    }),
  });

export const Reaction = ReactionType;
