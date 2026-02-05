'use client';

import { useParams } from 'next/navigation';
import { TimelineView } from '@/components/timeline/timeline-view';

export default function TimelinePage() {
  const params = useParams();
  const year = Number(params.year);
  const month = Number(params.month);

  return <TimelineView month={month} year={year} />;
}
