import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster as Sonner } from '@/shared/ui/ui/sonner';
import { Toaster } from '@/shared/ui/ui/toaster';
import { TooltipProvider } from '@/shared/ui/ui/tooltip';
import { AuthProvider } from '@/features/auth';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import { LocaleProvider } from '@/shared/contexts/LocaleContext';
import { CartProvider } from '@/features/cart';
import { OrdersProvider } from '@/features/orders';

const queryClient = new QueryClient();

export const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <CartProvider>
            <OrdersProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                {children}
              </TooltipProvider>
            </OrdersProvider>
          </CartProvider>
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  </QueryClientProvider>
);