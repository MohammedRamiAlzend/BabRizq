import { buildPaginated, Paginated } from './paginated';

describe('buildPaginated', () => {
  it('computes total pages and echoes the input page params', () => {
    const result = buildPaginated([1, 2, 3], 43, 3, 10);
    expect(result).toEqual({
      items: [1, 2, 3],
      totalItems: 43,
      page: 3,
      pageSize: 10,
      totalPages: 5,
    });
  });

  it('returns 0 total pages for an empty result set', () => {
    const result = Paginated.from([], 0, 1, 20);
    expect(result.totalPages).toBe(0);
  });

  it('rounds total pages up', () => {
    expect(Paginated.from([], 11, 1, 10).totalPages).toBe(2);
  });
});
