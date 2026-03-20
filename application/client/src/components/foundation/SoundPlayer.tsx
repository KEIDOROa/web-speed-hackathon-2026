import { ReactEventHandler, useCallback, useEffect, useRef, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { SoundWaveSVG } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundWaveSVG";
import { useInViewOnce } from "@web-speed-hackathon-2026/client/src/hooks/use_in_view_once";
import { getSoundPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  sound: Models.Sound;
  /** タイムラインでは遅延、投稿詳細などでは true */
  loadWaveformImmediately?: boolean;
}

async function fetchSoundBinary(url: string): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, { method: "GET", signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.arrayBuffer();
  } finally {
    clearTimeout(timer);
  }
}

export const SoundPlayer = ({ sound, loadWaveformImmediately = false }: Props) => {
  const { ref: rootRef, visible: shouldLoadWaveform } = useInViewOnce<HTMLDivElement>({
    immediate: loadWaveformImmediately,
  });
  const soundUrl = getSoundPath(sound.id);

  const [soundData, setSoundData] = useState<ArrayBuffer | null>(null);
  useEffect(() => {
    if (!shouldLoadWaveform) {
      return;
    }
    let cancelled = false;
    setSoundData(null);
    void fetchSoundBinary(soundUrl)
      .then((buf) => {
        if (!cancelled) setSoundData(buf);
      })
      .catch(() => {
        if (!cancelled) setSoundData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [soundUrl, shouldLoadWaveform]);

  const [currentTimeRatio, setCurrentTimeRatio] = useState(0);
  const handleTimeUpdate = useCallback<ReactEventHandler<HTMLAudioElement>>((ev) => {
    const el = ev.currentTarget;
    const d = el.duration;
    setCurrentTimeRatio(Number.isFinite(d) && d > 0 ? el.currentTime / d : 0);
  }, []);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const handleTogglePlaying = useCallback(() => {
    setIsPlaying((isPlaying) => {
      if (isPlaying) {
        audioRef.current?.pause();
      } else {
        audioRef.current?.play();
      }
      return !isPlaying;
    });
  }, []);

  return (
    <div
      ref={rootRef}
      className="bg-cax-surface-subtle flex min-h-[4.5rem] w-full items-center justify-center gap-1 sm:min-h-0 sm:h-full"
    >
      <audio ref={audioRef} loop={true} onTimeUpdate={handleTimeUpdate} src={soundUrl} preload="none" />
      <div className="p-2">
        <button
          aria-label={isPlaying ? "音声を一時停止" : "音声を再生"}
          className="bg-cax-accent text-cax-surface-raised flex h-8 w-8 items-center justify-center rounded-full text-sm hover:opacity-75"
          onClick={handleTogglePlaying}
          type="button"
        >
          <FontAwesomeIcon iconType={isPlaying ? "pause" : "play"} styleType="solid" />
        </button>
      </div>
      <div className="flex min-h-0 min-w-0 shrink grow flex-col justify-center pt-0 sm:pt-2">
        <p className="overflow-hidden text-sm font-bold text-ellipsis whitespace-nowrap">
          {sound.title}
        </p>
        <p className="text-cax-text-muted overflow-hidden text-sm text-ellipsis whitespace-nowrap">
          {sound.artist}
        </p>
        <div className="pt-2">
          <div
            className="border-cax-border/30 bg-cax-surface relative w-full overflow-hidden rounded border"
            style={{ aspectRatio: "10 / 1", minHeight: "2.75rem" }}
          >
            {soundData !== null ? (
              <SoundWaveSVG playedRatio={currentTimeRatio} soundData={soundData} />
            ) : (
              <svg
                aria-hidden
                className="text-cax-accent absolute inset-0 block h-full w-full animate-pulse"
                preserveAspectRatio="none"
                viewBox="0 0 100 1"
              >
                <rect fill="currentColor" height="1" opacity={0.2} width="100" x="0" y="0" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
