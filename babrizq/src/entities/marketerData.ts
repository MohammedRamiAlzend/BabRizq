export interface AffiliateLink {
  id: string;
  url: string;
  targetNameEn: string;
  targetNameAr: string;
  type: 'store' | 'product';
  clicks: number;
  conversions: number;
  earned: number;
  createdAt: string;
}

export interface AffiliateTarget {
  id: string;
  nameEn: string;
  nameAr: string;
  type: 'store' | 'product';
}

export const AFFILIATE_TARGETS: AffiliateTarget[] = [
  { id: 's1', nameEn: 'TechZone', nameAr: 'تك زون', type: 'store' },
  { id: 's2', nameEn: 'Leather House', nameAr: 'بيت الجلود', type: 'store' },
  { id: 's3', nameEn: 'Time Gallery', nameAr: 'معرض الوقت', type: 'store' },
  { id: 's4', nameEn: 'Scent Palace', nameAr: 'قصر العطور', type: 'store' },
  { id: 'p1', nameEn: 'Premium Wireless Headphones', nameAr: 'سماعات لاسلكية فاخرة', type: 'product' },
  { id: 'p2', nameEn: 'Gold Wristwatch', nameAr: 'ساعة يد ذهبية', type: 'product' },
  { id: 'p3', nameEn: 'Arabian Oud Perfume', nameAr: 'عطر عود عربي', type: 'product' },
  { id: 'p4', nameEn: 'Flagship Smartphone', nameAr: 'هاتف ذكي رائد', type: 'product' },
  { id: 'p5', nameEn: 'Leather Messenger Bag', nameAr: 'حقيبة جلدية كلاسيكية', type: 'product' },
];

export const INITIAL_LINKS: AffiliateLink[] = [
  { id: 'al1', url: 'babrizq.com/store/s1?ref=marketer1', targetNameEn: 'TechZone', targetNameAr: 'تك زون', type: 'store', clicks: 1243, conversions: 87, earned: 1305, createdAt: '2026-03-15' },
  { id: 'al2', url: 'babrizq.com/product/p2?ref=marketer1', targetNameEn: 'Gold Wristwatch', targetNameAr: 'ساعة يد ذهبية', type: 'product', clicks: 856, conversions: 34, earned: 782, createdAt: '2026-03-20' },
  { id: 'al3', url: 'babrizq.com/product/p3?ref=marketer1', targetNameEn: 'Arabian Oud Perfume', targetNameAr: 'عطر عود عربي', type: 'product', clicks: 2105, conversions: 156, earned: 1716, createdAt: '2026-03-22' },
  { id: 'al4', url: 'babrizq.com/store/s2?ref=marketer1', targetNameEn: 'Leather House', targetNameAr: 'بيت الجلود', type: 'store', clicks: 432, conversions: 21, earned: 378, createdAt: '2026-04-01' },
  { id: 'al5', url: 'babrizq.com/product/p1?ref=marketer1', targetNameEn: 'Premium Wireless Headphones', targetNameAr: 'سماعات لاسلكية فاخرة', type: 'product', clicks: 678, conversions: 45, earned: 675, createdAt: '2026-04-03' },
];









