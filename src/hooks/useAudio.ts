import { useCallback, useEffect, useRef, useState } from 'react';
import type { LoadedTrack } from '../types';

export interface UseAudio {
  /** Track id currently playing, or null when nothing is. */
  playingId: number | null;
  /** Playback progress in [0, 1]. Resets to 0 on stop/start. */
  playProgress: number;
  /** Play `id` if a different track is playing or none is; pause if it's the
   *  one currently playing. Looks up the previewUrl from `tracks`. */
  togglePlay: (id: number) => void;
  /** Pause + tear down the current audio element. Safe to call when nothing
   *  is playing. */
  stopAudio: () => void;
}

/** Manages a single HTMLAudioElement and the visible playback state for a
 *  Tile/Grid. One element is reused across plays — recreating per-press was
 *  causing the cubeb-aaudio sink-recreate race on Firefox Android
 *  (NS_ERROR_DOM_MEDIA_MEDIASINK_ERR), and fresh elements bypass any
 *  cached `blobUrl` on the track. */
export function useAudio(tracks: LoadedTrack[]): UseAudio {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [playProgress, setPlayProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedSrcRef = useRef<string | null>(null);

  const ensureAudio = useCallback((): HTMLAudioElement => {
    let audio = audioRef.current;
    if (audio) return audio;
    audio = new Audio();
    audio.addEventListener('ended', () => {
      setPlayingId(null);
      setPlayProgress(0);
    });
    audio.addEventListener('timeupdate', () => {
      const a = audioRef.current;
      if (!a) return;
      const dur = a.duration || 30;
      setPlayProgress(a.currentTime / dur);
    });
    audioRef.current = audio;
    return audio;
  }, []);

  const stopAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.pause();
    setPlayingId(null);
    setPlayProgress(0);
  }, []);

  const togglePlay = useCallback(
    (id: number) => {
      const track = tracks.find((t) => t.id === id);
      if (!track) return;

      const audio = ensureAudio();
      const isThisPlaying = playingId === id && !audio.paused && !audio.ended;
      if (isThisPlaying) {
        stopAudio();
        return;
      }

      const src = track.blobUrl ?? track.previewUrl;
      if (loadedSrcRef.current !== src) {
        audio.src = src;
        loadedSrcRef.current = src;
      } else {
        // Replaying the same track: rewind. Safe before metadata loads —
        // the seek queues until the source is ready.
        audio.currentTime = 0;
      }
      setPlayingId(id);
      setPlayProgress(0);

      audio.play().catch((err: unknown) => {
        // AbortError fires when a rapid retoggle supersedes this play —
        // benign, the next play's state is already correct.
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.warn('Audio play failed:', err);
        setPlayingId((cur) => (cur === id ? null : cur));
        setPlayProgress((cur) => (cur === 0 ? cur : 0));
      });
    },
    [tracks, playingId, ensureAudio, stopAudio],
  );

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = null;
      loadedSrcRef.current = null;
    };
  }, []);

  return { playingId, playProgress, togglePlay, stopAudio };
}
