import { useEffect, useRef, useState } from "react";

const defaultRootMargin = "240px 0px";

export type UseInViewOnceOptions = {
  rootMargin?: string;
  /** true のとき最初から可視扱い（LCP・詳細ページなど） */
  immediate?: boolean;
};

/**
 * 要素がビューポート付近に入ったら一度だけ true になる（GIF・音声など重い取得の遅延用）
 */
export function useInViewOnce<T extends Element>(options?: UseInViewOnceOptions) {
  const rootMargin = options?.rootMargin ?? defaultRootMargin;
  const immediate = options?.immediate ?? false;
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(immediate);

  useEffect(() => {
    if (visible) {
      return;
    }

    let cancelled = false;
    let raf = 0;
    let observer: IntersectionObserver | null = null;

    const attach = () => {
      if (cancelled) {
        return;
      }
      const el = ref.current;
      if (el === null) {
        raf = requestAnimationFrame(attach);
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setVisible(true);
              observer?.disconnect();
              return;
            }
          }
        },
        { root: null, rootMargin, threshold: 0 },
      );
      observer.observe(el);
    };

    attach();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [visible, rootMargin]);

  return { ref, visible };
}
