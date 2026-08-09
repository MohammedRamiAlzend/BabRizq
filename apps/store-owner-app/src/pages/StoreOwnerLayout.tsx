import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/model/authContext';
import { useLocale } from '@/shared/contexts/LocaleContext';
import AppHeader from '@/shared/ui/AppHeader';
import StoreOwnerSidebar from '@/shared/ui/StoreOwnerSidebar';
import { SidebarProvider, SidebarTrigger } from '@/shared/ui/ui/sidebar';

const StoreOwnerLayout = () => {
  const { user, isAuthenticated } = useAuth();
  const { dir } = useLocale();

  if (!isAuthenticated || !user || user.role !== 'store_owner') {
    return <Navigate to="/" replace />;
  }

  return (
    <SidebarProvider>
      <div className="flex flex-col h-svh w-full bg-background">
        <AppHeader />
        {/*
          Force ltr flex-direction so the sidebar always appears on the physical
          left regardless of the page's writing direction (Arabic / RTL).
          The content area re-applies the locale direction so inner text stays RTL.
        */}
        <div className="flex flex-1 overflow-hidden" style={{ flexDirection: 'row' }}>
          <StoreOwnerSidebar />
          <div className="flex-1 flex flex-col min-w-0" dir={dir}>
            <div className="flex items-center border-b border-border px-4 h-10 shrink-0">
              <SidebarTrigger />
            </div>
            <main className="flex-1 overflow-auto p-4 md:p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StoreOwnerLayout;









