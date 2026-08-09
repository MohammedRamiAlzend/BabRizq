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

  // ---- Driver profile ----
  await prisma.driverProfile.upsert({
    where: { userId: driver.id },
    update: {},
    create: { userId: driver.id, phone: driver.phone, available: true },
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

  // ---- Admin sanity (user exists; platform settings singleton) ----
  await prisma.$disconnect();
  console.log('Seed complete. Demo login: <role>@babrizq.com / Password123!');
  console.log(
    'Users:',
    [admin, storeOwner, backOffice, driver, marketer, customer].map((u) => u.email).join(', ')
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
