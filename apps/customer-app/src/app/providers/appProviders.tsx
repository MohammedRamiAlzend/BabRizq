/**
 * App providers — Customer application.
 *
 * Provider order matters: Theme → Locale → Auth → Cart → Tooltip → Toasters.
 * Theme/Locale live in the shared package; Auth/Cart are app features.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster as Sonner } from '@/shared/ui/ui/sonner';
import { Toaster } from '@/shared/ui/ui/toaster';
import { TooltipProvider } from '@/shared/ui/ui/tooltip';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import { LocaleProvider } from '@/shared/contexts/LocaleContext';
import { AuthProvider } from '@/features/auth/model/authContext';
import { CartProvider } from '@/features/cart/model/cartContext';

const queryClient = new QueryClient();

export const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {children}
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
