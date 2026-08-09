/**
 * User entity — mock API (admin).
 *
 * Simulates the admin user endpoints from
 * `docs/needed-endpoints-from-backend.md`:
 * `GET/POST /api/admin/users` · `PUT /api/admin/users/{id}/role` ·
 * `PUT /api/admin/users/{id}/status` · `DELETE /api/admin/users/{id}`.
 * Seed data is copied verbatim from the legacy monolith.
 */
import { PlatformUser, PlatformUserRole } from './model';

/** In-memory user registry. TODO(migration): replaced by `GET /api/admin/users`. */
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

/** Bilingual display labels for every platform role. */
export const roleLabels: Record<PlatformUserRole, { en: string; ar: string }> = {
  admin: { en: 'Admin', ar: 'مدير' },
  store_owner: { en: 'Store Owner', ar: 'صاحب متجر' },
  marketer: { en: 'Marketer', ar: 'مسوّق' },
  back_office: { en: 'Back Office', ar: 'مكتب خلفي' },
  delivery: { en: 'Delivery', ar: 'توصيل' },
  customer: { en: 'Customer', ar: 'عميل' },
};

/** Simulates `GET /api/admin/users`. */
export async function getUsers(): Promise<PlatformUser[]> {
  return new Promise(resolve => setTimeout(() => resolve(platformUsers), 100));
}

/** Simulates `PUT /api/admin/users/{id}/role`. */
export async function updateUserRole(id: string, role: PlatformUserRole): Promise<PlatformUser> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      const user = platformUsers.find(u => u.id === id);
      if (!user) {
        reject(new Error('User not found'));
        return;
      }
      user.role = role;
      resolve(user);
    }, 100)
  );
}

/** Simulates `PUT /api/admin/users/{id}/status`. */
export async function updateUserStatus(id: string, status: 'active' | 'suspended'): Promise<PlatformUser> {
  return new Promise((resolve, reject) =>
    setTimeout(() => {
      const user = platformUsers.find(u => u.id === id);
      if (!user) {
        reject(new Error('User not found'));
        return;
      }
      user.status = status;
      resolve(user);
    }, 100)
  );
}
