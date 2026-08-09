/*
 * ─── API: Admin — Users Management ──────────────────────────────────────────
 *
 * GET /api/admin/users?page=1&pageSize=10&search=&role=
 * Headers: Authorization: Bearer <token>  (role must be "admin")
 * Paginated response value:
 *   { items: PlatformUser[]; totalItems: number; page: number; pageSize: number; totalPages: number }
 *   PlatformUser: { id: string (GUID); name: string; nameAr: string; email: string;
 *                   role: 'admin'|'store_owner'|'marketer'|'back_office'|'delivery'|'customer';
 *                   status: 'active'|'suspended'; joinedDate: string (YYYY-MM-DD) }
 *
 * POST /api/admin/users
 * DTO: { name: string; nameAr: string; email: string;
 *        role: 'admin'|'store_owner'|'marketer'|'back_office'|'delivery'|'customer' }
 * Response value: PlatformUser (newly created)
 *
 * PUT /api/admin/users/{id}/role
 * DTO: { role: 'admin'|'store_owner'|'marketer'|'back_office'|'delivery'|'customer' }
 * Response value: PlatformUser (updated)
 *
 * PUT /api/admin/users/{id}/status
 * DTO: { status: 'active'|'suspended' }
 * Response value: PlatformUser (updated)
 *
 * DELETE /api/admin/users/{id}
 * Response value: null
 *
 * All failures:
 *   { isSuccess: false, isError: true, errors: [...],
 *     topError: { code, description, type, arabicDescription, httpStatus } }
 */

import { useState, useMemo } from 'react';
import { Search, Plus, Pencil, Ban, CheckCircle, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/ui/button';
import { Input } from '@/shared/ui/ui/input';
import { Badge } from '@/shared/ui/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/shared/ui/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/ui/select';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { platformUsers, PlatformUser, roleLabels } from '~/entities/user';
import { useToast } from '@/shared/hooks/use-toast';
import { usePagination } from '@/shared/hooks/usePagination';
import Pagination from '@/shared/ui/Pagination';

type UserRole = PlatformUser['role'];

const AdminUsers = () => {
  const { t } = useLocale();
  const { toast } = useToast();
  const [users, setUsers] = useState<PlatformUser[]>(platformUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editUser, setEditUser] = useState<PlatformUser | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('customer');
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', nameAr: '', email: '', role: 'customer' as UserRole });
  const [deleteUser, setDeleteUser] = useState<PlatformUser | null>(null);

  const filtered = useMemo(() => users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  }), [users, search, roleFilter]);

  const { page, pageSize, setPage, setPageSize, paged, from, to, totalPages, totalItems } = usePagination(filtered);

  const handleToggleStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } as PlatformUser : u))
    );
    toast({ title: t('User status updated', 'تم تحديث حالة المستخدم') });
  };

  const handleEditRole = () => {
    if (!editUser) return;
    setUsers((prev) => prev.map((u) => (u.id === editUser.id ? { ...u, role: editRole } : u)));
    toast({ title: t('Role updated', 'تم تحديث الدور') });
    setEditUser(null);
  };

  const handleCreate = () => {
    const id = String(Date.now());
    setUsers((prev) => [...prev, { ...newUser, id, status: 'active', joinedDate: new Date().toISOString().split('T')[0] }]);
    toast({ title: t('User created', 'تم إنشاء المستخدم') });
    setShowCreate(false);
    setNewUser({ name: '', nameAr: '', email: '', role: 'customer' });
  };

  const handleDelete = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast({ title: t('User deleted successfully', 'تم حذف المستخدم بنجاح') });
    setDeleteUser(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">{t('Users Management', 'إدارة المستخدمين')}</h1>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
          {t('Create User', 'إنشاء مستخدم')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('Search users...', 'بحث المستخدمين...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Roles', 'جميع الأدوار')}</SelectItem>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{t(label.en, label.ar)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Name', 'الاسم')}</TableHead>
                <TableHead>{t('Email', 'البريد')}</TableHead>
                <TableHead>{t('Role', 'الدور')}</TableHead>
                <TableHead>{t('Status', 'الحالة')}</TableHead>
                <TableHead>{t('Joined', 'تاريخ الانضمام')}</TableHead>
                <TableHead className="text-end">{t('Actions', 'إجراءات')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{t(u.name, u.nameAr)}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{t(roleLabels[u.role]?.en, roleLabels[u.role]?.ar)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.status === 'active' ? 'default' : 'destructive'}>
                      {u.status === 'active' ? t('Active', 'نشط') : t('Suspended', 'موقوف')}
                    </Badge>
                  </TableCell>
                  <TableCell>{u.joinedDate}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setEditUser(u); setEditRole(u.role); }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={u.status === 'active' ? 'destructive' : 'default'}
                        onClick={() => handleToggleStatus(u.id)}
                      >
                        {u.status === 'active' ? <Ban className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeleteUser(u)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="pt-3">
            <Pagination
              page={page} totalPages={totalPages} totalItems={totalItems}
              from={from} to={to} pageSize={pageSize}
              onPageChange={setPage} onPageSizeChange={setPageSize}
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit Role Modal */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Edit User Role', 'تعديل دور المستخدم')}</DialogTitle>
            <DialogDescription>{editUser && t(`Change role for ${editUser.name}`, `تغيير دور ${editUser.nameAr}`)}</DialogDescription>
          </DialogHeader>
          <Select value={editRole} onValueChange={(v) => setEditRole(v as UserRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(roleLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{t(label.en, label.ar)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>{t('Cancel', 'إلغاء')}</Button>
            <Button onClick={handleEditRole}>{t('Save', 'حفظ')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Modal */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Create New User', 'إنشاء مستخدم جديد')}</DialogTitle>
            <DialogDescription>{t('Add a new user to the platform', 'إضافة مستخدم جديد للمنصة')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder={t('Name (English)', 'الاسم (إنجليزي)')} value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            <Input placeholder={t('Name (Arabic)', 'الاسم (عربي)')} value={newUser.nameAr} onChange={(e) => setNewUser({ ...newUser, nameAr: e.target.value })} />
            <Input placeholder={t('Email', 'البريد الإلكتروني')} type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as UserRole })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{t(label.en, label.ar)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} disabled={!newUser.name || !newUser.email}>{t('Create', 'إنشاء')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">{t('Delete User', 'حذف المستخدم')}</DialogTitle>
            <DialogDescription>
              {deleteUser && t(`Are you sure you want to delete ${deleteUser.name}? This action cannot be undone.`, `هل أنت متأكد من حذف ${deleteUser.nameAr}؟ لا يمكن التراجع عن هذا الإجراء.`)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteUser(null)}>{t('Cancel', 'إلغاء')}</Button>
            <Button
              variant="destructive"
              onClick={() => deleteUser && handleDelete(deleteUser.id)}
            >
              {t('Delete', 'حذف')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;









