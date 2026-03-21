import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";

interface Props {
  src: string;
  srcSet?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * GIF動画を <img> で表示し、クリックで一時停止・再生を切り替えます。
 * 一時停止時は現在のフレームを canvas にキャプチャして静止表示します。
 * サーバーが Accept ヘッダーに応じて WebP を返す場合があるため、
 * GIF を確実に取得するために blob URL 経由で表示します。
 */
export const PausableMovie = ({ src, srcSet: _srcSet, sizes: _sizes, priority: _priority }: Props) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobUrlRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(src, {
          credentials: "same-origin",
          headers: { Accept: "image/gif" },
        });
        if (!res.ok) return;
        const blob = await res.blob();
        if (cancelled) return;

        const blobUrl = URL.createObjectURL(blob);
        blobUrlRef.current = blobUrl;

        const img = imgRef.current;
        if (img) {
          img.src = blobUrl;
        }
      } catch {
        /* fetch 失敗時は何もしない */
      }
    })();

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [src]);

  const handleToggle = useCallback(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    if (isPlaying) {
      // 一時停止: 現在のフレームを canvas にキャプチャ
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
      }
      setIsPlaying(false);
    } else {
      // 再生: visibility切り替えのみ（imgはバックグラウンドで再生し続けている）
      setIsPlaying(true);
    }
  }, [isPlaying]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <div className="group relative block h-full w-full">
        <img
          ref={imgRef}
          className={[
            "block h-full w-full object-cover",
            isPlaying ? "visible" : "invisible",
          ].join(" ")}
          onLoad={() => setIsLoaded(true)}
          alt=""
        />
        <canvas
          ref={canvasRef}
          className={[
            "absolute inset-0 block h-full w-full object-cover",
            isPlaying ? "invisible" : "visible",
          ].join(" ")}
        />
        <button
          aria-label={isPlaying ? "一時停止" : "再生"}
          className="absolute inset-0 z-10 block h-full w-full cursor-pointer border-0 bg-transparent p-0"
          type="button"
          onClick={handleToggle}
        />
        {isLoaded && (
          <span
            className="pointer-events-none absolute bottom-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white shadow-lg transition-opacity opacity-0 group-hover:opacity-100"
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <rect x="6" y="5" width="4" height="14" rx="1" />
                <rect x="14" y="5" width="4" height="14" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28a1 1 0 0 0-1.5.86z" />
              </svg>
            )}
          </span>
        )}
      </div>
    </AspectRatioBox>
  );
};
