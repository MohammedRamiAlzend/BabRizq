/**
 * App providers — Platform Admin application.
 *
 * Admin has no role-specific state feature, so the tree is the shared baseline:
 * Theme → Locale → Auth → Tooltip → Toasters.
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
