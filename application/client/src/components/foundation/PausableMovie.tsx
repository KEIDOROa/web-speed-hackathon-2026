import { useCallback, useEffect, useRef, useState } from "react";
import { GifReader } from "omggif";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";

interface Props {
  src: string;
  srcSet?: string;
  sizes?: string;
  priority?: boolean;
  /** GIF 本体とは別 URL（1フレ目静止画）。指定時は LCP を軽量画像に寄せる */
  posterSrc?: string;
}

interface DecodedFrame {
  imageData: ImageData;
  delay: number;
}

function yieldToMain(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });
}

function waitForIdle(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => resolve(), { timeout: 2500 });
    } else {
      setTimeout(resolve, 0);
    }
  });
}

export const PausableMovie = ({
  src,
  srcSet: _srcSet,
  sizes: _sizes,
  priority = false,
  posterSrc,
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animStateRef = useRef<{
    frames: DecodedFrame[];
    frameIndex: number;
    playing: boolean;
    timerId: ReturnType<typeof setTimeout> | null;
    width: number;
    height: number;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [decodeGate, setDecodeGate] = useState(!priority);

  useEffect(() => {
    setDecodeGate(!priority);
  }, [src, priority]);

  useEffect(() => {
    if (!priority) {
      return;
    }
    const t = window.setTimeout(() => {
      setDecodeGate(true);
    }, 4000);
    return () => window.clearTimeout(t);
  }, [src, priority]);

  useEffect(() => {
    if (!decodeGate) {
      return;
    }
    let cancelled = false;

    const renderFrame = () => {
      const state = animStateRef.current;
      const canvas = canvasRef.current;
      if (!state || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const n = state.frames.length;
      if (n === 0) return;

      ctx.putImageData(state.frames[state.frameIndex % n]!.imageData, 0, 0);

      if (state.playing) {
        const delay = state.frames[state.frameIndex % n]!.delay;
        state.frameIndex = (state.frameIndex + 1) % n;
        state.timerId = setTimeout(renderFrame, delay);
      }
    };

    void (async () => {
      try {
        const res = await fetch(src, {
          credentials: "same-origin",
          headers: { Accept: "image/gif" },
        });
        if (!res.ok) return;
        const buffer = await res.arrayBuffer();
        if (cancelled) return;

        if (priority) {
          await yieldToMain();
          await yieldToMain();
          if (cancelled) return;
        } else {
          await waitForIdle();
          if (cancelled) return;
        }

        const reader = new GifReader(new Uint8Array(buffer) as Buffer);
        const width = reader.width;
        const height = reader.height;
        const numFrames = reader.numFrames();
        if (numFrames === 0) return;

        const yieldBeforeFirstFrame = !priority;

        const compCanvas = document.createElement("canvas");
        compCanvas.width = width;
        compCanvas.height = height;
        const compCtx = compCanvas.getContext("2d")!;

        const frames: DecodedFrame[] = [];

        for (let i = 0; i < numFrames; i++) {
          if (i > 0 || yieldBeforeFirstFrame) {
            await yieldToMain();
          }
          if (cancelled) return;

          const info = reader.frameInfo(i);
          const pixels = new Uint8ClampedArray(width * height * 4);
          reader.decodeAndBlitFrameRGBA(i, pixels);

          const frameImageData = new ImageData(pixels, width, height);
          const tmpCanvas = document.createElement("canvas");
          tmpCanvas.width = width;
          tmpCanvas.height = height;
          const tmpCtx = tmpCanvas.getContext("2d")!;
          tmpCtx.putImageData(frameImageData, 0, 0);

          compCtx.drawImage(tmpCanvas, 0, 0);

          const composited = compCtx.getImageData(0, 0, width, height);
          const frame: DecodedFrame = {
            imageData: composited,
            delay: Math.max(info.delay * 10, 20),
          };
          frames.push(frame);

          if (i === 0) {
            const canvas = canvasRef.current;
            if (!canvas || cancelled) return;
            canvas.width = width;
            canvas.height = height;

            animStateRef.current = {
              frames: [frame],
              frameIndex: 0,
              playing: true,
              timerId: null,
              width,
              height,
            };

            setIsLoaded(true);
            renderFrame();
          } else if (animStateRef.current) {
            animStateRef.current.frames.push(frame);
          }

          if (info.disposal === 2) {
            compCtx.clearRect(info.x, info.y, info.width, info.height);
          }
        }
      } catch {
        /* GIF デコード失敗時は何もしない */
      }
    })();

    return () => {
      cancelled = true;
      const state = animStateRef.current;
      if (state?.timerId != null) {
        clearTimeout(state.timerId);
      }
      animStateRef.current = null;
    };
  }, [src, priority, decodeGate]);

  const handleToggle = useCallback(() => {
    const state = animStateRef.current;
    const canvas = canvasRef.current;
    if (!state || !canvas) return;

    const n = state.frames.length;
    if (n === 0) return;

    if (state.playing) {
      state.playing = false;
      if (state.timerId != null) {
        clearTimeout(state.timerId);
        state.timerId = null;
      }
      setIsPlaying(false);
    } else {
      state.playing = true;
      const delay = state.frames[state.frameIndex % n]!.delay;
      state.frameIndex = (state.frameIndex + 1) % n;
      const renderFrame = () => {
        const s = animStateRef.current;
        const c = canvasRef.current;
        if (!s || !c || !s.playing) return;

        const ctx = c.getContext("2d");
        if (!ctx) return;

        const nf = s.frames.length;
        if (nf === 0) return;

        ctx.putImageData(s.frames[s.frameIndex % nf]!.imageData, 0, 0);
        const d = s.frames[s.frameIndex % nf]!.delay;
        s.frameIndex = (s.frameIndex + 1) % nf;
        s.timerId = setTimeout(renderFrame, d);
      };
      state.timerId = setTimeout(renderFrame, delay);
      setIsPlaying(true);
    }
  }, []);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <div className="group relative block h-full w-full">
        {!isLoaded ? (
          <img
            alt=""
            className="absolute inset-0 z-0 h-full w-full object-cover"
            decoding={priority ? "sync" : "async"}
            fetchPriority={priority ? "high" : "auto"}
            loading={priority ? "eager" : "lazy"}
            src={posterSrc ?? src}
            onError={() => setDecodeGate(true)}
            onLoad={() => {
              if (priority) {
                setDecodeGate(true);
              }
            }}
          />
        ) : null}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 z-[1] block h-full w-full object-cover ${isLoaded ? "opacity-100" : "opacity-0"}`}
        />
        <button
          aria-label="動画プレイヤー"
          aria-pressed={isPlaying}
          className="absolute inset-0 z-10 block h-full w-full cursor-pointer border-0 bg-transparent p-0"
          type="button"
          onClick={handleToggle}
        />
        {isLoaded && (
          <span className="pointer-events-none absolute right-3 bottom-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
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
