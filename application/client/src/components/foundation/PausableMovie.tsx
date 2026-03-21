import { useCallback, useEffect, useRef } from "react";
import gifler from "gifler";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";

type GifAnimator = Awaited<ReturnType<ReturnType<typeof gifler>["animate"]>>;

interface Props {
  src: string;
  srcSet?: string;
  sizes?: string;
  priority?: boolean;
}

function drawImageFallback(canvas: HTMLCanvasElement, imageUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 1;
      const h = img.naturalHeight || 1;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx === null) {
        reject(new Error("no 2d context"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve();
    };
    img.onerror = () => reject(new Error("image load failed"));
    img.src = imageUrl;
  });
}

/**
 * アニメ GIF を canvas に描画し、クリックで一時停止・再生を切り替えます。
 * サーバーが Accept: image/webp で WebP を返すため、gif デコード用に Accept: image/gif で取得します。
 */
export const PausableMovie = ({ src, srcSet: _srcSet, sizes: _sizes, priority: _priority }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatorRef = useRef<GifAnimator | null>(null);
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }

    const ensurePlaying = () => {
      const animator = animatorRef.current;
      if (animator === null || animator.running()) {
        return;
      }
      animator.start();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        ensurePlaying();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    void (async () => {
      try {
        const response = await fetch(src, {
          credentials: "same-origin",
          headers: { Accept: "image/gif" },
        });
        const buffer = await response.arrayBuffer();
        if (cancelled) {
          return;
        }
        objectUrl = URL.createObjectURL(new Blob([buffer], { type: "image/gif" }));
        const animator = await gifler(objectUrl).animate(canvas);
        if (cancelled) {
          animator.stop();
          return;
        }
        animatorRef.current = animator;
        if (!animator.running()) {
          animator.start();
        }
        intersectionObserverRef.current?.disconnect();
        const movieRoot = canvas.closest("[data-movie-area]");
        if (movieRoot !== null) {
          const io = new IntersectionObserver(
            (entries) => {
              for (const e of entries) {
                if (e.isIntersecting) {
                  ensurePlaying();
                }
              }
            },
            { root: null, rootMargin: "80px", threshold: 0 },
          );
          io.observe(movieRoot);
          intersectionObserverRef.current = io;
        }
        requestAnimationFrame(() => {
          ensurePlaying();
        });
      } catch {
        if (cancelled) return;
        try {
          await drawImageFallback(canvas, src);
        } catch {
          /* 読み込み失敗時は空の canvas のまま */
        }
      }
    })();

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      intersectionObserverRef.current?.disconnect();
      intersectionObserverRef.current = null;
      animatorRef.current?.stop();
      animatorRef.current = null;
      if (objectUrl !== null) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  const handleToggle = useCallback(() => {
    const animator = animatorRef.current;
    if (animator === null) {
      return;
    }
    if (animator.running()) {
      animator.stop();
    } else {
      animator.start();
    }
  }, []);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <div className="relative block h-full w-full">
        <button
          aria-label="動画の再生・一時停止"
          className="absolute inset-0 z-10 block h-full w-full cursor-pointer border-0 bg-transparent p-0"
          type="button"
          onClick={handleToggle}
        >
          <canvas
            ref={canvasRef}
            className="pointer-events-none block h-full w-full object-cover"
          />
        </button>
      </div>
    </AspectRatioBox>
  );
};
