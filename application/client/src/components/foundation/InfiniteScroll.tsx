import { ReactNode, useEffect, useRef } from "react";

interface Props {
  children: ReactNode;
  items: unknown[];
  fetchMore: () => void;
  hasMore?: boolean;
}

export const InfiniteScroll = ({ children, fetchMore, hasMore = true, items }: Props) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchMoreRef = useRef(fetchMore);
  fetchMoreRef.current = fetchMore;

  useEffect(() => {
    if (!hasMore) {
      return;
    }
    const el = sentinelRef.current;
    if (el == null) {
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          fetchMoreRef.current();
        }
      },
      { root: null, rootMargin: "320px 0px", threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, items.length]);

  return (
    <>
      {children}
      {hasMore ? <div ref={sentinelRef} aria-hidden className="h-px w-full shrink-0" /> : null}
    </>
  );
};
