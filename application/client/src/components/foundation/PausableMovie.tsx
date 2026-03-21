import { useCallback, useEffect, useRef, useState } from "react";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";

interface Props {
  src: string;
  priority?: boolean;
  posterSrc?: string;
}

export const PausableMovie = ({ src, priority = false, posterSrc }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const v = videoRef.current;
    if (v == null) {
      return;
    }
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    void v.play().catch(() => {});
  }, [src]);

  const handleToggle = useCallback(() => {
    const v = videoRef.current;
    if (v == null) {
      return;
    }
    if (v.paused) {
      void v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  }, []);

  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <div className="group relative block h-full w-full">
        <video
          ref={videoRef}
          aria-hidden
          autoPlay
          className="absolute inset-0 z-[1] h-full w-full object-cover"
          loop
          muted
          playsInline
          poster={posterSrc}
          preload={priority ? "auto" : "metadata"}
          src={src}
        />
        <button
          aria-label="動画プレイヤー"
          aria-pressed={isPlaying}
          className="absolute inset-0 z-10 block h-full w-full cursor-pointer border-0 bg-transparent p-0"
          type="button"
          onClick={handleToggle}
        />
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
      </div>
    </AspectRatioBox>
  );
};
