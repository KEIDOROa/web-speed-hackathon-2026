import { useEffect, useRef, useState } from "react";

interface ParsedData {
  peaks: number[];
}

function maxInRange(arr: number[], start: number, end: number): number {
  let m = 0;
  const e = Math.min(end, arr.length);
  for (let i = start; i < e; i++) {
    const v = arr[i] as number;
    if (v > m) {
      m = v;
    }
  }
  return m;
}

const PEAK_BAR_COUNT = 100;
const HEIGHT_GAMMA = 0.82;
const VISUAL_HEIGHT_CAP = 0.52;
const BAR_WIDTH = 0.52;
const BAR_RX_MAX = 0.12;

async function calculate(data: ArrayBuffer): Promise<ParsedData> {
  const audioCtx = new AudioContext();
  try {
    const buffer = await audioCtx.decodeAudioData(data.slice(0));
    const leftData = Array.from(buffer.getChannelData(0), Math.abs);
    const channels = buffer.numberOfChannels;
    const normalized =
      channels >= 2
        ? (() => {
            const rightData = Array.from(buffer.getChannelData(1), Math.abs);
            return leftData.map((l, i) => (l + (rightData[i] ?? 0)) / 2);
          })()
        : leftData;

    const chunkSize = Math.ceil(normalized.length / PEAK_BAR_COUNT);
    const peaks: number[] = [];
    for (let i = 0; i < normalized.length; i += chunkSize) {
      const end = i + chunkSize;
      peaks.push(maxInRange(normalized, i, end));
    }
    if (peaks.length > PEAK_BAR_COUNT) {
      peaks.length = PEAK_BAR_COUNT;
    }

    return { peaks };
  } finally {
    void audioCtx.close();
  }
}

interface Props {
  soundData: ArrayBuffer;
  playedRatio?: number;
}

function skeletonHeights(count: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = (i / count) * Math.PI * 2;
    out.push(0.12 + 0.22 * (0.5 + 0.5 * Math.sin(t * 3.1)));
  }
  return out;
}

export const SoundWaveSVG = ({ soundData, playedRatio = 0 }: Props) => {
  const uniqueIdRef = useRef(`sw-${Math.random().toString(16).slice(2)}`);
  const [{ peaks, decodeSettled }, setModel] = useState<{
    peaks: number[];
    decodeSettled: boolean;
  }>({ peaks: [], decodeSettled: false });

  useEffect(() => {
    setModel({ peaks: [], decodeSettled: false });
    void calculate(soundData)
      .then(({ peaks: p }) => {
        setModel({ peaks: p, decodeSettled: true });
      })
      .catch(() => {
        setModel({ peaks: [], decodeSettled: true });
      });
  }, [soundData]);

  const displayPeaks = peaks.length > 0 ? peaks : skeletonHeights(PEAK_BAR_COUNT);

  const minPeak = displayPeaks.length > 0 ? Math.min(...displayPeaks) : 0;
  const maxPeak = displayPeaks.length > 0 ? Math.max(...displayPeaks) : 0;
  const peakRange = maxPeak - minPeak;

  const clipId = `${uniqueIdRef.current}-played`;
  const safeRatio = Math.min(1, Math.max(0, playedRatio));
  const clipWidth = safeRatio * PEAK_BAR_COUNT;

  const barInset = (1 - BAR_WIDTH) / 2;
  const isPlaceholder = decodeSettled && peaks.length === 0;
  const dimOpacity = isPlaceholder ? 0.35 : 0.5;

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
      className={`text-cax-accent absolute inset-0 block h-full w-full ${!decodeSettled ? "animate-pulse" : ""}`}
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
