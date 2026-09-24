/**
 * Test suite for post resolver utilities.
 */

import { attachPostCreators, updateTrending } from '~/data/resolvers/utils/posts';
import type { PrismaClient } from '@prisma/client';

function mockPrisma() {
  return {
    post: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    user: {
      findMany: jest.fn(),
    },
  } as unknown as Pick<PrismaClient, 'post' | 'user'>;
}

describe('posts resolver utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('updateTrending', () => {
    it('should do nothing if post is not found', async () => {
      const prisma = mockPrisma();
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      await updateTrending(prisma, 'nonexistent');

      expect(prisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent' },
        select: { pointTimestamp: true, dayPoints: true },
      });
      expect(prisma.post.update).not.toHaveBeenCalled();
    });

    it('should increment dayPoints if pointTimestamp is within 24 hours', async () => {
      const prisma = mockPrisma();
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 1);

      (prisma.post.findUnique as jest.Mock).mockResolvedValue({
        pointTimestamp: recentDate,
        dayPoints: 5,
      });

      await updateTrending(prisma, 'post1');

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post1' },
        data: {
          pointTimestamp: expect.any(Date),
          dayPoints: 6,
        },
      });
    });

    it('should reset dayPoints to 1 if pointTimestamp is older than 24 hours', async () => {
      const prisma = mockPrisma();
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 2);

      (prisma.post.findUnique as jest.Mock).mockResolvedValue({
        pointTimestamp: oldDate,
        dayPoints: 100,
      });

      await updateTrending(prisma, 'post2');

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post2' },
        data: {
          pointTimestamp: expect.any(Date),
          dayPoints: 1,
        },
      });
    });

    it('should reset dayPoints when pointTimestamp is not a Date', async () => {
      const prisma = mockPrisma();
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({
        pointTimestamp: 'not-a-date',
        dayPoints: 10,
      });

      await updateTrending(prisma, 'post3');

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post3' },
        data: {
          pointTimestamp: expect.any(Date),
          dayPoints: 1,
        },
      });
    });

    it('should handle post with no existing dayPoints (null/undefined)', async () => {
      const prisma = mockPrisma();
      const recentDate = new Date();

      (prisma.post.findUnique as jest.Mock).mockResolvedValue({
        pointTimestamp: recentDate,
        dayPoints: undefined,
      });

      await updateTrending(prisma, 'post4');

      expect(prisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post4' },
        data: {
          pointTimestamp: expect.any(Date),
          dayPoints: 1,
        },
      });
    });
  });

  describe('attachPostCreators', () => {
    it('returns an empty array without querying users', async () => {
      const prisma = mockPrisma();
      const result = await attachPostCreators(prisma, []);
      expect(result).toEqual([]);
      expect(prisma.user.findMany).not.toHaveBeenCalled();
    });
  });
});
