import { GraphQLError } from 'graphql';
import { Prisma } from '@prisma/client';
import { parseSearchQuery } from '../utils/parseSearchQuery';
import { attachPostCreators } from './utils/posts';
import type { GraphQLContext, PostQueryArgs } from '~/types/graphql';
import type * as Common from '~/types/common';

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

function isObjectId(id: string): boolean {
  return OBJECT_ID_PATTERN.test(id);
}

/**
 * Build a Prisma where/orderBy from PostQueryArgs.
 *
 * Supports:
 *  - `@username`  → filter posts by the user's id
 *  - `#hashtag`   → case-insensitive contains on `title` and `text`
 *  - plain text   → case-insensitive contains on `title` and `text`
 *    (Mongo `$text` is not available through Prisma; contains is the shared
 *    parameterized search pattern used by userResolver.searchUser)
 *  - date range, interactions, userId, tagId, approved filters
 */
async function buildPostQuery(
  args: PostQueryArgs,
  prisma: GraphQLContext['prisma']
): Promise<{
  where: Prisma.PostWhereInput;
  orderBy: Prisma.PostOrderByWithRelationInput[];
  earlyEmpty: boolean;
}> {
  const where: Prisma.PostWhereInput = { deleted: { not: true } };
  let orderBy: Prisma.PostOrderByWithRelationInput[] = [{ created: 'desc' }];
  const andConditions: Prisma.PostWhereInput[] = [];

  const searchKey = args.searchKey?.trim() ?? '';

  if (searchKey) {
    const parsed = parseSearchQuery(searchKey);

    if (parsed.usernames.length > 0) {
      const userDocs = await prisma.user.findMany({
        where: {
          OR: parsed.usernames.map((username) => ({
            username: { equals: username, mode: 'insensitive' },
          })),
        },
        select: { id: true },
      });

      if (userDocs.length === 0) {
        return { where, orderBy, earlyEmpty: true };
      }

      const userIds = userDocs.map((u) => u.id);
      where.userId = userIds.length === 1 ? userIds[0] : { in: userIds };
    }

    if (parsed.hashtags.length > 0) {
      for (const tag of parsed.hashtags) {
        andConditions.push({
          OR: [
            { title: { contains: `#${tag}`, mode: 'insensitive' } },
            { text: { contains: `#${tag}`, mode: 'insensitive' } },
          ],
        });
      }
    }

    if (parsed.textQuery) {
      andConditions.push({
        OR: [
          { title: { contains: parsed.textQuery, mode: 'insensitive' } },
          { text: { contains: parsed.textQuery, mode: 'insensitive' } },
        ],
      });
    }
  }

  if (args.startDateRange || args.endDateRange) {
    where.created = {
      ...(args.startDateRange ? { gte: new Date(args.startDateRange) } : {}),
      ...(args.endDateRange ? { lte: new Date(args.endDateRange) } : {}),
    };
  }

  if (args.userId) {
    if (!isObjectId(args.userId)) {
      throw new GraphQLError('Invalid userId format', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    where.userId = args.userId;
  }

  if (args.tagId) {
    if (!isObjectId(args.tagId)) {
      throw new GraphQLError('Invalid tagId format', {
        extensions: { code: 'BAD_USER_INPUT' },
      });
    }
    where.tagId = args.tagId;
  }

  if (args.approved !== undefined) {
    where.approved = args.approved ? { gt: 0 } : null;
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  if (args.sortOrder === 'asc') {
    orderBy = [{ created: 'asc' }];
  } else if (args.sortOrder === 'desc') {
    orderBy = [{ created: 'desc' }];
  }

  if (args.interactions) {
    orderBy = [{ dayPoints: 'desc' }, { created: 'desc' }];
  }

  return { where, orderBy, earlyEmpty: false };
}

export const postsResolver = {
  Query: {
    posts: async (
      _parent: unknown,
      args: PostQueryArgs,
      context: GraphQLContext
    ): Promise<Common.PaginatedResult<Common.Post>> => {
      const limit = args.limit ?? 15;
      const offset = args.offset ?? 0;

      const { where, orderBy, earlyEmpty } = await buildPostQuery(args, context.prisma);

      if (earlyEmpty) {
        return {
          entities: [],
          pagination: { total_count: 0, limit, offset },
        };
      }

      const [totalPosts, posts] = await Promise.all([
        context.prisma.post.count({ where }),
        context.prisma.post.findMany({
          where,
          orderBy,
          skip: offset,
          take: limit,
        }),
      ]);

      if (posts.length === 0) {
        return {
          entities: [],
          pagination: { total_count: totalPosts, limit, offset },
        };
      }

      const entities = await attachPostCreators(context.prisma, posts);

      return {
        entities,
        pagination: { total_count: totalPosts, limit, offset },
      };
    },
  },
};
