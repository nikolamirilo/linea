import { useState, useEffect } from 'react';
import { view } from '@forge/bridge';

export function useForgeContext() {
  const [context, setContext] = useState({
    pageId: null,
    macroId: null,
    selectedText: '',
    title: '',
    spaceKey: '',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const ctx = await view.getContext();
        const ext = ctx?.extension || {};
        if (cancelled) return;
        setContext({
          pageId: ext?.content?.id || ctx?.contentId || null,
          macroId: ext?.localId || ctx?.localId || null,
          selectedText:
            ext.selectedText ||
            ext.contentAction?.selectedText ||
            ext.content?.selectedText ||
            '',
          title: ext.content?.title || ctx?.content?.title || '',
          spaceKey: ext.space?.key || ctx?.space?.key || '',
        });
      } catch (err) {
        if (!cancelled) setError(err?.message || String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { context, loading, error };
}
