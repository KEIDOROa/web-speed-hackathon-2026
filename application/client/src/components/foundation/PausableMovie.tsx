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
 * img は常に表示・再生し続け、一時停止時は canvas を上に重ねて静止表示します。
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
      // 一時停止: createImageBitmap で現在表示中のフレームを確実にキャプチャ
      void createImageBitmap(img).then((bitmap) => {
        const c = canvasRef.current;
        if (!c) { bitmap.close(); return; }
        c.width = bitmap.width;
        c.height = bitmap.height;
        const ctx = c.getContext("2d");
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0);
        }
        bitmap.close();
        setIsPlaying(false);
      });
      return;
    } else {
      // 再生: canvas を非表示にするだけ（img は裏で再生し続けている）
      setIsPlaying(true);
    }
  }, [isPlaying]);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <div className="group relative block h-full w-full">
        {/* img は常に表示。GIFアニメーションが途切れないようにする */}
        <img
          ref={imgRef}
          className="block h-full w-full object-cover"
          onLoad={() => setIsLoaded(true)}
          alt=""
        />
        {/* 一時停止時のみ canvas を上に重ねて静止フレームを表示 */}
        {!isPlaying && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 block h-full w-full object-cover"
          />
        )}
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
