'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Package,
  ShieldAlert,
  User,
  XCircle,
} from 'lucide-react';
import { flatsOnFloor, floorsForWing } from '@/lib/flats';
import type { Wing } from '@/types';

/**
 * Kiosk screens.
 *
 * Design constraints, all of them from the gate rather than from taste:
 *  - read at arm's length in daylight, so type is large and contrast is high;
 *  - operated with a thumb, sometimes a wet or gloved one, so nothing is
 *    smaller than about 4.5rem tall;
 *  - a stranger is standing behind the visitor, so no resident names appear;
 *  - motion is used to show where you are in the sequence, never for decoration.
 */

export const PURPOSES = [
  {
    id: 'GUEST' as const,
    label: 'Visitor',
    hindi: 'मुलाक़ाती',
    icon: User,
    description: 'Visiting someone',
  },
  {
    id: 'DELIVERY' as const,
    label: 'Delivery',
    hindi: 'डिलीवरी',
    icon: Package,
    description: 'Dropping something off',
  },
];

const spring = { type: 'spring' as const, stiffness: 260, damping: 26 };

/* ------------------------------------------------------------------ shell */

export function StepShell({
  title,
  subtitle,
  onBack,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full flex-col bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900"
    >
      <div className="flex items-center gap-4 px-6 pt-6 sm:px-10 sm:pt-8">
        {onBack && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onBack}
            className="flex items-center gap-2 rounded-2xl bg-white/10 px-5 py-4 text-lg text-white/80 active:bg-white/20 sm:px-6"
          >
            <ArrowLeft className="h-6 w-6" />
            Back
          </motion.button>
        )}
      </div>

      <div className="px-6 pt-4 text-center sm:px-10">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="text-3xl font-bold text-white sm:text-5xl"
        >
          {title}
        </motion.h2>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.12 }}
            className="mt-2 text-lg text-white/45 sm:text-xl"
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-10">{children}</div>

      {footer && <div className="px-6 pb-6 sm:px-10 sm:pb-8">{footer}</div>}
    </motion.div>
  );
}

/* ----------------------------------------------------------------- welcome */

export function WelcomeStep({ onStart }: { onStart: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4 }}
      onClick={onStart}
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-8 text-center"
    >
      {/* Slow drifting glow — signals the screen is awake without demanding attention. */}
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute h-[36rem] w-[36rem] rounded-full bg-amber-500/20 blur-[120px]"
      />

      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, ...spring }}
        className="relative"
      >
        <p className="text-base font-medium tracking-[0.45em] text-amber-300/80 sm:text-xl">
          WELCOME TO
        </p>
        <h1 className="mt-4 text-6xl font-bold leading-none text-white drop-shadow-2xl sm:text-8xl">
          Patel Heritage
        </h1>
        <p className="mt-5 text-xl text-white/50 sm:text-2xl">पटेल हेरिटेज में आपका स्वागत है</p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.4, ...spring }}
        className="relative mt-20"
      >
        <motion.div
          animate={{ scale: [1, 1.09, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          className="absolute -inset-5 rounded-full border-2 border-amber-300/50"
        />
        <div className="rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 px-16 py-7 text-3xl font-bold text-black shadow-2xl shadow-amber-500/40 sm:px-24 sm:py-8 sm:text-4xl">
          TOUCH TO START
        </div>
      </motion.div>

      <motion.p
        animate={{ opacity: [0.35, 0.75, 0.35] }}
        transition={{ duration: 2.4, repeat: Infinity }}
        className="relative mt-8 text-lg text-white/50"
      >
        शुरू करने के लिए स्क्रीन को छुएं
      </motion.p>

      {/* DPDP Act 2023: tell people about the camera before it is used on them. */}
      <p className="absolute bottom-5 max-w-3xl px-6 text-xs leading-relaxed text-white/30 sm:text-sm">
        For the safety of residents, your photograph is taken when you request entry and is shared
        only with the flat you are visiting and society security. Photographs are deleted
        automatically after 30 days.
      </p>
    </motion.button>
  );
}

/* ------------------------------------------------------- name and purpose */

export function DetailsStep({
  name,
  onNameChange,
  onPick,
  onBack,
}: {
  name: string;
  onNameChange: (value: string) => void;
  onPick: (purpose: 'GUEST' | 'DELIVERY') => void;
  onBack: () => void;
}) {
  const ready = name.trim().length >= 2;

  return (
    <StepShell
      title="What is your name?"
      subtitle="आपका नाम क्या है?"
      onBack={onBack}
      footer={
        <p className="text-center text-base text-white/35">
          Your name is shown to the flat you are visiting
        </p>
      }
    >
      <div className="mx-auto flex h-full max-w-3xl flex-col justify-center gap-10">
        <motion.input
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          autoFocus
          value={name}
          onChange={(e) => onNameChange(e.target.value.slice(0, 40))}
          placeholder="Type your name"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          className="w-full rounded-3xl border-2 border-white/20 bg-white/10 px-8 py-7 text-center text-3xl font-semibold text-white placeholder-white/25 outline-none transition-colors focus:border-amber-400 sm:text-4xl"
        />

        <div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: ready ? 1 : 0.4 }}
            className="mb-5 text-center text-2xl font-medium text-white sm:text-3xl"
          >
            Why are you here?{' '}
            <span className="text-white/40">आप क्यों आए हैं?</span>
          </motion.p>

          <div className="grid grid-cols-2 gap-5">
            {PURPOSES.map((purpose, index) => {
              const Icon = purpose.icon;
              return (
                <motion.button
                  key={purpose.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 + index * 0.07, ...spring }}
                  whileTap={ready ? { scale: 0.95 } : undefined}
                  disabled={!ready}
                  onClick={() => onPick(purpose.id)}
                  className="flex min-h-[13rem] flex-col items-center justify-center gap-3 rounded-3xl border-2 border-white/15 bg-white/10 p-6 transition-all enabled:active:border-amber-400 enabled:active:bg-amber-400/20 disabled:opacity-30"
                >
                  <Icon className="h-14 w-14 text-amber-300 sm:h-16 sm:w-16" strokeWidth={1.6} />
                  <span className="text-3xl font-bold text-white sm:text-4xl">{purpose.label}</span>
                  <span className="text-lg text-white/45">{purpose.hindi}</span>
                </motion.button>
              );
            })}
          </div>

          {!ready && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-5 text-center text-lg text-white/35"
            >
              Please type your name first
            </motion.p>
          )}
        </div>
      </div>
    </StepShell>
  );
}

/* -------------------------------------------------------------------- wing */

export function WingStep({
  wings,
  onPick,
  onBack,
}: {
  wings: Wing[];
  onPick: (wing: Wing) => void;
  onBack: () => void;
}) {
  return (
    <StepShell
      title="Which flat do you want to enter?"
      subtitle="आप किस विंग में जाना चाहते हैं?"
      onBack={onBack}
    >
      <div className="mx-auto grid h-full max-w-4xl grid-cols-2 content-center gap-5 sm:grid-cols-3">
        {wings.map((wing, index) => (
          <motion.button
            key={wing}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, ...spring }}
            whileTap={{ scale: 0.94 }}
            onClick={() => onPick(wing)}
            className="group relative flex min-h-[9rem] flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-white/15 bg-white/10 transition-colors active:border-amber-400 active:bg-amber-400/20 sm:min-h-[11rem]"
          >
            <span className="text-sm uppercase tracking-[0.3em] text-white/35">Wing</span>
            <span className="text-6xl font-black text-white sm:text-7xl">{wing}</span>
          </motion.button>
        ))}
      </div>
    </StepShell>
  );
}

/* -------------------------------------------------------------------- flat */

export function FlatStep({
  wing,
  onPick,
  onBack,
}: {
  wing: Wing;
  onPick: (flat: string) => void;
  onBack: () => void;
}) {
  const floors = floorsForWing(wing);

  return (
    <StepShell
      title={`Wing ${wing} — which flat?`}
      subtitle="कौन सा फ्लैट?"
      onBack={onBack}
      footer={
        <p className="flex items-center justify-center gap-2 text-center text-base text-amber-200/70">
          <Camera className="h-5 w-5" />
          Your photo will be taken and sent to the flat for approval
        </p>
      }
    >
      <div className="mx-auto max-w-4xl space-y-3">
        {floors.map((floor, index) => (
          <motion.div
            key={floor}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            // Cap the stagger so the last floor of a 19-storey wing is not a
            // second and a half behind the first.
            transition={{ delay: Math.min(index * 0.02, 0.3) }}
            className="flex items-center gap-4 rounded-2xl bg-white/[0.04] p-3"
          >
            <span className="w-20 shrink-0 text-right text-base font-medium text-white/30">
              Floor {floor}
            </span>
            <div className="flex flex-1 flex-wrap gap-3">
              {flatsOnFloor(wing, floor).map((flat) => (
                <motion.button
                  key={flat}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => onPick(flat)}
                  className="min-w-[7.5rem] flex-1 rounded-2xl border-2 border-white/15 bg-white/10 px-4 py-6 text-3xl font-bold text-white transition-colors active:border-amber-400 active:bg-amber-400/25 sm:text-4xl"
                >
                  {flat}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </StepShell>
  );
}

/* ----------------------------------------------------------------- capture */

export function CaptureStep({
  countdown,
  cameraState,
  flash,
}: {
  countdown: number;
  cameraState: string;
  flash: boolean;
}) {
  const cameraBroken = cameraState === 'denied' || cameraState === 'unavailable';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative flex h-full flex-col items-center justify-center"
    >
      <div className="absolute inset-0 bg-black/45" />

      {/* Shutter flash */}
      {flash && (
        <motion.div
          initial={{ opacity: 0.95 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          className="pointer-events-none absolute inset-0 z-20 bg-white"
        />
      )}

      <div className="relative z-10 flex flex-col items-center text-center">
        <p className="text-3xl font-semibold text-white sm:text-4xl">Look at the camera</p>
        <p className="mt-1 text-xl text-white/50">कैमरे की ओर देखें</p>

        {cameraBroken ? (
          <div className="mt-10 max-w-lg rounded-3xl bg-amber-500/20 px-10 py-8">
            <ShieldAlert className="mx-auto h-16 w-16 text-amber-300" />
            <p className="mt-4 text-xl text-amber-100">
              Camera unavailable. Your request will still be sent, and security will be notified.
            </p>
          </div>
        ) : (
          <div className="relative mt-10 flex h-52 w-52 items-center justify-center">
            <motion.svg viewBox="0 0 100 100" className="absolute h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="4" />
              <motion.circle
                cx="50"
                cy="50"
                r="46"
                fill="none"
                stroke="rgb(252 211 77)"
                strokeWidth="4"
                strokeLinecap="round"
                pathLength={1}
                initial={{ pathLength: 1 }}
                animate={{ pathLength: 0 }}
                transition={{ duration: 3, ease: 'linear' }}
              />
            </motion.svg>
            <motion.span
              key={countdown}
              initial={{ scale: 1.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-[7rem] font-black leading-none text-white drop-shadow-2xl"
            >
              {countdown > 0 ? countdown : ''}
            </motion.span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ----------------------------------------------------------------- waiting */

export function WaitingStep({
  flat,
  name,
  secondsLeft,
  totalSeconds,
  photoOk,
}: {
  flat: string;
  name: string;
  secondsLeft: number;
  totalSeconds: number;
  photoOk: boolean;
}) {
  const progress = totalSeconds > 0 ? secondsLeft / totalSeconds : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-8 text-center"
    >
      <div className="relative flex h-64 w-64 items-center justify-center">
        {[0, 1, 2].map((ring) => (
          <motion.span
            key={ring}
            animate={{ scale: [1, 1.75], opacity: [0.5, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, delay: ring * 0.8, ease: 'easeOut' }}
            className="absolute h-32 w-32 rounded-full border-2 border-amber-300"
          />
        ))}
        <svg viewBox="0 0 100 100" className="absolute h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="3" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="rgb(252 211 77)"
            strokeWidth="3"
            strokeLinecap="round"
            pathLength={1}
            style={{ strokeDasharray: 1, strokeDashoffset: 1 - progress }}
          />
        </svg>
        <div className="relative text-6xl font-black tabular-nums text-amber-300">
          {secondsLeft}
        </div>
      </div>

      <h2 className="mt-10 text-4xl font-bold text-white sm:text-5xl">Ringing flat {flat}</h2>
      <p className="mt-3 text-2xl text-white/55">
        {name ? `Thank you, ${name}. ` : ''}Please wait
      </p>
      <p className="mt-1 text-xl text-white/35">कृपया प्रतीक्षा करें</p>

      {!photoOk && (
        <p className="mt-8 rounded-2xl bg-amber-500/15 px-6 py-3 text-lg text-amber-200">
          Photo could not be taken — security has been informed
        </p>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ result */

export type Outcome = 'APPROVED' | 'DENIED' | 'EXPIRED' | 'ERROR';

export function ResultStep({
  outcome,
  errorText,
  onDone,
}: {
  outcome: Outcome | null;
  errorText: string | null;
  onDone: () => void;
}) {
  const config = {
    APPROVED: {
      icon: CheckCircle2,
      colour: 'text-emerald-400',
      glow: 'bg-emerald-500/25',
      bg: 'from-emerald-950 via-slate-950 to-slate-900',
      title: 'Please come in',
      sub: 'अंदर आइए — show this screen to the guard',
    },
    DENIED: {
      icon: XCircle,
      colour: 'text-red-400',
      glow: 'bg-red-500/25',
      bg: 'from-red-950 via-slate-950 to-slate-900',
      title: 'Entry not approved',
      sub: 'Please contact the person you are visiting',
    },
    EXPIRED: {
      icon: ShieldAlert,
      colour: 'text-amber-400',
      glow: 'bg-amber-500/25',
      bg: 'from-amber-950 via-slate-950 to-slate-900',
      title: 'No answer',
      sub: 'Please see the security guard at the gate',
    },
    ERROR: {
      icon: ShieldAlert,
      colour: 'text-amber-400',
      glow: 'bg-amber-500/25',
      bg: 'from-amber-950 via-slate-950 to-slate-900',
      title: 'Please see the guard',
      sub: errorText ?? '',
    },
  }[outcome ?? 'ERROR'];

  const Icon = config.icon;

  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br px-8 text-center ${config.bg}`}
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8 }}
        className={`pointer-events-none absolute h-[30rem] w-[30rem] rounded-full blur-[100px] ${config.glow}`}
      />
      <motion.div
        initial={{ scale: 0.3, opacity: 0, rotate: -12 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ ...spring, delay: 0.05 }}
        className="relative"
      >
        <Icon className={`h-40 w-40 sm:h-48 sm:w-48 ${config.colour}`} strokeWidth={1.6} />
      </motion.div>

      <motion.h2
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative mt-8 text-5xl font-bold text-white sm:text-6xl"
      >
        {config.title}
      </motion.h2>
      <motion.p
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="relative mt-4 max-w-2xl text-2xl text-white/55"
      >
        {config.sub}
      </motion.p>

      <p className="absolute bottom-10 text-lg text-white/25">Touch anywhere to finish</p>
    </motion.button>
  );
}
