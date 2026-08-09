import { LayoutDashboard, Package, ClipboardList, ShoppingBag, Tag, Percent, BarChart2, MessageSquare, Settings, Warehouse, Calculator } from 'lucide-react';
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

const StoreOwnerSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { t } = useLocale();

  const items = [
    { titleEn: 'Overview', titleAr: 'نظرة عامة', url: '/store-owner', icon: LayoutDashboard },
    { titleEn: 'Products', titleAr: 'إدارة المنتجات', url: '/store-owner/products', icon: Package },
    { titleEn: 'Orders', titleAr: 'إدارة الطلبات', url: '/store-owner/orders', icon: ClipboardList },
    { titleEn: 'Sales', titleAr: 'إدارة المبيعات', url: '/store-owner/sales', icon: ShoppingBag },
    { titleEn: 'Categories', titleAr: 'إدارة التصنيفات', url: '/store-owner/categories', icon: Tag },
    { titleEn: 'Offers', titleAr: 'إدارة العروض', url: '/store-owner/offers', icon: Percent },
    { titleEn: 'Warehouse', titleAr: 'إدارة المستودع', url: '/store-owner/warehouse', icon: Warehouse },
    { titleEn: 'Accounting', titleAr: 'المحاسبة والمالية', url: '/store-owner/accounting', icon: Calculator },
    { titleEn: 'Reports', titleAr: 'التقارير', url: '/store-owner/reports', icon: BarChart2 },
    { titleEn: 'Support Chat', titleAr: 'التواصل مع الإدارة', url: '/store-owner/chat', icon: MessageSquare },
    { titleEn: 'Settings', titleAr: 'الإعدادات', url: '/store-owner/settings', icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon" className="!top-16 !h-auto">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('Store Management', 'إدارة المتجر')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-accent/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 me-2 shrink-0" />
                      {!collapsed && <span>{t(item.titleEn, item.titleAr)}</span>}
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

export default StoreOwnerSidebar;









