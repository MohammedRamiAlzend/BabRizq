/**
 * Product entity — mock API.
 *
 * Simulates the backend product endpoints from
 * `docs/needed-endpoints-from-backend.md` (see the `TODO(migration)` comments on
 * each function for the exact endpoint it replaces). Functions are intentionally
 * async + `setTimeout`-delayed so swapping them for real `fetch` calls is a
 * 1:1 drop-in when the backend lands.
 *
 * Mock data is copied verbatim from the legacy monolith — do not change product
 * content here without updating the UI consumers.
 */
import { Product } from './model';
import headphonesImg from '@/assets/products/headphones.jpg';
import bagImg from '@/assets/products/bag.jpg';
import watchImg from '@/assets/products/watch.jpg';
import sunglassesImg from '@/assets/products/sunglasses.jpg';
import sneakersImg from '@/assets/products/sneakers.jpg';
import perfumeImg from '@/assets/products/perfume.jpg';
import phoneImg from '@/assets/products/phone.jpg';
import scarfImg from '@/assets/products/scarf.jpg';

/** In-memory catalogue. TODO(migration): replaced by `GET /api/products`. */
export const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    nameEn: 'Premium Wireless Headphones',
    nameAr: 'سماعات لاسلكية فاخرة',
    price: 299,
    originalPrice: 399,
    descriptionEn: 'High-fidelity sound with active noise cancellation and 30-hour battery life.',
    descriptionAr: 'صوت عالي الدقة مع إلغاء الضوضاء النشط وعمر بطارية 30 ساعة.',
    storeId: 'techzone',
    storeNameEn: 'TechZone',
    storeNameAr: 'تك زون',
    image: headphonesImg,
    categoryEn: 'Electronics',
    categoryAr: 'إلكترونيات',
    storeCategoryId: 'tc-audio',
    tags: ['wireless', 'audio', 'noise-cancellation'],
    rating: 4.8,
    reviewCount: 312,
    isFeatured: true,
  },
  {
    id: '2',
    nameEn: 'Leather Messenger Bag',
    nameAr: 'حقيبة جلدية كلاسيكية',
    price: 189,
    descriptionEn: 'Handcrafted genuine leather bag with brass buckles and adjustable strap.',
    descriptionAr: 'حقيبة جلد طبيعي مصنوعة يدوياً مع إبزيمات نحاسية وحزام قابل للتعديل.',
    storeId: 'leather-house',
    storeNameEn: 'Leather House',
    storeNameAr: 'بيت الجلود',
    image: bagImg,
    categoryEn: 'Accessories',
    categoryAr: 'إكسسوارات',
    storeCategoryId: 'lh-bags',
    tags: ['leather', 'bags', 'handcrafted'],
    rating: 4.6,
    reviewCount: 178,
    isNew: true,
  },
  {
    id: '3',
    nameEn: 'Gold Wristwatch',
    nameAr: 'ساعة يد ذهبية',
    price: 459,
    originalPrice: 599,
    descriptionEn: 'Elegant gold-plated timepiece with sapphire crystal and Swiss movement.',
    descriptionAr: 'ساعة أنيقة مطلية بالذهب مع كريستال ياقوتي وحركة سويسرية.',
    storeId: 'time-gallery',
    storeNameEn: 'Time Gallery',
    storeNameAr: 'معرض الوقت',
    image: watchImg,
    categoryEn: 'Watches',
    categoryAr: 'ساعات',
    storeCategoryId: 'tg-gold',
    tags: ['luxury', 'gold', 'swiss-made'],
    rating: 4.9,
    reviewCount: 94,
    isFeatured: true,
  },
  {
    id: '4',
    nameEn: 'Aviator Sunglasses',
    nameAr: 'نظارات شمسية أفياتور',
    price: 129,
    originalPrice: 179,
    descriptionEn: 'UV400 protection with polarized lenses and lightweight gold frame.',
    descriptionAr: 'حماية UV400 مع عدسات مستقطبة وإطار ذهبي خفيف الوزن.',
    storeId: 'optic-style',
    storeNameEn: 'Optic Style',
    storeNameAr: 'أوبتك ستايل',
    image: sunglassesImg,
    categoryEn: 'Accessories',
    categoryAr: 'إكسسوارات',
    storeCategoryId: 'os-sun',
    tags: ['eyewear', 'uv-protection', 'polarized'],
    rating: 4.5,
    reviewCount: 241,
    isFeatured: true,
  },
  {
    id: '5',
    nameEn: 'Classic White Sneakers',
    nameAr: 'حذاء رياضي أبيض كلاسيكي',
    price: 159,
    descriptionEn: 'Premium leather sneakers with cushioned sole for all-day comfort.',
    descriptionAr: 'حذاء رياضي جلد فاخر مع نعل مبطن لراحة طوال اليوم.',
    storeId: 'step-up',
    storeNameEn: 'Step Up',
    storeNameAr: 'ستيب أب',
    image: sneakersImg,
    categoryEn: 'Shoes',
    categoryAr: 'أحذية',
    storeCategoryId: 'su-casual',
    tags: ['casual', 'sneakers', 'leather-shoes'],
    rating: 4.4,
    reviewCount: 389,
    isNew: true,
  },
  {
    id: '6',
    nameEn: 'Arabian Oud Perfume',
    nameAr: 'عطر عود عربي',
    price: 219,
    originalPrice: 279,
    descriptionEn: 'Rich oud fragrance blended with amber and sandalwood notes.',
    descriptionAr: 'عطر عود غني ممزوج بنفحات العنبر وخشب الصندل.',
    storeId: 'scent-palace',
    storeNameEn: 'Scent Palace',
    storeNameAr: 'قصر العطور',
    image: perfumeImg,
    categoryEn: 'Perfumes',
    categoryAr: 'عطور',
    storeCategoryId: 'sp-mens',
    tags: ['arabic-fragrance', 'oud', 'mens-perfume'],
    rating: 4.7,
    reviewCount: 156,
    isFeatured: true,
  },
  {
    id: '7',
    nameEn: 'Flagship Smartphone',
    nameAr: 'هاتف ذكي رائد',
    price: 899,
    originalPrice: 1099,
    descriptionEn: 'Latest flagship with 6.7" AMOLED display and 108MP camera.',
    descriptionAr: 'أحدث هاتف رائد بشاشة AMOLED 6.7 بوصة وكاميرا 108 ميجابكسل.',
    storeId: 'techzone',
    storeNameEn: 'TechZone',
    storeNameAr: 'تك زون',
    image: phoneImg,
    categoryEn: 'Electronics',
    categoryAr: 'إلكترونيات',
    storeCategoryId: 'tc-phones',
    tags: ['flagship', 'smartphone', 'amoled'],
    rating: 4.9,
    reviewCount: 521,
    isFeatured: true,
  },
  {
    id: '8',
    nameEn: 'Wool Knitted Scarf',
    nameAr: 'وشاح صوف محبوك',
    price: 69,
    descriptionEn: 'Soft merino wool scarf in a warm camel tone, perfect for winter.',
    descriptionAr: 'وشاح صوف ميرينو ناعم بلون جملي دافئ، مثالي للشتاء.',
    storeId: 'cozy-corner',
    storeNameEn: 'Cozy Corner',
    storeNameAr: 'الركن الدافئ',
    image: scarfImg,
    categoryEn: 'Fashion',
    categoryAr: 'أزياء',
    storeCategoryId: 'cc-winter',
    tags: ['winter', 'knitwear', 'wool'],
    rating: 4.3,
    reviewCount: 87,
    isNew: true,
  },
  {
    id: '9',
    nameEn: 'Smart Fitness Band',
    nameAr: 'سوار لياقة ذكي',
    price: 149,
    originalPrice: 199,
    descriptionEn: 'Track heart rate, sleep, steps and receive smart notifications all day.',
    descriptionAr: 'تتبع معدل ضربات القلب والنوم والخطوات واستقبل الإشعارات الذكية طوال اليوم.',
    storeId: 'techzone',
    storeNameEn: 'TechZone',
    storeNameAr: 'تك زون',
    image: headphonesImg,
    categoryEn: 'Electronics',
    categoryAr: 'إلكترونيات',
    storeCategoryId: 'tc-wearables',
    tags: ['wearables', 'fitness', 'smartwatch'],
    rating: 4.5,
    reviewCount: 203,
    isNew: true,
  },
  {
    id: '10',
    nameEn: 'Rose Musk Perfume',
    nameAr: 'عطر المسك الوردي',
    price: 169,
    descriptionEn: 'Delicate floral musk with hints of rose and white amber — a timeless classic.',
    descriptionAr: 'مسك زهري رقيق بلمسات من الورد والعنبر الأبيض — كلاسيكي خالد.',
    storeId: 'scent-palace',
    storeNameEn: 'Scent Palace',
    storeNameAr: 'قصر العطور',
    image: perfumeImg,
    categoryEn: 'Perfumes',
    categoryAr: 'عطور',
    storeCategoryId: 'sp-womens',
    tags: ['floral', 'musk', 'womens-perfume'],
    rating: 4.6,
    reviewCount: 112,
  },
  {
    id: '11',
    nameEn: 'Silver Minimalist Watch',
    nameAr: 'ساعة فضية بسيطة',
    price: 289,
    originalPrice: 349,
    descriptionEn: 'Slim stainless-steel case with sapphire glass, water-resistant to 50m.',
    descriptionAr: 'هيكل رفيع من الفولاذ المقاوم للصدأ مع زجاج ياقوتي، مقاوم للماء حتى 50م.',
    storeId: 'time-gallery',
    storeNameEn: 'Time Gallery',
    storeNameAr: 'معرض الوقت',
    image: watchImg,
    categoryEn: 'Watches',
    categoryAr: 'ساعات',
    storeCategoryId: 'tg-silver',
    tags: ['minimalist', 'slim', 'everyday'],
    rating: 4.7,
    reviewCount: 64,
    isNew: true,
  },
  {
    id: '12',
    nameEn: 'Leather Wallet',
    nameAr: 'محفظة جلدية',
    price: 89,
    descriptionEn: 'Slim full-grain leather bifold wallet with RFID protection.',
    descriptionAr: 'محفظة جلدية رفيعة ثنائية الطي مع حماية RFID.',
    storeId: 'leather-house',
    storeNameEn: 'Leather House',
    storeNameAr: 'بيت الجلود',
    image: bagImg,
    categoryEn: 'Accessories',
    categoryAr: 'إكسسوارات',
    storeCategoryId: 'lh-wallets',
    tags: ['leather', 'slim-wallet', 'rfid'],
    rating: 4.4,
    reviewCount: 298,
  },
  // ── Additional products for richer hashtag discovery ─────────────────────────
  {
    id: '13',
    nameEn: "Woody Men's Cologne",
    nameAr: 'كولونيا رجالية خشبية',
    price: 189,
    originalPrice: 229,
    descriptionEn: 'A bold woody-spicy cologne with cedar, vetiver, and bergamot top notes.',
    descriptionAr: 'كولونيا رجالية جريئة بنفحات خشبية وتوابل مع أرز وفيتيفر وبرغموت.',
    storeId: 'scent-palace',
    storeNameEn: 'Scent Palace',
    storeNameAr: 'قصر العطور',
    image: perfumeImg,
    categoryEn: 'Perfumes',
    categoryAr: 'عطور',
    storeCategoryId: 'sp-mens',
    tags: ['mens-perfume', 'woody', 'cologne'],
    rating: 4.5,
    reviewCount: 88,
    isNew: true,
  },
  {
    id: '14',
    nameEn: "Light Kids' Cologne",
    nameAr: 'كولونيا أطفال خفيفة',
    price: 79,
    descriptionEn: 'Gentle floral and fruity fragrance crafted specially for children.',
    descriptionAr: 'عطر زهري وفاكهي لطيف مُصمَّم خصيصاً للأطفال.',
    storeId: 'scent-palace',
    storeNameEn: 'Scent Palace',
    storeNameAr: 'قصر العطور',
    image: perfumeImg,
    categoryEn: 'Perfumes',
    categoryAr: 'عطور',
    storeCategoryId: 'sp-kids',
    tags: ['kids-perfume', 'light', 'floral'],
    rating: 4.3,
    reviewCount: 54,
    isNew: true,
  },
  {
    id: '15',
    nameEn: 'Classic Oxford Shoes',
    nameAr: 'حذاء أوكسفورد كلاسيكي',
    price: 229,
    originalPrice: 289,
    descriptionEn: 'Hand-stitched leather Oxford shoes for formal and business occasions.',
    descriptionAr: 'حذاء جلد أوكسفورد مخاط يدوياً للمناسبات الرسمية وبيئة العمل.',
    storeId: 'step-up',
    storeNameEn: 'Step Up',
    storeNameAr: 'ستيب أب',
    image: sneakersImg,
    categoryEn: 'Shoes',
    categoryAr: 'أحذية',
    storeCategoryId: 'su-formal',
    tags: ['formal', 'leather-shoes', 'oxford'],
    rating: 4.6,
    reviewCount: 142,
    isFeatured: true,
  },
  {
    id: '16',
    nameEn: 'Sport Running Shoes',
    nameAr: 'حذاء جري رياضي',
    price: 189,
    originalPrice: 239,
    descriptionEn: 'Lightweight breathable running shoes with responsive cushioning.',
    descriptionAr: 'حذاء جري خفيف وقابل للتنفس مع تبطين متجاوب لأفضل أداء.',
    storeId: 'step-up',
    storeNameEn: 'Step Up',
    storeNameAr: 'ستيب أب',
    image: sneakersImg,
    categoryEn: 'Shoes',
    categoryAr: 'أحذية',
    storeCategoryId: 'su-sport',
    tags: ['sport', 'running', 'lightweight'],
    rating: 4.5,
    reviewCount: 267,
    isNew: true,
  },
  {
    id: '17',
    nameEn: 'True Wireless Earbuds',
    nameAr: 'سماعات لاسلكية حقيقية',
    price: 179,
    originalPrice: 219,
    descriptionEn: 'Compact TWS earbuds with 28-hour total playback and IPX5 sweat resistance.',
    descriptionAr: 'سماعات TWS صغيرة مع 28 ساعة تشغيل كاملة ومقاومة للعرق IPX5.',
    storeId: 'techzone',
    storeNameEn: 'TechZone',
    storeNameAr: 'تك زون',
    image: headphonesImg,
    categoryEn: 'Electronics',
    categoryAr: 'إلكترونيات',
    storeCategoryId: 'tc-audio',
    tags: ['wireless', 'audio', 'tws'],
    rating: 4.6,
    reviewCount: 318,
    isFeatured: true,
  },
  {
    id: '18',
    nameEn: 'Casual Denim Jacket',
    nameAr: 'جاكيت دينيم كاجوال',
    price: 139,
    descriptionEn: 'Classic straight-cut denim jacket — a timeless wardrobe staple.',
    descriptionAr: 'جاكيت دينيم بقصة مستقيمة كلاسيكية — أساسية خالدة في خزانة الملابس.',
    storeId: 'cozy-corner',
    storeNameEn: 'Cozy Corner',
    storeNameAr: 'الركن الدافئ',
    image: scarfImg,
    categoryEn: 'Fashion',
    categoryAr: 'أزياء',
    storeCategoryId: 'cc-casual',
    tags: ['casual', 'denim', 'jacket'],
    rating: 4.2,
    reviewCount: 73,
    isNew: true,
  },
];

/** Simulates `GET /api/products?page=&pageSize=&category=&store=&search=`. */
export async function getProducts(): Promise<Product[]> {
  return new Promise(resolve => setTimeout(() => resolve(MOCK_PRODUCTS), 100));
}

/** Simulates `GET /api/products/{id}`. */
export async function getProductById(id: string): Promise<Product | null> {
  return new Promise(resolve =>
    setTimeout(() => resolve(MOCK_PRODUCTS.find(p => p.id === id) || null), 100)
  );
}

/** Simulates `GET /api/stores/{storeId}/products`. */
export async function getProductsByStore(storeId: string): Promise<Product[]> {
  return new Promise(resolve =>
    setTimeout(() => resolve(MOCK_PRODUCTS.filter(p => p.storeId === storeId)), 100)
  );
}

/** Simulates `GET /api/products?category={categoryEn}`. */
export async function getProductsByCategory(categoryEn: string): Promise<Product[]> {
  return new Promise(resolve =>
    setTimeout(() => resolve(MOCK_PRODUCTS.filter(p => p.categoryEn === categoryEn)), 100)
  );
}

/**
 * Simulates `GET /api/products?search={query}`.
 * Matches against English/Arabic names, tags and platform category.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  return new Promise(resolve =>
    setTimeout(
      () =>
        resolve(
          q
            ? MOCK_PRODUCTS.filter(
                p =>
                  p.nameEn.toLowerCase().includes(q) ||
                  p.nameAr.includes(query.trim()) ||
                  p.tags.some(tag => tag.toLowerCase().includes(q)) ||
                  p.categoryEn.toLowerCase().includes(q)
              )
            : MOCK_PRODUCTS
        ),
      100
    )
  );
}

/**
 * Simulates `GET /api/products/recommended`.
 * Personalised suggestions: products in categories the user has shown interest
 * in first, then any featured product — deduplicated, max 6 results.
 */
export async function getRecommendedProducts(interests: string[] = []): Promise<Product[]> {
  return new Promise(resolve =>
    setTimeout(() => {
      const interestSet = new Set(interests);
      const ranked = [...MOCK_PRODUCTS].sort((a, b) => {
        const aHit = interestSet.has(a.categoryEn) ? 1 : 0;
        const bHit = interestSet.has(b.categoryEn) ? 1 : 0;
        return bHit - aHit || (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      });
      resolve(ranked.slice(0, 6));
    }, 100)
  );
}
