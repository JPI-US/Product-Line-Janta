import { useEffect } from "react";

type DocumentMeta = {
  title: string;
  description?: string;
};

const DEFAULT_TITLE = "Janta Power — Three-Dimensional Solar";

function setMetaContent(selector: string, content: string) {
  const el = document.head.querySelector<HTMLMetaElement>(selector);
  if (el) el.setAttribute("content", content);
}

/**
 * Sets the document title (and, when provided, the description / OG / Twitter
 * text) for a route, restoring the site default on unmount. Keeps per-page
 * titles meaningful in the tab and in shared link previews.
 */
export function useDocumentMeta({ title, description }: DocumentMeta) {
  useEffect(() => {
    const fullTitle = title ? `${title} — Janta Power` : DEFAULT_TITLE;
    const previousTitle = document.title;
    document.title = fullTitle;

    setMetaContent('meta[property="og:title"]', fullTitle);
    setMetaContent('meta[name="twitter:title"]', fullTitle);

    if (description) {
      setMetaContent('meta[name="description"]', description);
      setMetaContent('meta[property="og:description"]', description);
      setMetaContent('meta[name="twitter:description"]', description);
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title, description]);
}
