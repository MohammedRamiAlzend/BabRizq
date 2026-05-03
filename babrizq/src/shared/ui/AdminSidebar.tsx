import { LayoutDashboard, Users, Settings } from 'lucide-react';
import { User } from 'lucide-react';
import { NavLink } from '@/shared/ui/NavLink';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/shared/ui/ui/sidebar';

const AdminSidebar = () => {
  const { t } = useLocale();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const items = [
    { title: t('Overview', 'نظرة عامة'), url: '/admin', icon: LayoutDashboard },
    { title: t('Users', 'المستخدمون'), url: '/admin/users', icon: Users },
    { title: t('Settings', 'الإعدادات'), url: '/admin/settings', icon: Settings },
    { title: t('Account', 'الحساب'), url: '/admin/profile', icon: User },
  ];

  return (
    <Sidebar collapsible="icon" className="!top-16 !h-auto">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('Admin Panel', 'لوحة الإدارة')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/admin'}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;









