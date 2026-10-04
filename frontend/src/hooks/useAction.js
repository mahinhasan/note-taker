import { useCallback, useState } from 'react';

export default function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (fn) => {
    setBusy(true);
    setError(null);
    try {
      return { ok: true, result: await fn() };
    } catch (err) {
      setError(err.message);
      return { ok: false, error: err };
    } finally {
      setBusy(false);
    }
  }, []);

  return { run, busy, error, setError };
}
