'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraState = 'idle' | 'warming' | 'ready' | 'denied' | 'unavailable';

/**
 * Kiosk camera.
 *
 * The requirement is a photo within 3 seconds of the visitor tapping their flat.
 * A cold getUserMedia call costs 300-800ms on tablet hardware, which would eat a
 * quarter of that budget, so the stream is warmed up as soon as the visitor
 * reaches the flat list. By the time they tap, the countdown is the only delay.
 *
 * Output is always JPEG, per the requirement that photos be openable anywhere.
 */
export const CAPTURE_WIDTH = 640;
export const CAPTURE_HEIGHT = 480;
export const JPEG_QUALITY = 0.82;

export function useKioskCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>('idle');

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setState('idle');
  }, []);

  const warmUp = useCallback(async () => {
    if (streamRef.current) return;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      // Almost always the cause: the page is not on HTTPS or localhost.
      setState('unavailable');
      return;
    }
    setState('warming');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: CAPTURE_WIDTH },
          height: { ideal: CAPTURE_HEIGHT },
          facingMode: 'user',
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setState('ready');
    } catch (err) {
      const name = (err as DOMException)?.name;
      setState(name === 'NotAllowedError' ? 'denied' : 'unavailable');
    }
  }, []);

  /** Returns a data:image/jpeg;base64 URL, or null if the frame was not usable. */
  const capture = useCallback((): string | null => {
    const video = videoRef.current;
    if (!video || video.readyState < 2 /* HAVE_CURRENT_DATA */) return null;

    const canvas = document.createElement('canvas');
    canvas.width = CAPTURE_WIDTH;
    canvas.height = CAPTURE_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, CAPTURE_WIDTH, CAPTURE_HEIGHT);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  }, []);

  useEffect(() => stop, [stop]);

  return { videoRef, state, warmUp, capture, stop };
}
