import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Patel Heritage — Visitor Entry',
  // The gate screen must never be indexed or linked from anywhere public.
  robots: { index: false, follow: false },
};

/**
 * The kiosk deliberately renders WITHOUT the app's Navigation bar.
 *
 * This screen sits unattended at the gate where anyone can touch it. Giving it
 * the normal nav would hand a stranger a route into the resident directory,
 * messages, and the rest of the society app. The kiosk is a sealed surface:
 * no session, no navigation, no resident names.
 */
export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-slate-950 select-none">
      {children}
    </div>
  );
}
