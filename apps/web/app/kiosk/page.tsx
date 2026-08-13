'use client';

import { AnimatePresence } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import PairScreen from '@/components/kiosk/PairScreen';
import {
  CaptureStep,
  DetailsStep,
  FlatStep,
  ResultStep,
  WaitingStep,
  WelcomeStep,
  WingStep,
  type Outcome,
} from '@/components/kiosk/steps';
import { wings } from '@/lib/flats';
import { useKioskCamera } from '@/lib/use-kiosk-camera';
import type { Wing } from '@/types';

type Step = 'welcome' | 'details' | 'wing' | 'flat' | 'capturing' | 'waiting' | 'result';

/** Seconds of visitor inactivity before the kiosk returns to the welcome screen. */
const IDLE_RESET_SECONDS = 60;
/** The countdown the visitor sees. The whole capture fits inside three seconds. */
const CAPTURE_COUNTDOWN = 3;

/**
 * The gate screen.
 *
 *   Welcome → Name + Purpose → Wing → Flat → photo → ringing → answer
 *
 * There is deliberately no floor step: the visitor knows the flat number, not
 * which floor it is on, so wings open straight to a floor-grouped list of flats.
 */
export default function KioskPage() {
  const [paired, setPaired] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>('welcome');

  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState<'GUEST' | 'DELIVERY'>('GUEST');
  const [wing, setWing] = useState<Wing | null>(null);
  const [flat, setFlat] = useState<string | null>(null);

  const [countdown, setCountdown] = useState(CAPTURE_COUNTDOWN);
  const [flash, setFlash] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(60);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [photoOk, setPhotoOk] = useState(true);

  const camera = useKioskCamera();
  const sessionIdRef = useRef<string>('');
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittedRef = useRef(false);

  const newSessionId = () =>
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : String(Date.now());

  useEffect(() => {
    sessionIdRef.current = newSessionId();
  }, []);

  // An unpaired screen must not take visitor traffic — see lib/kiosk-session.ts.
  const checkPairing = useCallback(async () => {
    try {
      const res = await fetch('/api/kiosk/pair', { cache: 'no-store' });
      setPaired(res.ok ? (await res.json()).paired : false);
    } catch {
      setPaired(false);
    }
  }, []);

  useEffect(() => {
    void checkPairing();
  }, [checkPairing]);

  const reset = useCallback(() => {
    camera.stop();
    setStep('welcome');
    setName('');
    setPurpose('GUEST');
    setWing(null);
    setFlat(null);
    setRequestId(null);
    setOutcome(null);
    setErrorText(null);
    setPhotoOk(true);
    setCountdown(CAPTURE_COUNTDOWN);
    setFlash(false);
    submittedRef.current = false;
    sessionIdRef.current = newSessionId();
  }, [camera]);

  // Idle reset: a half-finished selection must not sit on screen telling the
  // next visitor who the previous one was going to see.
  useEffect(() => {
    if (step === 'welcome' || step === 'waiting' || step === 'capturing') return;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(reset, IDLE_RESET_SECONDS * 1000);
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [step, name, wing, reset]);

  // Warm the camera as soon as the visitor reaches the flat list, so the
  // three-second budget is spent on the countdown rather than driver start-up.
  useEffect(() => {
    if (step === 'flat') void camera.warmUp();
  }, [step, camera]);

  const submit = useCallback(
    async (targetFlat: string, photoDataUrl: string | null) => {
      // Guards against a double submit if the countdown effect ever re-runs.
      if (submittedRef.current) return;
      submittedRef.current = true;

      try {
        const res = await fetch('/api/visitor-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            flatId: targetFlat,
            purpose,
            visitorName: name.trim() || undefined,
            gate: 'FRONT',
            kioskSessionId: sessionIdRef.current,
            photoDataUrl: photoDataUrl ?? undefined,
          }),
        });
        const data = await res.json();

        if (!res.ok) {
          setErrorText(data.error ?? 'Something went wrong. Please see the guard.');
          setOutcome('ERROR');
          setStep('result');
          return;
        }

        setPhotoOk(Boolean(data.photoCaptured));
        setRequestId(data.request.id);

        const remaining = Math.max(
          0,
          Math.round((new Date(data.request.expiresAt).getTime() - Date.now()) / 1000),
        );
        setSecondsLeft(remaining);
        setTotalSeconds(remaining || 60);
        setStep('waiting');
      } catch {
        setErrorText('Cannot reach the server. Please see the guard.');
        setOutcome('ERROR');
        setStep('result');
      } finally {
        camera.stop();
      }
    },
    [camera, name, purpose],
  );

  // Countdown → shutter → submit.
  useEffect(() => {
    if (step !== 'capturing' || !flat) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }

    setFlash(true);
    // A failed camera must never trap the visitor at the gate: submit anyway
    // and let the backend flag the missing photo for the guard.
    const photo = camera.capture();
    void submit(flat, photo);
  }, [step, countdown, flat, camera, submit]);

  // Poll for the resident's decision while the visitor waits.
  useEffect(() => {
    if (step !== 'waiting' || !requestId) return;
    let cancelled = false;

    const tick = async () => {
      try {
        const res = await fetch(`/api/visitor-requests/${requestId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { request } = await res.json();
        if (cancelled) return;

        setSecondsLeft(
          Math.max(0, Math.round((new Date(request.expiresAt).getTime() - Date.now()) / 1000)),
        );

        if (request.status !== 'PENDING') {
          setOutcome(
            request.status === 'APPROVED'
              ? 'APPROVED'
              : request.status === 'DENIED'
                ? 'DENIED'
                : 'EXPIRED',
          );
          setStep('result');
        }
      } catch {
        /* transient network blip — keep polling */
      }
    };

    void tick();
    const interval = setInterval(tick, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [step, requestId]);

  // Return to the welcome screen a few seconds after showing the outcome.
  useEffect(() => {
    if (step !== 'result') return;
    const timer = setTimeout(reset, 9000);
    return () => clearTimeout(timer);
  }, [step, reset]);

  if (paired === null) return <div className="h-full w-full bg-slate-950" />;
  if (!paired) return <PairScreen onPaired={() => setPaired(true)} />;

  return (
    <div className="relative h-full w-full text-white">
      {/* The preview lives outside the step tree so warming the camera survives
          the transition from the flat list into the capture screen. */}
      <video
        ref={camera.videoRef}
        muted
        playsInline
        className={
          step === 'capturing'
            ? 'absolute inset-0 h-full w-full scale-x-[-1] object-cover'
            : 'pointer-events-none absolute h-px w-px opacity-0'
        }
      />

      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <WelcomeStep key="welcome" onStart={() => setStep('details')} />
        )}

        {step === 'details' && (
          <DetailsStep
            key="details"
            name={name}
            onNameChange={setName}
            onBack={reset}
            onPick={(picked) => {
              setPurpose(picked);
              setStep('wing');
            }}
          />
        )}

        {step === 'wing' && (
          <WingStep
            key="wing"
            wings={wings()}
            onBack={() => setStep('details')}
            onPick={(picked) => {
              setWing(picked);
              setStep('flat');
            }}
          />
        )}

        {step === 'flat' && wing && (
          <FlatStep
            key="flat"
            wing={wing}
            onBack={() => {
              camera.stop();
              setStep('wing');
            }}
            onPick={(picked) => {
              setFlat(picked);
              setCountdown(CAPTURE_COUNTDOWN);
              submittedRef.current = false;
              setStep('capturing');
            }}
          />
        )}

        {step === 'capturing' && (
          <CaptureStep
            key="capturing"
            countdown={countdown}
            cameraState={camera.state}
            flash={flash}
          />
        )}

        {step === 'waiting' && flat && (
          <WaitingStep
            key="waiting"
            flat={flat}
            name={name.trim()}
            secondsLeft={secondsLeft}
            totalSeconds={totalSeconds}
            photoOk={photoOk}
          />
        )}

        {step === 'result' && (
          <ResultStep key="result" outcome={outcome} errorText={errorText} onDone={reset} />
        )}
      </AnimatePresence>
    </div>
  );
}
