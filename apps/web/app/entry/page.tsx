import { redirect } from 'next/navigation';

/**
 * Superseded by the gate console.
 *
 * This page used to hold its visitor list in component state alone: entries a
 * guard registered here vanished on refresh, were invisible to every other
 * device, and never reached the resident. Keeping two entry screens where one
 * silently does nothing is worse than having one, so this now redirects to the
 * real console at /gate, which is backed by the database.
 */
export default function EntryPage() {
  redirect('/gate');
}
