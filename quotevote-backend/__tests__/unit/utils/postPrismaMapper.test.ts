/**
 * Unit tests for the Prisma → GraphQL Post mapper.
 */

import { toGraphQLPost, type PrismaPostRecord } from '~/data/utils/postPrismaMapper';

function basePost(overrides: Partial<PrismaPostRecord> = {}): PrismaPostRecord {
  return {
    id: '507f1f77bcf86cd799439011',
    userId: '507f1f77bcf86cd799439012',
    tagId: '507f1f77bcf86cd799439013',
    title: 'A title',
    text: 'A body',
    created: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('postPrismaMapper.toGraphQLPost', () => {
  it('maps Prisma id → _id and enableVoting → enable_voting', () => {
    const result = toGraphQLPost(basePost({ enableVoting: true }));
    expect(result._id).toBe('507f1f77bcf86cd799439011');
    expect(result.tagId).toBe('507f1f77bcf86cd799439013');
    expect(result.enable_voting).toBe(true);
  });

  it('defaults votedBy to an empty array and attaches creator', () => {
    const result = toGraphQLPost(basePost({ votedBy: undefined }), {
      id: '507f1f77bcf86cd799439012',
      username: 'alice',
      name: 'Alice',
    });
    expect(result.votedBy).toEqual([]);
    expect(result.creator).toMatchObject({
      _id: '507f1f77bcf86cd799439012',
      username: 'alice',
    });
  });

  it('sets creator to null when no author is provided', () => {
    const result = toGraphQLPost(basePost());
    expect(result.creator).toBeNull();
  });
});
