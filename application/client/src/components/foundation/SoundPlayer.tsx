import { ReactEventHandler, useCallback, useRef, useState } from "react";

import { FontAwesomeIcon } from "@web-speed-hackathon-2026/client/src/components/foundation/FontAwesomeIcon";
import { SoundWaveSVG } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundWaveSVG";
import { getSoundPath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  sound: Models.Sound;
}

export const SoundPlayer = ({ sound }: Props) => {
  const soundUrl = getSoundPath(sound.id);

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
    <div className="bg-cax-surface-subtle flex min-h-[4.5rem] w-full items-center justify-center gap-1 sm:min-h-0 sm:h-full">
      <audio ref={audioRef} loop={true} onTimeUpdate={handleTimeUpdate} src={soundUrl} preload="none" />
      <div className="p-2">
        <button
          aria-label="音声プレイヤー"
          aria-pressed={isPlaying}
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
            <SoundWaveSVG audioSrc={soundUrl} playedRatio={currentTimeRatio} />
          </div>
        </div>
      </div>
    </div>
  );
};
