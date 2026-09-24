import type { PrismaClient } from '@prisma/client';
import {
  POST_CREATOR_SELECT,
  toGraphQLPost,
  type GraphQLPost,
  type PrismaPostRecord,
} from '~/data/utils/postPrismaMapper';

type PostsPrisma = Pick<PrismaClient, 'post' | 'user'>;

/**
 * Update trending metrics for a post.
 * Resets dayPoints if the post's pointTimestamp is older than 24 hours,
 * otherwise increments dayPoints by 1.
 */
export const updateTrending = async (prisma: PostsPrisma, postId: string): Promise<void> => {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { pointTimestamp: true, dayPoints: true },
  });
  if (!post) return;

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const isWithin24hrs = post.pointTimestamp instanceof Date && post.pointTimestamp >= oneDayAgo;

  await prisma.post.update({
    where: { id: postId },
    data: {
      pointTimestamp: new Date(),
      dayPoints: isWithin24hrs ? (post.dayPoints ?? 0) + 1 : 1,
    },
  });
};

/**
 * Batch-load post authors and attach them as `creator` on the GraphQL shape.
 */
export async function attachPostCreators(
  prisma: PostsPrisma,
  posts: PrismaPostRecord[]
): Promise<GraphQLPost[]> {
  if (posts.length === 0) return [];

  const uniqueUserIds = [...new Set(posts.map((p) => p.userId))];
  const creators = await prisma.user.findMany({
    where: { id: { in: uniqueUserIds } },
    select: POST_CREATOR_SELECT,
  });
  const creatorMap = new Map(creators.map((c) => [c.id, c]));

  return posts.map((post) => toGraphQLPost(post, creatorMap.get(post.userId) ?? null));
}
