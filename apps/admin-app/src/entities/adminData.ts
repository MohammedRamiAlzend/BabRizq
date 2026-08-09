export interface PlatformUser {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  role: 'admin' | 'store_owner' | 'marketer' | 'back_office' | 'delivery' | 'customer';
  status: 'active' | 'suspended';
  joinedDate: string;
}

export const platformUsers: PlatformUser[] = [
  { id: '1', name: 'System Admin', nameAr: 'مدير النظام', email: 'admin@babrizq.com', role: 'admin', status: 'active', joinedDate: '2024-01-01' },
  { id: '2', name: 'Ahmed Al-Rashid', nameAr: 'أحمد الراشد', email: 'ahmed@store.com', role: 'store_owner', status: 'active', joinedDate: '2024-02-15' },
  { id: '3', name: 'Fatima Hassan', nameAr: 'فاطمة حسن', email: 'fatima@market.com', role: 'marketer', status: 'active', joinedDate: '2024-03-01' },
  { id: '4', name: 'Omar Khalil', nameAr: 'عمر خليل', email: 'omar@babrizq.com', role: 'back_office', status: 'active', joinedDate: '2024-01-20' },
  { id: '5', name: 'Youssef Ali', nameAr: 'يوسف علي', email: 'youssef@delivery.com', role: 'delivery', status: 'active', joinedDate: '2024-04-10' },
  { id: '6', name: 'Sara Mohammed', nameAr: 'سارة محمد', email: 'sara@customer.com', role: 'customer', status: 'active', joinedDate: '2024-05-01' },
  { id: '7', name: 'Khalid Nasser', nameAr: 'خالد ناصر', email: 'khalid@store2.com', role: 'store_owner', status: 'suspended', joinedDate: '2024-03-15' },
  { id: '8', name: 'Layla Ibrahim', nameAr: 'ليلى إبراهيم', email: 'layla@market2.com', role: 'marketer', status: 'active', joinedDate: '2024-06-01' },
  { id: '9', name: 'Hassan Tariq', nameAr: 'حسن طارق', email: 'hassan@delivery2.com', role: 'delivery', status: 'suspended', joinedDate: '2024-04-20' },
  { id: '10', name: 'Nour Saleh', nameAr: 'نور صالح', email: 'nour@customer2.com', role: 'customer', status: 'active', joinedDate: '2024-07-01' },
];

export const platformStats = {
  totalUsers: 1248,
  totalStores: 86,
  platformRevenue: 245800,
  activeMarketers: 134,
};

export const roleLabels: Record<string, { en: string; ar: string }> = {
  admin: { en: 'Admin', ar: 'مدير' },
  store_owner: { en: 'Store Owner', ar: 'صاحب متجر' },
  marketer: { en: 'Marketer', ar: 'مسوّق' },
  back_office: { en: 'Back Office', ar: 'مكتب خلفي' },
  delivery: { en: 'Delivery', ar: 'توصيل' },
  customer: { en: 'Customer', ar: 'عميل' },
};

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  defaultCurrency: string;
  commissionRate: number;
  maintenanceMode: boolean;
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: 'Bab Rizq',
  supportEmail: 'support@babrizq.com',
  defaultCurrency: 'SAR',
  commissionRate: 5.5,
  maintenanceMode: false,
};









