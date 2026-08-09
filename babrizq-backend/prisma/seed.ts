/**
 * Bab Rizq — database seed.
 *
 * Creates a development dataset: platform settings, the six platform
 * categories, one user per role, a couple of stores with products, an order
 * in flight, driver profiles, and marketer data.
 *
 *   npm run prisma:seed
 *
 * Demo credentials (dev only):
 *   admin@babrizq.com / store@babrizq.com / delivery@babrizq.com /
 *   marketer@babrizq.com / backoffice@babrizq.com / customer@babrizq.com
 *   all with password: Password123!
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Password123!';

/** 6 platform categories from the customer docs (code = English label). */
const PLATFORM_CATEGORIES: { code: string; nameAr: string }[] = [
  { code: 'Electronics', nameAr: 'إلكترونيات' },
  { code: 'Accessories', nameAr: 'إكسسوارات' },
  { code: 'Watches', nameAr: 'ساعات' },
  { code: 'Shoes', nameAr: 'أحذية' },
  { code: 'Perfumes', nameAr: 'عطور' },
  { code: 'Fashion', nameAr: 'أزياء' },
];

async function main(): Promise<void> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ---- Platform settings (singleton) ----
  await prisma.platformSetting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      platformName: 'Bab Rizq',
      supportEmail: 'support@babrizq.com',
      defaultCurrency: 'SAR',
      commissionRate: 5.5,
      maintenanceMode: false,
    },
  });

  // ---- Platform categories ----
  for (const category of PLATFORM_CATEGORIES) {
    await prisma.platformCategory.upsert({
      where: { code: category.code },
      update: { nameAr: category.nameAr },
      create: category,
    });
  }

  // ---- Users (one per role) ----
  const admin = await prisma.user.upsert({
    where: { email: 'admin@babrizq.com' },
    update: {},
    create: {
      email: 'admin@babrizq.com',
      passwordHash,
      nameEn: 'System Admin',
      nameAr: 'مدير النظام',
      phone: '+966 50 000 0001',
      role: 'admin',
    },
  });

  const storeOwner = await prisma.user.upsert({
    where: { email: 'store@babrizq.com' },
    update: {},
    create: {
      email: 'store@babrizq.com',
      passwordHash,
      nameEn: 'Ahmed Al-Rashid',
      nameAr: 'أحمد الراشد',
      phone: '+966 50 000 0002',
      role: 'store_owner',
    },
  });

  const backOffice = await prisma.user.upsert({
    where: { email: 'backoffice@babrizq.com' },
    update: {},
    create: {
      email: 'backoffice@babrizq.com',
      passwordHash,
      nameEn: 'Omar Khalil',
      nameAr: 'عمر خليل',
      phone: '+966 50 000 0003',
      role: 'back_office',
    },
  });

  const driver = await prisma.user.upsert({
    where: { email: 'delivery@babrizq.com' },
    update: {},
    create: {
      email: 'delivery@babrizq.com',
      passwordHash,
      nameEn: 'Yusuf Al-Mutairi',
      nameAr: 'يوسف المطيري',
      phone: '+966 55 123 4567',
      role: 'delivery',
      isAvailable: true,
    },
  });

  const marketer = await prisma.user.upsert({
    where: { email: 'marketer@babrizq.com' },
    update: {},
    create: {
      email: 'marketer@babrizq.com',
      passwordHash,
      nameEn: 'Fatima Hassan',
      nameAr: 'فاطمة حسن',
      phone: '+966 50 000 0004',
      role: 'marketer',
    },
  });

  // Second driver so the back-office roster has more than one entry.
  const driver2 = await prisma.user.upsert({
    where: { email: 'driver2@babrizq.com' },
    update: {},
    create: {
      email: 'driver2@babrizq.com',
      passwordHash,
      nameEn: 'Khalid Al-Otaibi',
      nameAr: 'خالد العتيبي',
      phone: '+966 55 987 6543',
      role: 'delivery',
      isAvailable: true,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@babrizq.com' },
    update: {},
    create: {
      email: 'customer@babrizq.com',
      passwordHash,
      nameEn: 'Sara Mansour',
      nameAr: 'سارة منصور',
      phone: '+966 50 000 0005',
      role: 'customer',
    },
  });

  // ---- Driver profiles ----
  await prisma.driverProfile.upsert({
    where: { userId: driver.id },
    update: {},
    create: { userId: driver.id, phone: driver.phone, available: true },
  });
  await prisma.driverProfile.upsert({
    where: { userId: driver2.id },
    update: {},
    create: { userId: driver2.id, phone: driver2.phone, available: true },
  });

  // ---- Store + products ----
  const store = await prisma.store.upsert({
    where: { id: 'store-techzone' },
    update: {},
    create: {
      id: 'store-techzone',
      ownerUserId: storeOwner.id,
      nameEn: 'TechZone',
      nameAr: 'تك زون',
      emoji: '📱',
      descriptionEn: 'Premium electronics and gadgets.',
      descriptionAr: 'إلكترونيات وأجهزة فاخرة.',
      categoryCode: 'Electronics',
    },
  });

  await prisma.storeSettings.upsert({
    where: { storeId: store.id },
    update: {},
    create: {
      storeId: store.id,
      contactEmail: 'store@babrizq.com',
      phone: '+966 50 000 0002',
      addressEn: 'Al Olaya, Riyadh',
      addressAr: 'العليا، الرياض',
      taxRate: 15,
      deliveryFee: 15,
      freeShippingThreshold: 200,
      lowStockThreshold: 5,
    },
  });

  const headphones = await prisma.product.upsert({
    where: { id: 'prod-headphones' },
    update: {},
    create: {
      id: 'prod-headphones',
      storeId: store.id,
      categoryCode: 'Electronics',
      nameEn: 'Premium Wireless Headphones',
      nameAr: 'سماعات لاسلكية فاخرة',
      descriptionEn: 'Active noise cancellation, 30-hour battery.',
      descriptionAr: 'إلغاء ضوضاء نشط، بطارية 30 ساعة.',
      price: 299,
      originalPrice: 349,
      stock: 45,
      sku: 'ELEC-001',
      rating: 4.7,
      reviewCount: 128,
      isFeatured: true,
    },
  });

  // SQLite does not support `skipDuplicates` — clear + recreate for idempotency.
  await prisma.productTag.deleteMany({ where: { productId: headphones.id } });
  await prisma.productTag.createMany({
    data: [
      { productId: headphones.id, value: 'wireless' },
      { productId: headphones.id, value: 'audio' },
    ],
  });

  await prisma.product.upsert({
    where: { id: 'prod-smartphone' },
    update: {},
    create: {
      id: 'prod-smartphone',
      storeId: store.id,
      categoryCode: 'Electronics',
      nameEn: 'Flagship Smartphone',
      nameAr: 'هاتف ذكي رائد',
      descriptionEn: '6.7" OLED, 256GB, 108MP camera.',
      descriptionAr: 'شاشة OLED، تخزين 256 جيجا، كاميرا 108 ميجابكسل.',
      price: 899,
      stock: 8,
      sku: 'ELEC-002',
      rating: 4.9,
      reviewCount: 342,
    },
  });

  // Extra TechZone product in the Watches platform category (enables
  // cross-category browsing + the "wearable" tag group).
  await prisma.product.upsert({
    where: { id: 'prod-smartwatch' },
    update: {},
    create: {
      id: 'prod-smartwatch',
      storeId: store.id,
      categoryCode: 'Watches',
      nameEn: 'Smart Watch Series 7',
      nameAr: 'ساعة ذكية سيريس 7',
      descriptionEn: 'AMOLED display, GPS, 7-day battery.',
      descriptionAr: 'شاشة AMOLED، جي بي إس، بطارية 7 أيام.',
      price: 499,
      originalPrice: 549,
      stock: 25,
      sku: 'ELEC-003',
      rating: 4.6,
      reviewCount: 64,
      isFeatured: true,
    },
  });
  await prisma.productTag.deleteMany({ where: { productId: 'prod-smartwatch' } });
  await prisma.productTag.createMany({
    data: [{ productId: 'prod-smartwatch', value: 'wearable' }],
  });

  // ---- Second store: Leather House (Fashion) + products ----
  const leatherStore = await prisma.store.upsert({
    where: { id: 'store-leather-house' },
    update: {},
    create: {
      id: 'store-leather-house',
      ownerUserId: storeOwner.id,
      nameEn: 'Leather House',
      nameAr: 'دار الجلد',
      emoji: '🧳',
      descriptionEn: 'Handcrafted leather goods and classic fashion.',
      descriptionAr: 'منتجات جلدية يدوية وأزياء كلاسيكية.',
      categoryCode: 'Fashion',
    },
  });

  await prisma.storeSettings.upsert({
    where: { storeId: leatherStore.id },
    update: {},
    create: {
      storeId: leatherStore.id,
      contactEmail: 'store@babrizq.com',
      phone: '+966 50 000 0002',
      addressEn: 'Al Faisaliyah, Riyadh',
      addressAr: 'الفيسالية، الرياض',
      taxRate: 15,
      deliveryFee: 10,
      freeShippingThreshold: 150,
      lowStockThreshold: 5,
    },
  });

  await prisma.product.upsert({
    where: { id: 'prod-leather-wallet' },
    update: {},
    create: {
      id: 'prod-leather-wallet',
      storeId: leatherStore.id,
      categoryCode: 'Accessories',
      nameEn: 'Genuine Leather Wallet',
      nameAr: 'محفظة جلدية أصلية',
      descriptionEn: 'Full-grain leather, 8 card slots, RFID-safe.',
      descriptionAr: 'جلد طبيعي، 8 فتحات للبطاقات، حماية RFID.',
      price: 189,
      originalPrice: 240,
      stock: 40,
      sku: 'LTHR-001',
      rating: 4.5,
      reviewCount: 156,
    },
  });
  await prisma.productTag.deleteMany({ where: { productId: 'prod-leather-wallet' } });
  await prisma.productTag.createMany({
    data: [{ productId: 'prod-leather-wallet', value: 'leather' }],
  });

  await prisma.product.upsert({
    where: { id: 'prod-leather-bag' },
    update: {},
    create: {
      id: 'prod-leather-bag',
      storeId: leatherStore.id,
      categoryCode: 'Fashion',
      nameEn: 'Classic Leather Tote Bag',
      nameAr: 'حقيبة جلدية كلاسيكية',
      descriptionEn: 'Spacious handcrafted tote with brass hardware.',
      descriptionAr: 'حقيبة يد واسعة مصنوعة يدوياً بإكسسوارات نحاسية.',
      price: 899,
      originalPrice: 999,
      stock: 12,
      sku: 'LTHR-002',
      rating: 4.8,
      reviewCount: 203,
      isFeatured: true,
    },
  });
  await prisma.productTag.deleteMany({ where: { productId: 'prod-leather-bag' } });
  await prisma.productTag.createMany({
    data: [{ productId: 'prod-leather-bag', value: 'leather' }],
  });

  await prisma.product.upsert({
    where: { id: 'prod-sneakers' },
    update: {},
    create: {
      id: 'prod-sneakers',
      storeId: leatherStore.id,
      categoryCode: 'Shoes',
      nameEn: 'Everyday Sneakers',
      nameAr: 'حذاء رياضي يومي',
      descriptionEn: 'Lightweight breathable sneakers for daily wear.',
      descriptionAr: 'حذاء رياضي خفيف وقابل للتنفس للاستخدام اليومي.',
      price: 449,
      stock: 30,
      sku: 'LTHR-003',
      rating: 4.4,
      reviewCount: 98,
    },
  });
  await prisma.productTag.deleteMany({ where: { productId: 'prod-sneakers' } });
  await prisma.productTag.createMany({
    data: [{ productId: 'prod-sneakers', value: 'sneakers' }],
  });

  // ---- Promotional banners (home / category / store placements) ----
  await prisma.ad.upsert({
    where: { id: 'ad-home-1' },
    update: {},
    create: {
      id: 'ad-home-1',
      placement: 'home',
      titleEn: 'Flash Sale — Up to 30% Off',
      titleAr: 'تخفيضات — حتى 30%',
      subtitleEn: 'Premium electronics at unbeatable prices.',
      subtitleAr: 'إلكترونيات فاخرة بأسعار لا تقبل المنافسة.',
      ctaEn: 'Shop Now',
      ctaAr: 'تسوق الآن',
      emoji: '🔥',
      gradient: 'from-amber-400 to-orange-500',
      linkType: 'category',
      linkValue: 'Electronics',
      sortOrder: 1,
    },
  });

  await prisma.ad.upsert({
    where: { id: 'ad-home-2' },
    update: {},
    create: {
      id: 'ad-home-2',
      placement: 'home',
      titleEn: 'Leather Collection',
      titleAr: 'تشكيلة الجلد',
      subtitleEn: 'Handcrafted leather goods from Leather House.',
      subtitleAr: 'منتجات جلدية يدوية من دار الجلد.',
      ctaEn: 'Explore',
      ctaAr: 'استكشف',
      emoji: '🧳',
      gradient: 'from-rose-400 to-pink-600',
      linkType: 'store',
      linkValue: 'store-leather-house',
      sortOrder: 2,
    },
  });

  await prisma.ad.upsert({
    where: { id: 'ad-cat-electronics' },
    update: {},
    create: {
      id: 'ad-cat-electronics',
      placement: 'category',
      categoryCode: 'Electronics',
      titleEn: 'New Tech Arrivals',
      titleAr: 'وصل حديثاً من التقنية',
      subtitleEn: 'The latest gadgets are here.',
      subtitleAr: 'أحدث الأجهزة وصلت.',
      ctaEn: 'Discover',
      ctaAr: 'اكتشف',
      emoji: '⚡',
      gradient: 'from-indigo-500 to-violet-600',
      linkType: 'category',
      linkValue: 'Electronics',
      sortOrder: 1,
    },
  });

  await prisma.ad.upsert({
    where: { id: 'ad-store-techzone' },
    update: {},
    create: {
      id: 'ad-store-techzone',
      placement: 'store',
      storeId: store.id,
      titleEn: 'Exclusive TechZone Deals',
      titleAr: 'عروض تك زون الحصرية',
      subtitleEn: 'Member-only prices on headphones & phones.',
      subtitleAr: 'أسعار خاصة بالأعضاء على السماعات والهواتف.',
      ctaEn: 'View Deals',
      ctaAr: 'شاهد العروض',
      emoji: '🎧',
      gradient: 'from-sky-500 to-cyan-600',
      linkType: 'store',
      linkValue: 'store-techzone',
      sortOrder: 1,
    },
  });

  // ---- Order in flight (pending) ----
  await prisma.order.upsert({
    where: { orderNumber: '#BRQ-1042' },
    update: {},
    create: {
      orderNumber: '#BRQ-1042',
      customerUserId: customer.id,
      storeId: store.id,
      status: 'pending',
      customerNameEn: 'Ahmed Al-Rashid',
      customerNameAr: 'أحمد الراشد',
      customerPhone: '+966 50 111 2222',
      addressEn: '45 King Fahd Rd, Riyadh',
      addressAr: '٤٥ طريق الملك فهد، الرياض',
      lat: 24.7136,
      lng: 46.6753,
      paymentMethod: 'cod',
      subtotal: 717,
      deliveryFee: 15,
      tax: 0,
      total: 732,
      items: {
        create: [
          {
            productId: headphones.id,
            nameEn: 'Premium Wireless Headphones',
            nameAr: 'سماعات لاسلكية فاخرة',
            qty: 2,
            price: 299,
          },
        ],
      },
    },
  });

  // ---- In-transit delivery (assigned to the driver) so the delivery app
  // has an active order out of the box; frees the driver when delivered. ----
  const activeDelivery = await prisma.order.upsert({
    where: { orderNumber: '#BRQ-1040' },
    update: {},
    create: {
      orderNumber: '#BRQ-1040',
      customerUserId: customer.id,
      storeId: store.id,
      assignedDriverId: driver.id,
      status: 'in_transit',
      customerNameEn: 'Omar Khalil',
      customerNameAr: 'عمر خليل',
      customerPhone: '+966 50 333 4444',
      addressEn: '12 Olaya St, Riyadh',
      addressAr: '١٢ شارع العليا، الرياض',
      paymentMethod: 'cash',
      subtotal: 898,
      deliveryFee: 15,
      tax: 0,
      total: 913,
      items: {
        create: [
          {
            productId: headphones.id,
            nameEn: 'Premium Wireless Headphones',
            nameAr: 'سماعات لاسلكية فاخرة',
            qty: 1,
            price: 299,
          },
          {
            productId: 'prod-smartphone',
            nameEn: 'Flagship Smartphone',
            nameAr: 'هاتف ذكي رائد',
            qty: 1,
            price: 899,
          },
        ],
      },
    },
  });
  await prisma.driverProfile.upsert({
    where: { userId: driver.id },
    update: { available: false, activeOrderId: activeDelivery.id },
    create: { userId: driver.id, phone: driver.phone, available: false, activeOrderId: activeDelivery.id },
  });

  // ---- Delivered order (assigned to the second driver) so the store-owner
  // sales overview and the admin platform-revenue KPI have real numbers. ----
  await prisma.order.upsert({
    where: { orderNumber: '#BRQ-1038' },
    update: {},
    create: {
      orderNumber: '#BRQ-1038',
      customerUserId: customer.id,
      storeId: store.id,
      assignedDriverId: driver2.id,
      status: 'delivered',
      customerNameEn: 'Sara Mansour',
      customerNameAr: 'سارة منصور',
      customerPhone: '+966 50 555 6666',
      addressEn: '8 Tahlia St, Riyadh',
      addressAr: '٨ شارع التحلية، الرياض',
      paymentMethod: 'cod',
      subtotal: 688,
      deliveryFee: 15,
      tax: 103.2,
      total: 806.2,
      items: {
        create: [
          {
            productId: 'prod-smartwatch',
            nameEn: 'Smart Watch Series 7',
            nameAr: 'ساعة ذكية سيريس 7',
            qty: 1,
            price: 499,
          },
          {
            productId: 'prod-leather-wallet',
            nameEn: 'Genuine Leather Wallet',
            nameAr: 'محفظة جلدية أصلية',
            qty: 1,
            price: 189,
          },
        ],
      },
    },
  });

  // ---- Marketer data ----
  await prisma.marketerSettings.upsert({
    where: { userId: marketer.id },
    update: {},
    create: { userId: marketer.id, payoutMethod: 'bank' },
  });

  await prisma.affiliateLink.upsert({
    where: { id: 'link-techzone' },
    update: {},
    create: {
      id: 'link-techzone',
      marketerUserId: marketer.id,
      storeId: store.id,
      url: 'babrizq.com/store/store-techzone?ref=marketer1',
      targetNameEn: 'TechZone',
      targetNameAr: 'تك زون',
      type: 'store',
      clicks: 1243,
      conversions: 87,
      earned: 1305,
    },
  });

  // Extra affiliate links so the marketer links/performance pages demo
  // with a full table and a top-links list.
  await prisma.affiliateLink.upsert({
    where: { id: 'link-wristwatch' },
    update: {},
    create: {
      id: 'link-wristwatch',
      marketerUserId: marketer.id,
      productId: 'prod-smartwatch',
      url: 'babrizq.com/product/prod-smartwatch?ref=marketer1',
      targetNameEn: 'Smart Watch Series 7',
      targetNameAr: 'ساعة ذكية سيريس 7',
      type: 'product',
      clicks: 856,
      conversions: 34,
      earned: 782,
    },
  });

  await prisma.affiliateLink.upsert({
    where: { id: 'link-bag' },
    update: {},
    create: {
      id: 'link-bag',
      marketerUserId: marketer.id,
      productId: 'prod-leather-bag',
      url: 'babrizq.com/product/prod-leather-bag?ref=marketer1',
      targetNameEn: 'Classic Leather Tote Bag',
      targetNameAr: 'حقيبة جلدية كلاسيكية',
      type: 'product',
      clicks: 2105,
      conversions: 156,
      earned: 1716,
    },
  });

  await prisma.affiliateLink.upsert({
    where: { id: 'link-leather' },
    update: {},
    create: {
      id: 'link-leather',
      marketerUserId: marketer.id,
      storeId: leatherStore.id,
      url: 'babrizq.com/store/store-leather-house?ref=marketer1',
      targetNameEn: 'Leather House',
      targetNameAr: 'دار الجلد',
      type: 'store',
      clicks: 432,
      conversions: 21,
      earned: 378,
    },
  });

  // Withdrawal history: one paid + one pending. The marketer balance is
  // total earned minus non-rejected withdrawals → 3481 with the seed above.
  await prisma.withdrawalRequest.upsert({
    where: { id: 'wd-paid' },
    update: {},
    create: {
      id: 'wd-paid',
      marketerUserId: marketer.id,
      amount: 500,
      status: 'paid',
      bankIban: 'SA0380000000608010167519',
    },
  });
  await prisma.withdrawalRequest.upsert({
    where: { id: 'wd-pending' },
    update: {},
    create: {
      id: 'wd-pending',
      marketerUserId: marketer.id,
      amount: 200,
      status: 'pending',
    },
  });

  // ---- Admin sanity (user exists; platform settings singleton) ----
  await prisma.$disconnect();
  console.log('Seed complete. Demo login: <role>@babrizq.com / Password123!');
  console.log(
    'Users:',
    [admin, storeOwner, backOffice, driver, driver2, marketer, customer]
      .map((u) => u.email)
      .join(', ')
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
