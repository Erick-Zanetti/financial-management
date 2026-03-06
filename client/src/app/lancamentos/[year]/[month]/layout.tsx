interface MonthLayoutProps {
  children: React.ReactNode;
}

export default function MonthLayout({ children }: MonthLayoutProps) {
  return (
    <div>
      <div className="container mx-auto py-6 px-4">{children}</div>
    </div>
  );
}
