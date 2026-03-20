import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: any[];
  fetchMore: () => void;
}

export const InfiniteScroll = ({ children, fetchMore, items }: Props) => {
  const latestItemRef = useRef(items[items.length - 1]);
  latestItemRef.current = items[items.length - 1];

  const prevReachedRef = useRef(false);

  const checkScroll = useCallback(() => {
    const latestItem = latestItemRef.current;
    const hasReached = window.innerHeight + Math.ceil(window.scrollY) >= document.body.offsetHeight;

    if (!hasReached) {
      prevReachedRef.current = false;
      return;
    }

    if (!prevReachedRef.current && latestItem !== undefined) {
      fetchMore();
      prevReachedRef.current = true;
    }
  }, [fetchMore]);

  useLayoutEffect(() => {
    const hasReached = window.innerHeight + Math.ceil(window.scrollY) >= document.body.offsetHeight;
    if (hasReached) {
      prevReachedRef.current = false;
    }
    checkScroll();
  }, [items.length, checkScroll]);

  useEffect(() => {
    const handler = () => {
      checkScroll();
    };

    document.addEventListener("wheel", handler, { passive: true });
    document.addEventListener("touchmove", handler, { passive: true });
    window.addEventListener("resize", handler, { passive: true });
    document.addEventListener("scroll", handler, { passive: true });
    return () => {
      document.removeEventListener("wheel", handler);
      document.removeEventListener("touchmove", handler);
      window.removeEventListener("resize", handler);
      document.removeEventListener("scroll", handler);
    };
  }, [checkScroll]);

  return <>{children}</>;
};
