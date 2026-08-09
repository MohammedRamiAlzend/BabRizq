/**
 * Unit tests for storefront constants — the "Browse by Topic" tag-group
 * logic and the fallback label behavior.
 */
import { buildTagGroups, tagLabel } from './storefront.constants';

const product = (tags: string[]) => ({ tags });

describe('buildTagGroups', () => {
  it('groups products by tag and orders groups by count desc', () => {
    const groups = buildTagGroups([
      product(['wireless', 'audio']),
      product(['wireless']),
      product(['leather']),
      product(['leather']),
      product(['leather']),
      product(['audio']),
    ]);

    expect(groups.map((g) => g.tag)).toEqual(['leather', 'wireless', 'audio']);
    expect(groups[0].products).toHaveLength(3);
    expect(groups[1].products).toHaveLength(2);
  });

  it('drops tags with fewer than 2 products when the category is large', () => {
    const groups = buildTagGroups([
      product(['rare']),
      product(['common']),
      product(['common']),
      product(['common']),
      product(['common']),
      product(['common']),
    ]);

    expect(groups.map((g) => g.tag)).toEqual(['common']);
  });

  it('keeps single-product tags when the category has fewer than 4 products', () => {
    const groups = buildTagGroups([product(['solo']), product(['other'])]);
    expect(groups.map((g) => g.tag).sort()).toEqual(['other', 'solo']);
  });

  it('caps the number of groups at 5', () => {
    const groups = buildTagGroups(
      [
        product(['a', 'b', 'c', 'd', 'e', 'f']),
        product(['a', 'b', 'c', 'd', 'e', 'f']),
        product(['a', 'b', 'c', 'd', 'e', 'f']),
        product(['a', 'b', 'c', 'd', 'e', 'f']),
        product(['a', 'b', 'c', 'd', 'e', 'f']),
        product(['a', 'b', 'c', 'd', 'e', 'f']),
      ],
    );
    expect(groups).toHaveLength(5);
  });

  it('resolves known tags to their bilingual labels', () => {
    const groups = buildTagGroups([product(['wireless']), product(['wireless'])]);
    expect(groups[0]).toMatchObject({
      tag: 'wireless',
      labelEn: 'Wireless & Bluetooth',
      labelAr: 'لاسلكي وبلوتوث',
    });
  });
});

describe('tagLabel', () => {
  it('returns the fallback prettified label for unknown tags', () => {
    expect(tagLabel('fast-shipping')).toEqual({
      labelEn: 'Fast shipping',
      labelAr: 'Fast shipping',
    });
  });
});
