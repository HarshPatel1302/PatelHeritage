import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Patel Heritage Approvals',
  description: 'Approve or deny visitors at your flat',
  manifest: '/owner.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'PH Approvals',
    statusBarStyle: 'black-translucent',
  },
  icons: { icon: '/icons/owner-192.png', apple: '/icons/owner-192.png' },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

/**
 * The owner app.
 *
 * A separate surface from the society site: its own manifest, its own icon and
 * its own name on the home screen, so a resident installs "PH Approvals" and
 * gets only approvals and history — no wings directory, no complaints, no
 * committee tools. It renders without the society navigation entirely.
 *
 * It shares this deployment, and therefore the database, which is what makes
 * the gate kiosk and this app talk to each other with no integration work.
 */
export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto overscroll-none bg-slate-950 text-white">
      {children}
    </div>
  );
}
