import { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';

export function useIssues(url) {
  const [issues, setIssues] = useState([]);
  const [loadingIssues, setLoadingIssues] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) return;
    let cancelled = false;
    (async () => {
      setLoadingIssues(true);
      setError(null);
      try {
        const res = await invoke('resolveFilterUrl', { url });
        if (cancelled) return;
        if (res?.error) {
          setError(res.error);
          setIssues([]);
        } else {
          setIssues(res?.issues || []);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || String(err));
      } finally {
        if (!cancelled) setLoadingIssues(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { issues, loadingIssues, error };
}
