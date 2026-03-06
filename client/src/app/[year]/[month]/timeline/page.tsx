import { redirect } from 'next/navigation';

interface TimelineRedirectProps {
  params: Promise<{ year: string; month: string }>;
}

export default async function TimelineRedirect({ params }: TimelineRedirectProps) {
  const { year, month } = await params;
  redirect(`/${year}/${month}`);
}
