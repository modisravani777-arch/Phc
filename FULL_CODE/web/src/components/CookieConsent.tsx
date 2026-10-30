import { useEffect, useRef, useState, type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';

type ConsentChoice = 'accepted' | 'rejected' | 'unknown';

const CONSENT_STORAGE_KEY = 'arogyasathi-analytics-consent';
const ANALYTICS_PATHS = new Set(['/', '/privacy', '/terms']);
const ANALYTICS_DOMAIN =
  import.meta.env.VITE_PLAUSIBLE_DOMAIN?.trim() ||
  (import.meta.env.VITE_PUBLIC_SITE_URL
    ? new URL(import.meta.env.VITE_PUBLIC_SITE_URL).hostname
    : '');
export const isAnalyticsConfigured = Boolean(ANALYTICS_DOMAIN);
const ANALYTICS_ENDPOINT =
  import.meta.env.VITE_PLAUSIBLE_API_URL?.trim() || 'https://plausible.io/api/event';

export const openCookiePreferences = () => {
  window.dispatchEvent(new Event('arogyasathi:open-cookie-preferences'));
};

export const CookieConsent: FC = () => {
  const { pathname } = useLocation();
  const [choice, setChoice] = useState<ConsentChoice>('unknown');
  const [isOpen, setIsOpen] = useState(false);
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!ANALYTICS_DOMAIN) return;
    try {
      const savedChoice = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (savedChoice === 'accepted' || savedChoice === 'rejected') {
        setChoice(savedChoice);
      } else {
        setIsOpen(true);
      }
    } catch (error: unknown) {
      console.warn('Unable to read analytics consent preferences.', error);
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    const openPreferences = () => setIsOpen(true);
    window.addEventListener('arogyasathi:open-cookie-preferences', openPreferences);
    return () => window.removeEventListener('arogyasathi:open-cookie-preferences', openPreferences);
  }, []);

  useEffect(() => {
    if (
      choice !== 'accepted' ||
      !ANALYTICS_DOMAIN ||
      !ANALYTICS_PATHS.has(pathname) ||
      navigator.doNotTrack === '1' ||
      lastTrackedPath.current === pathname
    ) {
      return;
    }

    lastTrackedPath.current = pathname;
    const payload = JSON.stringify({
      name: 'pageview',
      domain: ANALYTICS_DOMAIN,
      url: new URL(pathname, window.location.origin).href,
      referrer: document.referrer ? new URL(document.referrer).origin : '',
    });
    const beaconSent = navigator.sendBeacon(
      ANALYTICS_ENDPOINT,
      new Blob([payload], { type: 'application/json' }),
    );
    if (!beaconSent) {
      void fetch(ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        mode: 'cors',
        keepalive: true,
      }).catch((error: unknown) => {
        console.warn('Unable to send an anonymous public-page analytics event.', error);
      });
    }
  }, [choice, pathname]);

  const saveChoice = (nextChoice: Exclude<ConsentChoice, 'unknown'>) => {
    setChoice(nextChoice);
    setIsOpen(false);
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, nextChoice);
    } catch (error: unknown) {
      console.warn('Unable to save analytics consent preferences.', error);
    }
  };

  if (!ANALYTICS_DOMAIN || !isOpen || !ANALYTICS_PATHS.has(pathname)) return null;

  return (
    <aside
      aria-label="Optional analytics preferences"
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-slate-200 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur md:inset-x-auto md:bottom-5 md:left-5 md:max-w-xl md:rounded-2xl md:border"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-slate-700">
          Optional, anonymous page-view analytics help improve the public site. Analytics are only
          sent after you opt in, only on public pages, and never include clinical records.{' '}
          <Link to="/privacy" className="font-semibold text-teal-700 underline">
            Privacy notice
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => saveChoice('rejected')}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => saveChoice('accepted')}
            className="rounded-xl bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Allow analytics
          </button>
        </div>
      </div>
    </aside>
  );
};
