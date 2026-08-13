import { notFound } from 'next/navigation';
import { isDemoMode } from '@/lib/dev-mode';
import ControlPanelClient from './ControlPanelClient';

/**
 * Development control panel.
 *
 * Server component so the demo-mode check runs before anything is sent to the
 * browser: outside demo mode this 404s and the client bundle is never shipped.
 */
export const dynamic = 'force-dynamic';

export default function DevControlPanelPage() {
  if (!isDemoMode()) notFound();
  return <ControlPanelClient />;
}
