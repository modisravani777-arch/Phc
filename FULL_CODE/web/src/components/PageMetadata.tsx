import { useEffect, type FC } from 'react';
import { useLocation } from 'react-router-dom';

interface PageMeta {
  title: string;
  description: string;
  public?: boolean;
  indexable?: boolean;
}

const pageMetadata: Record<string, PageMeta> = {
  '/': {
    title: 'ArogyaSathi | Primary Healthcare Coordination',
    description:
      'ArogyaSathi helps primary health centres and sub-centres coordinate frontline care, family records, schedules, and reports.',
    public: true,
  },
  '/login': {
    title: 'Facility Sign In | ArogyaSathi',
    description: 'Secure sign-in for authorized primary health centre and sub-centre teams.',
  },
  '/privacy': {
    title: 'Privacy Notice | ArogyaSathi',
    description:
      'Read the draft privacy notice for the ArogyaSathi primary healthcare coordination application.',
    public: true,
    indexable: false,
  },
  '/terms': {
    title: 'Terms of Use | ArogyaSathi',
    description: 'Read the draft terms of use for authorized ArogyaSathi facility teams.',
    public: true,
    indexable: false,
  },
  '/demo': {
    title: 'Interactive Demo | ArogyaSathi',
    description: 'Interactive visual demo for ArogyaSathi.',
  },
  '/fractal': {
    title: 'Interactive Demo | ArogyaSathi',
    description: 'Interactive visual demo for ArogyaSathi.',
  },
  '/app/dashboard': {
    title: 'Overview | ArogyaSathi',
    description: 'Facility overview and care coordination metrics.',
  },
  '/app/registers': {
    title: 'Clinical Registers | ArogyaSathi',
    description: 'Clinical register management for authorized facility teams.',
  },
  '/app/inventory': {
    title: 'Inventory & Supplies | ArogyaSathi',
    description: 'Medical inventory management for authorized facility teams.',
  },
  '/app/villages': {
    title: 'Village Catchment | ArogyaSathi',
    description: 'Village and catchment management for authorized facility teams.',
  },
  '/app/staff': {
    title: 'Staff Directory | ArogyaSathi',
    description: 'Facility staff directory for authorized facility teams.',
  },
  '/app/reports': {
    title: 'Reports & Returns | ArogyaSathi',
    description: 'Facility reports and returns for authorized facility teams.',
  },
  '/app/calendar': {
    title: 'Schedule Calendar | ArogyaSathi',
    description: 'Facility schedules and appointments for authorized facility teams.',
  },
  '/app/affiliations': {
    title: 'Facility Affiliations | ArogyaSathi',
    description: 'Manage PHC and sub-centre affiliations.',
  },
  '/app/notifications': {
    title: 'Notifications | ArogyaSathi',
    description: 'Facility notifications for authorized facility teams.',
  },
  '/app/settings': {
    title: 'Facility Profile | ArogyaSathi',
    description: 'Facility profile settings for authorized facility teams.',
  },
};

function setMeta(attribute: 'name' | 'property', key: string, content: string | null) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!content) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

export const PageMetadata: FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const meta = pageMetadata[pathname] || {
      title: 'Page Not Found | ArogyaSathi',
      description: 'The requested ArogyaSathi page could not be found.',
    };
    const isPublic = Boolean(meta.public);
    const isIndexable = isPublic && meta.indexable !== false;
    document.title = meta.title;
    setMeta('name', 'description', meta.description);
    setMeta('name', 'robots', isIndexable ? 'index,follow' : 'noindex,nofollow');
    setMeta('property', 'og:title', isPublic ? meta.title : null);
    setMeta('property', 'og:description', isPublic ? meta.description : null);
    setMeta('property', 'og:type', isPublic ? 'website' : null);
    setMeta(
      'property',
      'og:image',
      isPublic ? new URL('/og-image.jpg', window.location.origin).href : null,
    );
    setMeta('property', 'og:image:alt', isPublic ? 'ArogyaSathi healthcare coordination' : null);
    setMeta('name', 'twitter:card', isPublic ? 'summary_large_image' : null);
    setMeta('name', 'twitter:title', isPublic ? meta.title : null);
    setMeta('name', 'twitter:description', isPublic ? meta.description : null);

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.remove();
    if (isIndexable && import.meta.env.VITE_PUBLIC_SITE_URL) {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = new URL(pathname, import.meta.env.VITE_PUBLIC_SITE_URL).href;
      document.head.append(link);
      setMeta(
        'name',
        'twitter:image',
        new URL('/og-image.jpg', import.meta.env.VITE_PUBLIC_SITE_URL).href,
      );
      setMeta('property', 'og:url', new URL(pathname, import.meta.env.VITE_PUBLIC_SITE_URL).href);
    } else {
      setMeta('name', 'twitter:image', null);
      setMeta('property', 'og:url', null);
    }
  }, [pathname]);

  return null;
};
