/**
 * App providers — Store Owner application.
 *
 * Baseline shared tree: Theme → Locale → Auth → Tooltip → Toasters.
 * (Store-owner state lives in pages/entities; no global feature context yet.)
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster as Sonner } from '@/shared/ui/ui/sonner';
import { Toaster } from '@/shared/ui/ui/toaster';
import { TooltipProvider } from '@/shared/ui/ui/tooltip';
import { ThemeProvider } from '@/shared/contexts/ThemeContext';
import { LocaleProvider } from '@/shared/contexts/LocaleContext';
import { AuthProvider } from '@/features/auth/model/authContext';

const queryClient = new QueryClient();

export const AppProviders = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </AuthProvider>
      </LocaleProvider>
    </ThemeProvider>
  </QueryClientProvider>
);
