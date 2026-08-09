import { LayoutDashboard, ClipboardList, History, User } from 'lucide-react';
import { NavLink } from '@/shared/ui/NavLink';
import { useLocale } from '@/shared/contexts/LocaleContext';
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

const items = [
  { titleEn: 'Overview', titleAr: 'نظرة عامة', url: '/delivery', icon: LayoutDashboard, end: true },
  { titleEn: 'Active Orders', titleAr: 'الطلبات النشطة', url: '/delivery/orders', icon: ClipboardList, end: false },
  { titleEn: 'Delivery History', titleAr: 'سجل التوصيل', url: '/delivery/history', icon: History, end: false },
  { titleEn: 'My Profile', titleAr: 'ملفي الشخصي', url: '/delivery/profile', icon: User, end: false },
];

const DeliverySidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { t } = useLocale();

  return (
    <Sidebar collapsible="icon" className="!top-16 !h-auto">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('Delivery Driver', 'عامل التوصيل')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className="hover:bg-accent/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 me-2 shrink-0" />
                      {!collapsed && (
                        <span className="flex-1">{t(item.titleEn, item.titleAr)}</span>
                      )}
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

export default DeliverySidebar;









