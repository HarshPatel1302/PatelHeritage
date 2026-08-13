'use client';

import { usePathname } from 'next/navigation';
import Navigation from '@/components/Navigation';
import VisitorRingOverlay from '@/components/VisitorRingOverlay';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Decides what wraps the page.
 *
 * Two surfaces render bare:
 *
 *  - the gate kiosk, which must not offer a stranger any route into the
 *    resident directory, and belongs to no flat so has nothing to ring about;
 *  - the owner app, which is a separate product with its own header, its own
 *    ringing and its own home-screen identity. Wrapping it in the society
 *    navigation would leak the whole site into what is meant to be a single
 *    purpose app, and its own approvals screen already rings.
 */
export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const isStandalone =
    (pathname?.startsWith('/kiosk') || pathname?.startsWith('/owner')) ?? false;

  if (isStandalone) return <>{children}</>;

  return (
    <>
      <Navigation />
      {children}
      {isAuthenticated && <VisitorRingOverlay />}
    </>
  );
}
