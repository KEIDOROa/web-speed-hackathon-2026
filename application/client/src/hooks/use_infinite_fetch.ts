import { startTransition, useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_PAGE_SIZE = 30;

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
  options?: { pageSize?: number },
): ReturnValues<T> {
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const internalRef = useRef({ isLoading: false, offset: 0 });

  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: [],
    error: null,
    isLoading: Boolean(apiPath),
  });

  const fetchMore = useCallback(() => {
    if (!apiPath) {
      return;
    }

    const { isLoading, offset } = internalRef.current;
    if (isLoading) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: true,
      offset,
    };

    const separator = apiPath.includes("?") ? "&" : "?";
    const paginatedPath = `${apiPath}${separator}limit=${pageSize}&offset=${offset}`;

    void fetcher(paginatedPath).then(
      (pageData) => {
        const applySuccess = () => {
          setResult((cur) => ({
            ...cur,
            data: [...cur.data, ...pageData],
            isLoading: false,
          }));
          internalRef.current = {
            isLoading: false,
            offset: offset + pageSize,
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
          };
        });
      },
    );
  }, [apiPath, fetcher, pageSize]);

  useEffect(() => {
    internalRef.current = {
      isLoading: false,
      offset: 0,
    };

    if (!apiPath) {
      setResult({
        data: [],
        error: null,
        isLoading: false,
      });
      return;
    }

    setResult({
      data: [],
      error: null,
      isLoading: true,
    });

    fetchMore();
  }, [apiPath, fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
