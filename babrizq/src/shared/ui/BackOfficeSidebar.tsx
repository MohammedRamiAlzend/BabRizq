import { useState } from 'react';
import { LayoutDashboard, ClipboardList, Truck, Map, Bell, MessageSquare, Settings } from 'lucide-react';
import { NavLink } from '@/shared/ui/NavLink';
import { useLocale } from '@/shared/contexts/LocaleContext';
import { INITIAL_NOTIFICATIONS } from '~/entities/backOfficeData';
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

const BackOfficeSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { t } = useLocale();

  const unread = INITIAL_NOTIFICATIONS.filter(n => !n.isRead).length;

  const items = [
    { titleEn: 'Overview', titleAr: 'نظرة عامة', url: '/back-office', icon: LayoutDashboard },
    { titleEn: 'Orders', titleAr: 'الطلبات', url: '/back-office/orders', icon: ClipboardList },
    { titleEn: 'Drivers', titleAr: 'السائقون', url: '/back-office/drivers', icon: Truck },
    { titleEn: 'Live Map', titleAr: 'الخريطة المباشرة', url: '/back-office/map', icon: Map },
    {
      titleEn: 'Notifications',
      titleAr: 'الإشعارات',
      url: '/back-office/notifications',
      icon: Bell,
      badge: unread > 0 ? unread : undefined,
    },
    { titleEn: 'Chat', titleAr: 'التواصل', url: '/back-office/chat', icon: MessageSquare },
  ];

  return (
    <Sidebar collapsible="icon" className="!top-16 !h-auto">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('Back Office', 'المكتب الخلفي')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/back-office'}
                      className="hover:bg-accent/50"
                      activeClassName="bg-primary/10 text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 me-2 shrink-0" />
                      {!collapsed && (
                        <span className="flex-1 flex items-center justify-between">
                          {t(item.titleEn, item.titleAr)}
                          {'badge' in item && item.badge !== undefined && (
                            <span className="ms-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                              {item.badge}
                            </span>
                          )}
                        </span>
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

export default BackOfficeSidebar;









