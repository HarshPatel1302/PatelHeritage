import { redirect } from 'next/navigation';

/** Alias: the guard console lives at /gate. */
export default function GuardPage() {
  redirect('/gate');
}
