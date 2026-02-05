import { redirect } from 'next/navigation';

export default function Home() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  redirect(`/${year}/${month}`);
}
