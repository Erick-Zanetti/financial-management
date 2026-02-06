import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { SettingsProvider } from '@/providers/settings-provider';
import { QueryProvider } from '@/providers/query-provider';
import { Header } from '@/components/layout/header';
import { MonthNavigation } from '@/components/layout/month-navigation';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Controle Financeiro',
  description: 'Aplicação de controle financeiro pessoal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <SettingsProvider>
            <QueryProvider>
              <div className="min-h-screen bg-background">
                <Header />
                <MonthNavigation />
                <main>{children}</main>
              </div>
              <Toaster />
            </QueryProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
