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

/**
 * アニメ GIF を canvas に描画し、クリックで一時停止・再生を切り替えます。
 * サーバーが Accept: image/webp で WebP を返すため、gif デコード用に Accept: image/gif で取得します。
 */
export const PausableMovie = ({ src, srcSet: _srcSet, sizes: _sizes, priority: _priority }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animatorRef = useRef<GifAnimator | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    const canvas = canvasRef.current;
    if (canvas === null) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch(src, { headers: { Accept: "image/gif" } });
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
      } catch {
        /* 読み込み失敗時は空の canvas のまま */
      }
    })();

    return () => {
      cancelled = true;
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
