import { useEffect, useState } from 'react';

type Orientation = 'portrait' | 'landscape';

const ORIENTATION_QUERY = '(orientation: landscape)';
// Matches the --bp-tablet token in styles.css. Kept in JS so the chrome
// regions can render only the active variant (desktop vs mobile),
// avoiding duplicate data-testid hits. The pointer:coarse clause keeps
// desktop browsers on the desktop layout no matter how narrow the
// window — only actual touch devices enter the mobile chrome.
const MOBILE_QUERY = '(max-width: 1023.98px) and (pointer: coarse)';

const readOrientation = (): Orientation => {
  if (typeof window === 'undefined') return 'portrait';
  return window.matchMedia(ORIENTATION_QUERY).matches ? 'landscape' : 'portrait';
};

const readIsMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MOBILE_QUERY).matches;
};

/** Tracks viewport orientation via a single matchMedia listener at the app
 *  shell. Chrome components take orientation as a prop (per PoC handoff) so
 *  no media-query hook needs to live inside each one. */
export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(readOrientation);
  useEffect(() => {
    const mql = window.matchMedia(ORIENTATION_QUERY);
    const handler = () => setOrientation(mql.matches ? 'landscape' : 'portrait');
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return orientation;
}

/** True when the viewport is below the desktop breakpoint (< 1024px). */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(readIsMobile);
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    const handler = () => setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);
  return isMobile;
}
