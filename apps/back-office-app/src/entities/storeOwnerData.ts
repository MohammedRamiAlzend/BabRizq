// ─── Currency ───────────────────────────────────────────────────────────────

export interface CurrencyOption {
  code: string;
  nameEn: string;
  nameAr: string;
  symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'SAR', nameEn: 'Saudi Riyal', nameAr: 'ريال سعودي', symbol: 'ر.س' },
  { code: 'USD', nameEn: 'US Dollar', nameAr: 'دولار أمريكي', symbol: '$' },
  { code: 'SYP', nameEn: 'Syrian Pound', nameAr: 'ليرة سورية', symbol: 'ل.س' },
  { code: 'AED', nameEn: 'UAE Dirham', nameAr: 'درهم إماراتي', symbol: 'د.إ' },
  { code: 'EUR', nameEn: 'Euro', nameAr: 'يورو', symbol: '€' },
  { code: 'GBP', nameEn: 'British Pound', nameAr: 'جنيه إسترليني', symbol: '£' },
  { code: 'KWD', nameEn: 'Kuwaiti Dinar', nameAr: 'دينار كويتي', symbol: 'د.ك' },
  { code: 'QAR', nameEn: 'Qatari Riyal', nameAr: 'ريال قطري', symbol: 'ر.ق' },
  { code: 'TRY', nameEn: 'Turkish Lira', nameAr: 'ليرة تركية', symbol: '₺' },
];

// ─── Product ─────────────────────────────────────────────────────────────────

export interface PriceEntry {
  currency: string;
  amount: number;
  date: string;
}

export interface CurrencyPrice {
  currency: string;
  amount: number;
}

export interface StoreProduct {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  descriptionEn2?: string;
  descriptionAr2?: string;
  images: string[];
  price: number;
  currencyPrices: CurrencyPrice[];
  priceHistory: PriceEntry[];
  stock: number;
  categoryId: string;
  categoryEn: string;
  categoryAr: string;
  image: string;
  barcode?: string;
  sku?: string;
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface StoreCategory {
  id: string;
  nameEn: string;
  nameAr: string;
  iconOrEmoji: string;
  productsCount: number;
}

// ─── Order ───────────────────────────────────────────────────────────────────

export interface StoreOrder {
  id: string;
  orderNumber: string;
  customerNameEn: string;
  customerNameAr: string;
  customerAddress?: string;
  items: { nameEn: string; nameAr: string; qty: number; price: number }[];
  total: number;
  currency: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  date: string;
}

// ─── Offer ───────────────────────────────────────────────────────────────────

export interface Offer {
  id: string;
  nameEn: string;
  nameAr: string;
  type: 'product' | 'category' | 'segment';
  targetId: string;
  targetNameEn: string;
  targetNameAr: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  currency?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// ─── Chat ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  sender: 'owner' | 'admin';
  textEn: string;
  textAr: string;
  timestamp: string;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

export const STORE_CATEGORIES: StoreCategory[] = [
  { id: 'cat1', nameEn: 'Electronics', nameAr: 'إلكترونيات', iconOrEmoji: '📱', productsCount: 2 },
  { id: 'cat2', nameEn: 'Accessories', nameAr: 'إكسسوارات', iconOrEmoji: '👜', productsCount: 2 },
  { id: 'cat3', nameEn: 'Watches', nameAr: 'ساعات', iconOrEmoji: '⌚', productsCount: 1 },
  { id: 'cat4', nameEn: 'Shoes', nameAr: 'أحذية', iconOrEmoji: '👟', productsCount: 1 },
  { id: 'cat5', nameEn: 'Perfumes', nameAr: 'عطور', iconOrEmoji: '🌹', productsCount: 1 },
  { id: 'cat6', nameEn: 'Fashion', nameAr: 'أزياء', iconOrEmoji: '👗', productsCount: 1 },
];

export const STORE_PRODUCTS: StoreProduct[] = [
  {
    id: 'sp1', nameEn: 'Premium Wireless Headphones', nameAr: 'سماعات لاسلكية فاخرة',
    descriptionEn: 'High-quality wireless headphones with active noise cancellation and 30-hour battery life.',
    descriptionAr: 'سماعات لاسلكية عالية الجودة مع إلغاء الضوضاء النشط وعمر بطارية 30 ساعة.',
    descriptionEn2: 'Bluetooth 5.0, foldable design, premium carrying case included.',
    descriptionAr2: 'بلوتوث 5.0، تصميم قابل للطي، حقيبة حمل فاخرة مضمنة.',
    images: [], image: '',
    price: 299, stock: 45, categoryId: 'cat1', categoryEn: 'Electronics', categoryAr: 'إلكترونيات',
    sku: 'ELEC-001',
    currencyPrices: [
      { currency: 'SAR', amount: 299 }, { currency: 'USD', amount: 80 },
      { currency: 'AED', amount: 294 }, { currency: 'SYP', amount: 200000 },
    ],
    priceHistory: [
      { currency: 'SAR', amount: 349, date: '2026-01-01' },
      { currency: 'SAR', amount: 319, date: '2026-02-15' },
      { currency: 'SAR', amount: 299, date: '2026-04-01' },
    ],
  },
  {
    id: 'sp2', nameEn: 'Leather Messenger Bag', nameAr: 'حقيبة جلدية كلاسيكية',
    descriptionEn: 'Genuine leather messenger bag with laptop compartment.',
    descriptionAr: 'حقيبة جلد طبيعي مع مقصورة للكمبيوتر المحمول.',
    images: [], image: '',
    price: 189, stock: 23, categoryId: 'cat2', categoryEn: 'Accessories', categoryAr: 'إكسسوارات',
    sku: 'ACC-001',
    currencyPrices: [
      { currency: 'SAR', amount: 189 }, { currency: 'USD', amount: 50 }, { currency: 'AED', amount: 185 },
    ],
    priceHistory: [
      { currency: 'SAR', amount: 220, date: '2026-01-01' },
      { currency: 'SAR', amount: 189, date: '2026-03-01' },
    ],
  },
  {
    id: 'sp3', nameEn: 'Gold Wristwatch', nameAr: 'ساعة يد ذهبية',
    descriptionEn: 'Luxury gold-plated wristwatch with sapphire crystal glass.',
    descriptionAr: 'ساعة يد مطلية بالذهب مع زجاج كريستال الياقوت.',
    images: [], image: '',
    price: 459, stock: 12, categoryId: 'cat3', categoryEn: 'Watches', categoryAr: 'ساعات',
    sku: 'WATCH-001',
    currencyPrices: [
      { currency: 'SAR', amount: 459 }, { currency: 'USD', amount: 122 }, { currency: 'AED', amount: 450 },
    ],
    priceHistory: [
      { currency: 'SAR', amount: 499, date: '2026-01-01' },
      { currency: 'SAR', amount: 459, date: '2026-03-15' },
    ],
  },
  {
    id: 'sp4', nameEn: 'Aviator Sunglasses', nameAr: 'نظارات شمسية أفياتور',
    descriptionEn: 'Classic aviator sunglasses with UV400 protection.',
    descriptionAr: 'نظارات شمسية كلاسيكية بحماية UV400.',
    images: [], image: '',
    price: 129, stock: 67, categoryId: 'cat2', categoryEn: 'Accessories', categoryAr: 'إكسسوارات',
    sku: 'ACC-002',
    currencyPrices: [
      { currency: 'SAR', amount: 129 }, { currency: 'USD', amount: 34 }, { currency: 'AED', amount: 126 },
    ],
    priceHistory: [{ currency: 'SAR', amount: 129, date: '2026-01-01' }],
  },
  {
    id: 'sp5', nameEn: 'Classic White Sneakers', nameAr: 'حذاء رياضي أبيض',
    descriptionEn: 'Premium leather white sneakers, comfortable and stylish.',
    descriptionAr: 'حذاء رياضي أبيض من الجلد الفاخر، مريح وأنيق.',
    images: [], image: '',
    price: 159, stock: 3, categoryId: 'cat4', categoryEn: 'Shoes', categoryAr: 'أحذية',
    sku: 'SHOE-001',
    currencyPrices: [
      { currency: 'SAR', amount: 159 }, { currency: 'USD', amount: 42 },
    ],
    priceHistory: [
      { currency: 'SAR', amount: 199, date: '2026-01-01' },
      { currency: 'SAR', amount: 159, date: '2026-02-01' },
    ],
  },
  {
    id: 'sp6', nameEn: 'Arabian Oud Perfume', nameAr: 'عطر عود عربي',
    descriptionEn: 'Authentic Arabic oud perfume, rich and long-lasting fragrance.',
    descriptionAr: 'عطر عود عربي أصيل، رائحة غنية وطويلة الأمد.',
    images: [], image: '',
    price: 219, stock: 31, categoryId: 'cat5', categoryEn: 'Perfumes', categoryAr: 'عطور',
    sku: 'PERF-001',
    currencyPrices: [
      { currency: 'SAR', amount: 219 }, { currency: 'USD', amount: 58 }, { currency: 'AED', amount: 215 },
    ],
    priceHistory: [{ currency: 'SAR', amount: 219, date: '2026-01-01' }],
  },
  {
    id: 'sp7', nameEn: 'Flagship Smartphone', nameAr: 'هاتف ذكي رائد',
    descriptionEn: '6.7" OLED display, 256GB storage, 108MP camera system.',
    descriptionAr: 'شاشة OLED 6.7 بوصة، تخزين 256 جيجا، نظام كاميرا 108 ميجابكسل.',
    images: [], image: '',
    price: 899, stock: 8, categoryId: 'cat1', categoryEn: 'Electronics', categoryAr: 'إلكترونيات',
    sku: 'ELEC-002',
    currencyPrices: [
      { currency: 'SAR', amount: 899 }, { currency: 'USD', amount: 240 }, { currency: 'AED', amount: 880 },
    ],
    priceHistory: [
      { currency: 'SAR', amount: 999, date: '2026-01-01' },
      { currency: 'SAR', amount: 949, date: '2026-02-15' },
      { currency: 'SAR', amount: 899, date: '2026-04-01' },
    ],
  },
  {
    id: 'sp8', nameEn: 'Wool Knitted Scarf', nameAr: 'وشاح صوف محبوك',
    descriptionEn: 'Soft merino wool scarf, available in multiple colors.',
    descriptionAr: 'وشاح من الصوف المرينو الناعم، متاح بألوان متعددة.',
    images: [], image: '',
    price: 69, stock: 0, categoryId: 'cat6', categoryEn: 'Fashion', categoryAr: 'أزياء',
    sku: 'FASH-001',
    currencyPrices: [
      { currency: 'SAR', amount: 69 }, { currency: 'USD', amount: 18 },
    ],
    priceHistory: [{ currency: 'SAR', amount: 69, date: '2026-01-01' }],
  },
];

export const STORE_ORDERS: StoreOrder[] = [
  {
    id: 'o1', orderNumber: '#BRQ-1042',
    customerNameEn: 'Ahmed Al-Rashid', customerNameAr: 'أحمد الراشد',
    customerAddress: 'Riyadh, Al Olaya, Street 12',
    items: [
      { nameEn: 'Gold Wristwatch', nameAr: 'ساعة يد ذهبية', qty: 1, price: 459 },
      { nameEn: 'Aviator Sunglasses', nameAr: 'نظارات شمسية', qty: 2, price: 129 },
    ],
    total: 717, currency: 'SAR', status: 'pending', date: '2026-04-06',
  },
  {
    id: 'o2', orderNumber: '#BRQ-1041',
    customerNameEn: 'Sara Mansour', customerNameAr: 'سارة منصور',
    customerAddress: 'Jeddah, Al Hamra District',
    items: [{ nameEn: 'Premium Headphones', nameAr: 'سماعات فاخرة', qty: 1, price: 299 }],
    total: 299, currency: 'SAR', status: 'processing', date: '2026-04-05',
  },
  {
    id: 'o3', orderNumber: '#BRQ-1039',
    customerNameEn: 'Khalid Nasser', customerNameAr: 'خالد ناصر',
    customerAddress: 'Dammam, Al Faisaliyah',
    items: [
      { nameEn: 'Leather Bag', nameAr: 'حقيبة جلدية', qty: 1, price: 189 },
      { nameEn: 'Wool Scarf', nameAr: 'وشاح صوف', qty: 1, price: 69 },
    ],
    total: 258, currency: 'SAR', status: 'pending', date: '2026-04-05',
  },
  {
    id: 'o4', orderNumber: '#BRQ-1037',
    customerNameEn: 'Fatima Al-Harbi', customerNameAr: 'فاطمة الحربي',
    customerAddress: 'Riyadh, Al Malaz',
    items: [{ nameEn: 'Flagship Smartphone', nameAr: 'هاتف ذكي رائد', qty: 1, price: 899 }],
    total: 899, currency: 'SAR', status: 'processing', date: '2026-04-04',
  },
  {
    id: 'o5', orderNumber: '#BRQ-1035',
    customerNameEn: 'Omar Yusuf', customerNameAr: 'عمر يوسف',
    customerAddress: 'Mecca, Al Aziziyah',
    items: [
      { nameEn: 'White Sneakers', nameAr: 'حذاء أبيض', qty: 1, price: 159 },
      { nameEn: 'Arabian Oud', nameAr: 'عطر عود', qty: 1, price: 219 },
    ],
    total: 378, currency: 'SAR', status: 'shipped', date: '2026-04-03',
  },
  {
    id: 'o6', orderNumber: '#BRQ-1032',
    customerNameEn: 'Nora Al-Qahtani', customerNameAr: 'نورة القحطاني',
    customerAddress: 'Riyadh, King Fahd Road',
    items: [{ nameEn: 'Gold Wristwatch', nameAr: 'ساعة يد ذهبية', qty: 1, price: 459 }],
    total: 459, currency: 'SAR', status: 'delivered', date: '2026-04-01',
  },
  {
    id: 'o7', orderNumber: '#BRQ-1030',
    customerNameEn: 'Tariq Al-Amri', customerNameAr: 'طارق العمري',
    customerAddress: 'Medina, Al Anbariyah',
    items: [
      { nameEn: 'Premium Headphones', nameAr: 'سماعات فاخرة', qty: 2, price: 299 },
      { nameEn: 'Leather Bag', nameAr: 'حقيبة جلدية', qty: 1, price: 189 },
    ],
    total: 787, currency: 'SAR', status: 'delivered', date: '2026-03-29',
  },
  {
    id: 'o8', orderNumber: '#BRQ-1028',
    customerNameEn: 'Hessa Al-Subaie', customerNameAr: 'حصة السبيعي',
    customerAddress: 'Riyadh, Hittin',
    items: [{ nameEn: 'Aviator Sunglasses', nameAr: 'نظارات شمسية', qty: 1, price: 129 }],
    total: 129, currency: 'SAR', status: 'delivered', date: '2026-03-27',
  },
  {
    id: 'o9', orderNumber: '#BRQ-1025',
    customerNameEn: 'Rayan Al-Dosari', customerNameAr: 'ريان الدوسري',
    customerAddress: 'Abha, Al Marooj',
    items: [
      { nameEn: 'Flagship Smartphone', nameAr: 'هاتف ذكي رائد', qty: 1, price: 899 },
      { nameEn: 'Arabian Oud', nameAr: 'عطر عود', qty: 1, price: 219 },
    ],
    total: 1118, currency: 'SAR', status: 'delivered', date: '2026-03-24',
  },
  {
    id: 'o10', orderNumber: '#BRQ-1020',
    customerNameEn: 'Layla Mahmoud', customerNameAr: 'ليلى محمود',
    customerAddress: 'Jeddah, Al Rawdah',
    items: [{ nameEn: 'Leather Bag', nameAr: 'حقيبة جلدية', qty: 1, price: 189 }],
    total: 189, currency: 'SAR', status: 'delivered', date: '2026-03-20',
  },
];

export const STORE_OFFERS: Offer[] = [
  {
    id: 'off1', nameEn: 'Ramadan Sale', nameAr: 'تخفيضات رمضان',
    type: 'category', targetId: 'cat1', targetNameEn: 'Electronics', targetNameAr: 'إلكترونيات',
    discountType: 'percent', discountValue: 15,
    startDate: '2026-03-01', endDate: '2026-04-10', isActive: false,
  },
  {
    id: 'off2', nameEn: 'Spring Offer', nameAr: 'عرض الربيع',
    type: 'product', targetId: 'sp3', targetNameEn: 'Gold Wristwatch', targetNameAr: 'ساعة يد ذهبية',
    discountType: 'fixed', discountValue: 50, currency: 'SAR',
    startDate: '2026-04-15', endDate: '2026-05-15', isActive: true,
  },
  {
    id: 'off3', nameEn: 'VIP Members Discount', nameAr: 'خصم أعضاء VIP',
    type: 'segment', targetId: 'vip', targetNameEn: 'VIP Members', targetNameAr: 'أعضاء VIP',
    discountType: 'percent', discountValue: 10,
    startDate: '2026-01-01', endDate: '2026-12-31', isActive: true,
  },
];

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'msg1', sender: 'admin', textEn: 'Welcome to BabRizq platform! How can we help you today?', textAr: 'مرحباً بك في منصة بابرزق! كيف يمكننا مساعدتك اليوم؟', timestamp: '2026-04-10T09:00:00Z' },
  { id: 'msg2', sender: 'owner', textEn: 'Hi, I have a question about adding products to my store.', textAr: 'مرحباً، لدي سؤال حول إضافة منتجات لمتجري.', timestamp: '2026-04-10T09:05:00Z' },
  { id: 'msg3', sender: 'admin', textEn: 'Of course! You can add products from the Products Management section. Would you like a step-by-step guide?', textAr: 'بالتأكيد! يمكنك إضافة المنتجات من قسم إدارة المنتجات. هل تريد دليلاً خطوة بخطوة؟', timestamp: '2026-04-10T09:06:00Z' },
  { id: 'msg4', sender: 'owner', textEn: 'Yes please, also how can I set prices in multiple currencies?', textAr: 'نعم من فضلك، وأيضاً كيف يمكنني ضبط الأسعار بعدة عملات؟', timestamp: '2026-04-10T09:08:00Z' },
  { id: 'msg5', sender: 'admin', textEn: 'When adding or editing a product, you will find the "Prices" section which supports multiple currencies. You can add a price for each currency you sell in.', textAr: 'عند إضافة أو تعديل منتج، ستجد قسم "الأسعار" الذي يدعم عدة عملات. يمكنك إضافة سعر لكل عملة تبيع بها.', timestamp: '2026-04-10T09:10:00Z' },
  { id: 'msg6', sender: 'owner', textEn: 'Perfect, thank you! One more thing — can I generate QR codes for my products?', textAr: 'ممتاز، شكراً! سؤال أخير — هل يمكنني توليد رموز QR لمنتجاتي؟', timestamp: '2026-04-10T09:12:00Z' },
  { id: 'msg7', sender: 'admin', textEn: 'Yes! In the product edit form, there is a "Generate QR Code" button that creates a scannable QR code for your product.', textAr: 'نعم! في نموذج تعديل المنتج، يوجد زر "توليد رمز QR" الذي ينشئ رمز QR قابل للمسح لمنتجك.', timestamp: '2026-04-10T09:13:00Z' },
];

// ─── Supplier ────────────────────────────────────────────────────────────────

export interface Supplier {
  id: string;
  nameEn: string;
  nameAr: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  productsSupplied: number;
}

// ─── Stock Movement ──────────────────────────────────────────────────────────

export interface StockMovement {
  id: string;
  productId: string;
  productNameEn: string;
  productNameAr: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  reasonAr: string;
  date: string;
  supplierId?: string;
  supplierNameEn?: string;
  supplierNameAr?: string;
  reference?: string;
}

// ─── Expense ─────────────────────────────────────────────────────────────────

export interface Expense {
  id: string;
  titleEn: string;
  titleAr: string;
  category: 'rent' | 'salary' | 'marketing' | 'shipping' | 'utilities' | 'other';
  amount: number;
  currency: string;
  date: string;
  note?: string;
}

// ─── Invoice ─────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerNameEn: string;
  customerNameAr: string;
  items: { nameEn: string; nameAr: string; qty: number; price: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  date: string;
  status: 'paid' | 'unpaid' | 'cancelled';
}

// ─── Store Settings ───────────────────────────────────────────────────────────

export interface StoreSettings {
  storeNameEn: string;
  storeNameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  logoUrl: string;
  contactEmail: string;
  phone: string;
  address: string;
  acceptedCurrencies: string[];
  paymentMethods: string[];
  lowStockThreshold: number;
  notifyLowStock: boolean;
  notifyNewOrder: boolean;
  deliveryFee: number;
  freeShippingThreshold: number;
  estimatedDeliveryDays: number;
  taxRate: number;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeNameEn: 'My BabRizq Store',
  storeNameAr: 'متجري على بابرزق',
  descriptionEn: 'Quality products at the best prices.',
  descriptionAr: 'منتجات عالية الجودة بأفضل الأسعار.',
  logoUrl: '',
  contactEmail: 'store@babrizq.com',
  phone: '+966 50 123 4567',
  address: 'Riyadh, Saudi Arabia',
  acceptedCurrencies: ['SAR', 'USD', 'AED'],
  paymentMethods: ['cash', 'card', 'transfer'],
  lowStockThreshold: 5,
  notifyLowStock: true,
  notifyNewOrder: true,
  deliveryFee: 25,
  freeShippingThreshold: 300,
  estimatedDeliveryDays: 3,
  taxRate: 15,
};

// ─── Seed: Suppliers ─────────────────────────────────────────────────────────

export const STORE_SUPPLIERS: Supplier[] = [
  {
    id: 'sup1', nameEn: 'Al-Noor Electronics', nameAr: 'شركة النور للإلكترونيات',
    contactName: 'Mohammed Al-Ghamdi', phone: '+966 55 111 2233',
    email: 'contact@alnoor-elec.com', address: 'Riyadh Industrial City',
    productsSupplied: 2,
  },
  {
    id: 'sup2', nameEn: 'Gulf Accessories Co.', nameAr: 'شركة الخليج للإكسسوارات',
    contactName: 'Khalid Bin Saud', phone: '+966 50 222 3344',
    email: 'info@gulfacc.com', address: 'Jeddah, Al Hamra',
    productsSupplied: 3,
  },
  {
    id: 'sup3', nameEn: 'Arabian Scents Trading', nameAr: 'تجارة العطور العربية',
    contactName: 'Fatima Al-Zahrani', phone: '+971 4 333 4455',
    email: 'sales@arabianscents.ae', address: 'Dubai, Deira',
    productsSupplied: 1,
  },
  {
    id: 'sup4', nameEn: 'Fashion House KSA', nameAr: 'بيت الأزياء للمملكة',
    contactName: 'Nora Al-Dosari', phone: '+966 56 444 5566',
    email: 'orders@fashionhouseksa.com', address: 'Riyadh, Malaz',
    productsSupplied: 2,
  },
];

// ─── Seed: Stock Movements ───────────────────────────────────────────────────

export const STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'sm1', productId: 'sp1', productNameEn: 'Premium Wireless Headphones', productNameAr: 'سماعات لاسلكية فاخرة',
    type: 'in', quantity: 30, reason: 'Purchase from supplier', reasonAr: 'شراء من المورد',
    date: '2026-04-01', supplierId: 'sup1', supplierNameEn: 'Al-Noor Electronics', supplierNameAr: 'شركة النور للإلكترونيات',
    reference: 'PO-2026-041',
  },
  {
    id: 'sm2', productId: 'sp7', productNameEn: 'Flagship Smartphone', productNameAr: 'هاتف ذكي رائد',
    type: 'in', quantity: 15, reason: 'Purchase from supplier', reasonAr: 'شراء من المورد',
    date: '2026-04-02', supplierId: 'sup1', supplierNameEn: 'Al-Noor Electronics', supplierNameAr: 'شركة النور للإلكترونيات',
    reference: 'PO-2026-042',
  },
  {
    id: 'sm3', productId: 'sp1', productNameEn: 'Premium Wireless Headphones', productNameAr: 'سماعات لاسلكية فاخرة',
    type: 'out', quantity: 5, reason: 'Sales', reasonAr: 'مبيعات',
    date: '2026-04-03',
  },
  {
    id: 'sm4', productId: 'sp3', productNameEn: 'Gold Wristwatch', productNameAr: 'ساعة يد ذهبية',
    type: 'in', quantity: 10, reason: 'Purchase from supplier', reasonAr: 'شراء من المورد',
    date: '2026-04-03', supplierId: 'sup2', supplierNameEn: 'Gulf Accessories Co.', supplierNameAr: 'شركة الخليج للإكسسوارات',
    reference: 'PO-2026-043',
  },
  {
    id: 'sm5', productId: 'sp5', productNameEn: 'Classic White Sneakers', productNameAr: 'حذاء رياضي أبيض',
    type: 'adjustment', quantity: -2, reason: 'Damaged items removed', reasonAr: 'إزالة بضاعة تالفة',
    date: '2026-04-04',
  },
  {
    id: 'sm6', productId: 'sp6', productNameEn: 'Arabian Oud Perfume', productNameAr: 'عطر عود عربي',
    type: 'in', quantity: 20, reason: 'Purchase from supplier', reasonAr: 'شراء من المورد',
    date: '2026-04-05', supplierId: 'sup3', supplierNameEn: 'Arabian Scents Trading', supplierNameAr: 'تجارة العطور العربية',
    reference: 'PO-2026-044',
  },
  {
    id: 'sm7', productId: 'sp7', productNameEn: 'Flagship Smartphone', productNameAr: 'هاتف ذكي رائد',
    type: 'out', quantity: 3, reason: 'Sales', reasonAr: 'مبيعات',
    date: '2026-04-06',
  },
  {
    id: 'sm8', productId: 'sp8', productNameEn: 'Wool Knitted Scarf', productNameAr: 'وشاح صوف محبوك',
    type: 'out', quantity: 4, reason: 'Sales', reasonAr: 'مبيعات',
    date: '2026-04-06',
  },
];

// ─── Seed: Expenses ──────────────────────────────────────────────────────────

export const STORE_EXPENSES: Expense[] = [
  { id: 'exp1', titleEn: 'Store Rent', titleAr: 'إيجار المستودع', category: 'rent', amount: 3500, currency: 'SAR', date: '2026-04-01' },
  { id: 'exp2', titleEn: 'Staff Salaries', titleAr: 'رواتب الموظفين', category: 'salary', amount: 8000, currency: 'SAR', date: '2026-04-01' },
  { id: 'exp3', titleEn: 'Social Media Ads', titleAr: 'إعلانات السوشيال ميديا', category: 'marketing', amount: 1200, currency: 'SAR', date: '2026-04-03' },
  { id: 'exp4', titleEn: 'Shipping & Logistics', titleAr: 'الشحن والخدمات اللوجستية', category: 'shipping', amount: 950, currency: 'SAR', date: '2026-04-05' },
  { id: 'exp5', titleEn: 'Electricity & Internet', titleAr: 'الكهرباء والإنترنت', category: 'utilities', amount: 420, currency: 'SAR', date: '2026-04-02' },
  { id: 'exp6', titleEn: 'Packaging Materials', titleAr: 'مواد التغليف', category: 'other', amount: 380, currency: 'SAR', date: '2026-04-04' },
  { id: 'exp7', titleEn: 'Store Rent (March)', titleAr: 'إيجار المستودع (مارس)', category: 'rent', amount: 3500, currency: 'SAR', date: '2026-03-01' },
  { id: 'exp8', titleEn: 'Staff Salaries (March)', titleAr: 'رواتب الموظفين (مارس)', category: 'salary', amount: 8000, currency: 'SAR', date: '2026-03-01' },
  { id: 'exp9', titleEn: 'Google Ads Campaign', titleAr: 'حملة إعلانية على جوجل', category: 'marketing', amount: 800, currency: 'SAR', date: '2026-03-15' },
  { id: 'exp10', titleEn: 'Delivery Services (March)', titleAr: 'خدمات التوصيل (مارس)', category: 'shipping', amount: 780, currency: 'SAR', date: '2026-03-20' },
];

// ─── Seed: Invoices ──────────────────────────────────────────────────────────

export const STORE_INVOICES: Invoice[] = [
  {
    id: 'inv1', invoiceNumber: 'INV-2026-042', orderId: 'o1', orderNumber: '#BRQ-1042',
    customerNameEn: 'Ahmed Al-Rashid', customerNameAr: 'أحمد الراشد',
    items: [
      { nameEn: 'Gold Wristwatch', nameAr: 'ساعة يد ذهبية', qty: 1, price: 459 },
      { nameEn: 'Aviator Sunglasses', nameAr: 'نظارات شمسية', qty: 2, price: 129 },
    ],
    subtotal: 717, discount: 0, tax: 107.55, total: 824.55,
    currency: 'SAR', date: '2026-04-06', status: 'unpaid',
  },
  {
    id: 'inv2', invoiceNumber: 'INV-2026-041', orderId: 'o2', orderNumber: '#BRQ-1041',
    customerNameEn: 'Sara Mansour', customerNameAr: 'سارة منصور',
    items: [{ nameEn: 'Premium Headphones', nameAr: 'سماعات فاخرة', qty: 1, price: 299 }],
    subtotal: 299, discount: 0, tax: 44.85, total: 343.85,
    currency: 'SAR', date: '2026-04-05', status: 'unpaid',
  },
  {
    id: 'inv3', invoiceNumber: 'INV-2026-039', orderId: 'o3', orderNumber: '#BRQ-1039',
    customerNameEn: 'Khalid Nasser', customerNameAr: 'خالد ناصر',
    items: [
      { nameEn: 'Leather Bag', nameAr: 'حقيبة جلدية', qty: 1, price: 189 },
      { nameEn: 'Wool Scarf', nameAr: 'وشاح صوف', qty: 1, price: 69 },
    ],
    subtotal: 258, discount: 0, tax: 38.7, total: 296.7,
    currency: 'SAR', date: '2026-04-05', status: 'unpaid',
  },
  {
    id: 'inv4', invoiceNumber: 'INV-2026-032', orderId: 'o6', orderNumber: '#BRQ-1032',
    customerNameEn: 'Nora Al-Qahtani', customerNameAr: 'نورة القحطاني',
    items: [{ nameEn: 'Gold Wristwatch', nameAr: 'ساعة يد ذهبية', qty: 1, price: 459 }],
    subtotal: 459, discount: 50, tax: 61.35, total: 470.35,
    currency: 'SAR', date: '2026-04-01', status: 'paid',
  },
  {
    id: 'inv5', invoiceNumber: 'INV-2026-030', orderId: 'o7', orderNumber: '#BRQ-1030',
    customerNameEn: 'Tariq Al-Amri', customerNameAr: 'طارق العمري',
    items: [
      { nameEn: 'Premium Headphones', nameAr: 'سماعات فاخرة', qty: 2, price: 299 },
      { nameEn: 'Leather Bag', nameAr: 'حقيبة جلدية', qty: 1, price: 189 },
    ],
    subtotal: 787, discount: 0, tax: 118.05, total: 905.05,
    currency: 'SAR', date: '2026-03-29', status: 'paid',
  },
  {
    id: 'inv6', invoiceNumber: 'INV-2026-025', orderId: 'o9', orderNumber: '#BRQ-1025',
    customerNameEn: 'Rayan Al-Dosari', customerNameAr: 'ريان الدوسري',
    items: [
      { nameEn: 'Flagship Smartphone', nameAr: 'هاتف ذكي رائد', qty: 1, price: 899 },
      { nameEn: 'Arabian Oud', nameAr: 'عطر عود', qty: 1, price: 219 },
    ],
    subtotal: 1118, discount: 0, tax: 167.7, total: 1285.7,
    currency: 'SAR', date: '2026-03-24', status: 'paid',
  },
];

// Sales chart data for the Overview page
export const MONTHLY_SALES_DATA = [
  { month: 'Oct', monthAr: 'أكتوبر', sales: 12400, orders: 82 },
  { month: 'Nov', monthAr: 'نوفمبر', sales: 18200, orders: 110 },
  { month: 'Dec', monthAr: 'ديسمبر', sales: 22600, orders: 145 },
  { month: 'Jan', monthAr: 'يناير', sales: 15800, orders: 98 },
  { month: 'Feb', monthAr: 'فبراير', sales: 19400, orders: 124 },
  { month: 'Mar', monthAr: 'مارس', sales: 21200, orders: 136 },
  { month: 'Apr', monthAr: 'أبريل', sales: 24580, orders: 156 },
];

export const CURRENCY_REVENUE = [
  { currency: 'SAR', symbol: 'ر.س', amount: 24580, trend: '+12.5%' },
  { currency: 'USD', symbol: '$', amount: 6554, trend: '+8.2%' },
  { currency: 'AED', symbol: 'د.إ', amount: 9052, trend: '+15.1%' },
  { currency: 'SYP', symbol: 'ل.س', amount: 16400000, trend: '+5.8%' },
];









