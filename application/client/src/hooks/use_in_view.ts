import { useCallback, useEffect, useState } from "react";

interface Options {
  rootMargin?: string;
  once?: boolean;
}

export function useInView<T extends HTMLElement = HTMLElement>(options: Options = {}) {
  const { rootMargin = "0px", once = true } = options;
  const [node, setNode] = useState<T | null>(null);
  const [inView, setInView] = useState(false);

  const ref = useCallback((el: T | null) => {
    setNode(el);
  }, []);

  useEffect(() => {
    if (!node) {
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) {
          setInView(true);
          if (once) {
            obs.disconnect();
          }
        } else if (!once) {
          setInView(false);
        }
      },
      { root: null, rootMargin, threshold: 0.01 },
    );

    obs.observe(node);
    return () => obs.disconnect();
  }, [node, rootMargin, once]);

  return { ref, inView };
}
