import { LayoutDashboard, Link2, BarChart3, Settings } from 'lucide-react';
import { NavLink } from '@/shared/ui/NavLink';
import { useLocale } from '@/shared/contexts/LocaleContext';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
} from '@/shared/ui/ui/sidebar';

const MarketerSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { t } = useLocale();

  const items = [
    { titleEn: 'Overview', titleAr: 'نظرة عامة', url: '/marketer', icon: LayoutDashboard },
    { titleEn: 'Link Generator', titleAr: 'مولّد الروابط', url: '/marketer/links', icon: Link2 },
    { titleEn: 'Performance', titleAr: 'الأداء', url: '/marketer/performance', icon: BarChart3 },
    { titleEn: 'Settings', titleAr: 'الإعدادات', url: '/marketer/settings', icon: Settings },
  ];

  return (
    <Sidebar collapsible="icon" className="!top-16 !h-auto">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('Affiliate Panel', 'لوحة المسوّق')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className="hover:bg-accent/50" activeClassName="bg-primary/10 text-primary font-medium">
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

export default MarketerSidebar;









