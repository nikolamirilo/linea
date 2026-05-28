import { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';
const { DEFAULT_COLUMNS } = require('../constants/columns');

export function useMacroConfig(pageId, macroId) {
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [error, setError] = useState(null);
  const [savingUrl, setSavingUrl] = useState(null);
  const [savingColumns, setSavingColumns] = useState(false);

  useEffect(() => {
    if (!pageId && !macroId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await invoke('loadMacroConfig', { pageId, macroId });
        if (!cancelled) setConfig(res?.config || null);
      } catch (err) {
        if (!cancelled)
          setError('Failed to load config: ' + (err?.message || String(err)));
      } finally {
        if (!cancelled) setLoadingConfig(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageId, macroId]);

  const pickPreset = async (url) => {
    setSavingUrl(url);
    setError(null);
    try {
      const newConfig = { url, columns: DEFAULT_COLUMNS };
      const res = await invoke('saveMacroConfig', {
        pageId,
        macroId,
        config: newConfig,
      });
      if (res?.error) setError(res.error);
      else setConfig(newConfig);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setSavingUrl(null);
    }
  };

  const clearConfig = () => {
    setConfig(null);
    setError(null);
  };

  const toggleColumn = async (key) => {
    if (!config) return;
    const current = config.columns || DEFAULT_COLUMNS;
    const next = current.includes(key)
      ? current.filter((k) => k !== key)
      : [...current, key];
    if (next.length === 0) return;
    setSavingColumns(true);
    try {
      const newConfig = { ...config, columns: next };
      const res = await invoke('saveMacroConfig', {
        pageId,
        macroId,
        config: newConfig,
      });
      if (res?.error) setError(res.error);
      else setConfig(newConfig);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setSavingColumns(false);
    }
  };

  const refresh = () => {
    if (config) setConfig({ ...config });
  };

  return {
    config,
    setConfig,
    loadingConfig,
    error,
    setError,
    pickPreset,
    clearConfig,
    toggleColumn,
    refresh,
    savingUrl,
    savingColumns,
  };
}
