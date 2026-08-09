/**
 * App providers — Back Office application.
 *
 * Provider order matters: Theme → Locale → Auth → Orders → Tooltip → Toasters.
 * The OrdersProvider owns the fulfillment state (orders, drivers, proof of delivery).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster as Sonner } from '@/shared/ui/ui/sonner';
import { Toaster } from '@/shared/ui/ui/toaster';
import { TooltipProvider } from '@/shared/ui/ui/tooltip';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import { LocaleProvider } from '@/shared/contexts/LocaleContext';
import { AuthProvider } from '@/features/auth/model/authContext';
import { OrdersProvider } from '@/features/orders/model/ordersContext';

const queryClient = new QueryClient();

export const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <OrdersProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {children}
            </TooltipProvider>
          </OrdersProvider>
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
