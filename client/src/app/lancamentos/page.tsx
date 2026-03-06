import { redirect } from 'next/navigation';

export default function LancamentosIndex() {
  const today = new Date();
  redirect(`/lancamentos/${today.getFullYear()}/${today.getMonth() + 1}`);
}
