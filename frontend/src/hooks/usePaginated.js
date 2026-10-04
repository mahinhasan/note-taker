import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

export const PAGE_SIZE = 10;

export default function usePaginated(url, params = {}) {
  const paramsKey = JSON.stringify(params);
  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const fetchPage = useCallback(
    async (after) => {
      const id = ++requestId.current;
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(url, { ...JSON.parse(paramsKey), limit: PAGE_SIZE, after });
        if (id !== requestId.current) return;
        setItems((prev) => (after ? [...prev, ...res.data] : res.data));
        setNextCursor(res.nextCursor ?? null);
      } catch (err) {
        if (id === requestId.current) setError(err.message);
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [url, paramsKey]
  );

  const reset = useCallback(() => {
    setItems([]);
    setNextCursor(null);
    fetchPage(undefined);
  }, [fetchPage]);

  useEffect(() => {
    reset();
  }, [reset]);

  const loadMore = useCallback(() => {
    if (nextCursor && !loading) fetchPage(nextCursor);
  }, [fetchPage, nextCursor, loading]);

  return { items, setItems, nextCursor, loading, error, loadMore, reset };
}
