import { DEMO_IDENTITIES, demoDefaultUsername, isDemoMode } from '@/lib/dev-mode';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import CredentialsForm from './CredentialsForm';
import IdentitySwitcher from './IdentitySwitcher';

/**
 * Demo mode replaces the password screen with a passwordless identity picker;
 * production keeps the real form. Decided on the server so the credentials UI
 * is not even sent to the browser while demo mode is on, and vice versa.
 */
export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (!isDemoMode()) return <CredentialsForm />;

  const session = await getSession();
  const current = session
    ? ((
        await prisma.user.findUnique({
          where: { id: session.userId },
          select: { username: true },
        })
      )?.username ?? demoDefaultUsername())
    : demoDefaultUsername();

  return <IdentitySwitcher identities={DEMO_IDENTITIES} current={current} />;
}
