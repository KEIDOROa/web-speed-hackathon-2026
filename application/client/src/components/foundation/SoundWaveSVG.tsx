import { useRef } from "react";

const PEAK_BAR_COUNT = 100;
const HEIGHT_GAMMA = 0.82;
const VISUAL_HEIGHT_CAP = 0.52;
const BAR_WIDTH = 0.52;
const BAR_RX_MAX = 0.12;

function skeletonHeights(count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    out.push(0.12 + 0.22 * (0.5 + 0.5 * Math.sin(t * 3.1)));
  }
  return out;
}

interface Props {
  playedRatio?: number;
}

export const SoundWaveSVG = ({ playedRatio = 0 }: Props) => {
  const uniqueIdRef = useRef(`sw-${Math.random().toString(16).slice(2)}`);
  const displayPeaks = skeletonHeights(PEAK_BAR_COUNT);

  const minPeak = displayPeaks.length > 0 ? Math.min(...displayPeaks) : 0;
  const maxPeak = displayPeaks.length > 0 ? Math.max(...displayPeaks) : 0;
  const peakRange = maxPeak - minPeak;

  const clipId = `${uniqueIdRef.current}-played`;
  const safeRatio = Math.min(1, Math.max(0, playedRatio));
  const clipWidth = safeRatio * PEAK_BAR_COUNT;

  const barInset = (1 - BAR_WIDTH) / 2;
  const dimOpacity = 0.5;

  const renderBars = (keySuffix: string) =>
    displayPeaks.map((peak, idx) => {
      let linear = 0;
      if (peak > 0) {
        if (peakRange > 1e-8) {
          linear = (peak - minPeak) / peakRange;
        } else {
          linear = 0.42;
        }
      }
      linear = Math.min(1, Math.max(0, linear));
      const shaped = linear > 0 ? Math.pow(linear, HEIGHT_GAMMA) : 0;
      const raw = VISUAL_HEIGHT_CAP * shaped;
      const height = Math.max(raw, linear > 0 ? 0.014 : 0.006);
      const rr = Math.min(BAR_RX_MAX, height / 2 - 1e-4);
      const useRound = rr > 1e-4;
      return (
        <rect
          key={`${uniqueIdRef.current}-${keySuffix}-${idx}`}
          fill="currentColor"
          height={height}
          rx={useRound ? rr : undefined}
          ry={useRound ? rr : undefined}
          width={BAR_WIDTH}
          x={idx + barInset}
          y={1 - height}
        />
      );
    });

  return (
    <svg
      className="text-cax-accent absolute inset-0 block h-full w-full"
      preserveAspectRatio="none"
      viewBox={`0 0 ${PEAK_BAR_COUNT} 1`}
    >
      <defs>
        <clipPath id={clipId}>
          <rect height="1" width={clipWidth} x="0" y="0" />
        </clipPath>
      </defs>
      <g opacity={dimOpacity}>{renderBars("dim")}</g>
      <g clipPath={`url(#${clipId})`}>{renderBars("played")}</g>
    </svg>
  );
};
