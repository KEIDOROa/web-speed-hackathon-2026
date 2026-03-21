import { useCallback, useEffect, useRef, useState } from "react";
import { GifReader } from "omggif";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";

interface Props {
  src: string;
  srcSet?: string;
  sizes?: string;
  priority?: boolean;
}

interface DecodedFrame {
  imageData: ImageData;
  delay: number; // ms
}

function decodeGifFrames(buffer: ArrayBuffer): { width: number; height: number; frames: DecodedFrame[] } {
  const reader = new GifReader(new Uint8Array(buffer) as Buffer);
  const width = reader.width;
  const height = reader.height;
  const frames: DecodedFrame[] = [];

  // フルフレームを合成するための canvas
  const compCanvas = document.createElement("canvas");
  compCanvas.width = width;
  compCanvas.height = height;
  const compCtx = compCanvas.getContext("2d")!;

  for (let i = 0; i < reader.numFrames(); i++) {
    const info = reader.frameInfo(i);
    const pixels = new Uint8ClampedArray(width * height * 4);
    reader.decodeAndBlitFrameRGBA(i, pixels);

    // フレームのピクセルを合成用 canvas に描画
    const frameImageData = new ImageData(pixels, width, height);
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = width;
    tmpCanvas.height = height;
    const tmpCtx = tmpCanvas.getContext("2d")!;
    tmpCtx.putImageData(frameImageData, 0, 0);

    // disposal=2 の前フレームなら背景クリア済みなので、そのまま上書き
    compCtx.drawImage(tmpCanvas, 0, 0);

    // 合成結果をスナップショットとして保存
    const composited = compCtx.getImageData(0, 0, width, height);
    frames.push({
      imageData: composited,
      delay: Math.max(info.delay * 10, 20), // delay は 1/100秒単位、最低20ms
    });

    // disposal 処理
    if (info.disposal === 2) {
      compCtx.clearRect(info.x, info.y, info.width, info.height);
    }
  }

  return { width, height, frames };
}

export const PausableMovie = ({ src, srcSet: _srcSet, sizes: _sizes, priority: _priority }: Props) => {
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

  useEffect(() => {
    let cancelled = false;

    const renderFrame = () => {
      const state = animStateRef.current;
      const canvas = canvasRef.current;
      if (!state || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.putImageData(state.frames[state.frameIndex]!.imageData, 0, 0);

      if (state.playing) {
        const delay = state.frames[state.frameIndex]!.delay;
        state.frameIndex = (state.frameIndex + 1) % state.frames.length;
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

        const { width, height, frames } = decodeGifFrames(buffer);
        if (cancelled || frames.length === 0) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = width;
        canvas.height = height;

        animStateRef.current = {
          frames,
          frameIndex: 0,
          playing: true,
          timerId: null,
          width,
          height,
        };

        setIsLoaded(true);
        renderFrame();
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
  }, [src]);

  const handleToggle = useCallback(() => {
    const state = animStateRef.current;
    const canvas = canvasRef.current;
    if (!state || !canvas) return;

    if (state.playing) {
      // 停止: タイマーを止める。canvas には現在のフレームが表示されたまま
      state.playing = false;
      if (state.timerId != null) {
        clearTimeout(state.timerId);
        state.timerId = null;
      }
      setIsPlaying(false);
    } else {
      // 再生: 現在のフレームから続行
      state.playing = true;
      const delay = state.frames[state.frameIndex]!.delay;
      state.frameIndex = (state.frameIndex + 1) % state.frames.length;
      const renderFrame = () => {
        const s = animStateRef.current;
        const c = canvasRef.current;
        if (!s || !c || !s.playing) return;

        const ctx = c.getContext("2d");
        if (!ctx) return;

        ctx.putImageData(s.frames[s.frameIndex]!.imageData, 0, 0);
        const d = s.frames[s.frameIndex]!.delay;
        s.frameIndex = (s.frameIndex + 1) % s.frames.length;
        s.timerId = setTimeout(renderFrame, d);
      };
      state.timerId = setTimeout(renderFrame, delay);
      setIsPlaying(true);
    }
  }, []);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <div className="group relative block h-full w-full">
        <canvas
          ref={canvasRef}
          className="block h-full w-full object-cover"
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
