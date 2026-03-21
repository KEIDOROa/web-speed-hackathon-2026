import { startTransition, useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_PAGE_SIZE = 30;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  hasMore: boolean;
  fetchMore: () => void;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
  options?: { pageSize?: number },
): ReturnValues<T> {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const internalRef = useRef({ isLoading: false, offset: 0, hasMore: true });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: Boolean(apiPath),
    hasMore: true,
  });

  const fetchMore = useCallback(() => {
    if (!apiPath) {
      return;
    }

    const { isLoading, offset, hasMore } = internalRef.current;
    if (isLoading || !hasMore) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: true,
      offset,
      hasMore,
    };

    const separator = apiPath.includes("?") ? "&" : "?";
    const paginatedPath = `${apiPath}${separator}limit=${pageSize}&offset=${offset}`;

    void fetcher(paginatedPath).then(
      (pageData) => {
        const received = pageData.length;
        const nextHasMore = received === pageSize;
        const nextOffset = offset + received;
        const applySuccess = () => {
          setResult((cur) => ({
            ...cur,
            data: [...cur.data, ...pageData],
            isLoading: false,
            hasMore: nextHasMore,
          }));
          internalRef.current = {
            isLoading: false,
            offset: nextOffset,
            hasMore: nextHasMore,
          };
        };
        if (offset === 0) {
          applySuccess();
        } else {
          startTransition(applySuccess);
        }
      },
      (error) => {
        startTransition(() => {
          setResult((cur) => ({
            ...cur,
            error,
            isLoading: false,
          }));
          internalRef.current = {
            isLoading: false,
            offset,
            hasMore,
          };
        });
      },
    );
  }, [apiPath, fetcher, pageSize]);

  useEffect(() => {
    internalRef.current = {
      isLoading: false,
      offset: 0,
      hasMore: true,
    };

    if (!apiPath) {
      setResult({
        data: [],
        error: null,
        isLoading: false,
        hasMore: false,
      });
      return;
    }

    setResult({
      data: [],
      error: null,
      isLoading: true,
      hasMore: true,
    });

    fetchMore();
  }, [apiPath, fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
