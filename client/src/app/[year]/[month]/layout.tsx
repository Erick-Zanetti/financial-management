import { SubNavigation } from '@/components/layout/sub-navigation';

interface MonthLayoutProps {
  children: React.ReactNode;
  params: Promise<{ year: string; month: string }>;
}

export default async function MonthLayout({ children, params }: MonthLayoutProps) {
  const { year, month } = await params;

  return (
    <div>
      <SubNavigation year={Number(year)} month={Number(month)} />
      <div className="container mx-auto py-6 px-4">{children}</div>
    </div>
  );
}
