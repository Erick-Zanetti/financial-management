import { MonthNavigation } from '@/components/layout/month-navigation';

export default function LancamentosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MonthNavigation />
      {children}
    </>
  );
}
