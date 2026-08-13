'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * A doorbell that actually rings.
 *
 * Synthesised with the Web Audio API rather than shipping an mp3, because:
 *  - no asset to load, so it starts instantly even on a weak connection;
 *  - it loops indefinitely without gaps until the resident answers.
 *
 * Browser autoplay policy blocks audio until the user has interacted with the
 * page at least once. The resident app primes the context on first touch (see
 * primeAudio), so by the time a visitor arrives the ring is allowed to play.
 */

let sharedContext: AudioContext | null = null;

/** Call once from any user gesture so later rings are not blocked by autoplay policy. */
export function primeAudio() {
  if (typeof window === 'undefined') return;
  if (!sharedContext) {
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctor) return;
    sharedContext = new Ctor();
  }
  void sharedContext.resume();
}

export function useRingtone() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringingRef = useRef(false);

  const playChime = useCallback(() => {
    if (!sharedContext) return;
    const ctx = sharedContext;
    const now = ctx.currentTime;

    // Two-tone "ding-dong", the shape people already read as a doorbell.
    [
      { freq: 784, at: 0 }, // G5
      { freq: 622, at: 0.42 }, // D#5
    ].forEach(({ freq, at }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.0001, now + at);
      gain.gain.exponentialRampToValueAtTime(0.35, now + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.9);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now + at);
      osc.stop(now + at + 1.0);
    });
  }, []);

  const start = useCallback(() => {
    if (ringingRef.current) return;
    primeAudio();
    ringingRef.current = true;

    playChime();
    // Vibrate in the same rhythm. Android honours this; iOS Safari ignores it.
    navigator.vibrate?.([400, 200, 400, 800]);

    intervalRef.current = setInterval(() => {
      playChime();
      navigator.vibrate?.([400, 200, 400, 800]);
    }, 2000);
  }, [playChime]);

  const stop = useCallback(() => {
    ringingRef.current = false;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    navigator.vibrate?.(0);
  }, []);

  useEffect(() => stop, [stop]);

  return { start, stop };
}
