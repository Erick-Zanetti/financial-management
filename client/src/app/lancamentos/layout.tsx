import { MonthNavigation } from '@/components/layout/month-navigation';
import { MonthProvider } from '@/providers/month-provider';

export default function LancamentosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <MonthProvider>
      <MonthNavigation />
      {children}
    </MonthProvider>
  );
}
