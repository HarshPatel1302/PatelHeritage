'use client';

import { motion } from 'framer-motion';
import { Bell, Building2, CreditCard, Cpu, DoorOpen, ScanFace } from 'lucide-react';
import Link from 'next/link';

/**
 * The front door.
 *
 * This used to redirect straight into the society site, which meant opening
 * localhost dropped you in a placeholder photo gallery rather than at either of
 * the two things this system actually is. Now it names them.
 *
 * Deliberately static and unauthenticated: it is a signpost, not a dashboard,
 * and every destination enforces its own access.
 */

const SURFACES = [
  {
    href: '/kiosk',
    icon: ScanFace,
    title: 'Gate Screen',
    subtitle: 'For the tablet at the gate',
    description:
      'Welcome → name and purpose → wing → flat → photo. Rings the flat for approval.',
    accent: 'from-amber-400 to-yellow-500',
    ring: 'group-hover:border-amber-400/60',
  },
  {
    href: '/owner',
    icon: Bell,
    title: 'Owner App',
    subtitle: 'For residents, on their phone',
    description:
      'Allow or deny visitors at your flat, and see who has come. Sign in with your flat number.',
    accent: 'from-emerald-400 to-teal-500',
    ring: 'group-hover:border-emerald-400/60',
  },
  {
    href: '/gate',
    icon: DoorOpen,
    title: 'Guard Console',
    subtitle: 'For the security guard',
    description:
      'Live card taps from the RS9N reader and every visitor waiting, on one screen.',
    accent: 'from-sky-400 to-blue-500',
    ring: 'group-hover:border-sky-400/60',
  },
];

const SECONDARY = [
  { href: '/admin/cards', icon: CreditCard, label: 'Society Cards' },
  { href: '/admin/devices', icon: Cpu, label: 'Card Readers' },
  { href: '/resident-home', icon: Building2, label: 'Society Site' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-5 py-16 pt-28">
      <div className="container mx-auto max-w-5xl">
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-14 text-center"
        >
          <h1 className="text-5xl font-bold text-white sm:text-6xl">Patel Heritage</h1>
          <p className="mt-3 text-xl text-white/45">Society Access Control</p>
        </motion.header>

        <div className="grid gap-5 md:grid-cols-3">
          {SURFACES.map((surface, index) => {
            const Icon = surface.icon;
            return (
              <motion.div
                key={surface.href}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + index * 0.08, type: 'spring', stiffness: 220, damping: 24 }}
              >
                <Link
                  href={surface.href}
                  className={`group flex h-full flex-col rounded-3xl border-2 border-white/10 bg-white/[0.06] p-7 transition-colors ${surface.ring}`}
                >
                  <div
                    className={`mb-5 inline-flex w-fit rounded-2xl bg-gradient-to-br p-4 ${surface.accent}`}
                  >
                    <Icon className="h-8 w-8 text-black" strokeWidth={2} />
                  </div>

                  <h2 className="text-2xl font-bold text-white">{surface.title}</h2>
                  <p className="mt-0.5 text-sm font-medium uppercase tracking-wide text-white/35">
                    {surface.subtitle}
                  </p>
                  <p className="mt-4 flex-1 leading-relaxed text-white/55">
                    {surface.description}
                  </p>

                  <span className="mt-6 inline-flex items-center gap-2 font-semibold text-white/70 transition-transform group-hover:translate-x-1">
                    Open
                    <span aria-hidden>→</span>
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 flex flex-wrap items-center justify-center gap-3"
        >
          {SECONDARY.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-white/65 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
