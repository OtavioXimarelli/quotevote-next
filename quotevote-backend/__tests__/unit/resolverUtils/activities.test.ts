/**
 * Test suite for activity logging resolver utility.
 */

import type { PrismaClient } from '@prisma/client';
import { logActivity, toActivityEntity } from '~/data/resolvers/utils/activities';
import type { ActivityIds } from '~/data/resolvers/utils/activities';

// Mock the logger
jest.mock('~/data/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

function mockPrisma() {
  const create = jest.fn().mockResolvedValue({ id: 'activity-1' });
  const prisma = { activity: { create } } as unknown as Pick<PrismaClient, 'activity'>;
  return { prisma, create };
}

describe('activities resolver utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('toActivityEntity', () => {
    it('maps id to _id and null optional fields to undefined', () => {
      const created = new Date('2024-01-01T00:00:00Z');

      expect(
        toActivityEntity({
          id: 'a1',
          userId: 'u1',
          postId: 'p1',
          voteId: null,
          commentId: null,
          quoteId: 'q1',
          activityType: 'QUOTED',
          content: null,
          created,
        })
      ).toEqual({
        _id: 'a1',
        userId: 'u1',
        postId: 'p1',
        voteId: undefined,
        commentId: undefined,
        quoteId: 'q1',
        activityType: 'QUOTED',
        content: undefined,
        created,
      });
    });
  });

  describe('logActivity', () => {
    it('creates a new activity through Prisma', async () => {
      const { prisma, create } = mockPrisma();
      const ids: ActivityIds = { userId: 'user1', postId: 'post1' };

      await logActivity(prisma, 'POSTED', ids, 'Test content');

      expect(create).toHaveBeenCalledWith({
        data: {
          activityType: 'POSTED',
          userId: 'user1',
          postId: 'post1',
          content: 'Test content',
          created: expect.any(Date),
        },
        select: { id: true },
      });
    });

    it('handles activity without content', async () => {
      const { prisma, create } = mockPrisma();
      const ids: ActivityIds = { userId: 'user1', voteId: 'vote1' };

      await logActivity(prisma, 'VOTED', ids);

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            activityType: 'VOTED',
            userId: 'user1',
            voteId: 'vote1',
            content: undefined,
          }),
        })
      );
    });

    it('handles activity with all optional ids', async () => {
      const { prisma, create } = mockPrisma();
      const ids: ActivityIds = {
        userId: 'user1',
        postId: 'post1',
        voteId: 'vote1',
        commentId: 'comment1',
        quoteId: 'quote1',
      };

      await logActivity(prisma, 'COMMENTED', ids, 'A comment');

      expect(create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            activityType: 'COMMENTED',
            userId: 'user1',
            postId: 'post1',
            voteId: 'vote1',
            commentId: 'comment1',
            quoteId: 'quote1',
            content: 'A comment',
          }),
        })
      );
    });
  });
});
