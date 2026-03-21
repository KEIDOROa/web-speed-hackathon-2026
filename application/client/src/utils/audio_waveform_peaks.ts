/**
 * 音声ファイルをデコードし、表示用にバー数分のピーク（0〜1）を返す。
 */
export async function decodePeaksFromUrl(
  url: string,
  barCount: number,
  signal?: AbortSignal,
): Promise<number[]> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`Failed to fetch audio: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  if (signal?.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  const AudioContextCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) {
    throw new Error("AudioContext is not supported");
  }

  const ctx = new AudioContextCtor();
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    return peaksFromAudioBuffer(audioBuffer, barCount);
  } finally {
    await ctx.close();
  }
}

function peaksFromAudioBuffer(audioBuffer: AudioBuffer, barCount: number): number[] {
  const { length, numberOfChannels } = audioBuffer;
  if (length === 0 || numberOfChannels === 0) {
    return Array.from({ length: barCount }, () => 0);
  }

  const samplesPerBar = Math.max(1, Math.floor(length / barCount));
  const peaks: number[] = [];

  for (let b = 0; b < barCount; b++) {
    const start = b * samplesPerBar;
    const end = Math.min(start + samplesPerBar, length);
    let max = 0;
    for (let i = start; i < end; i++) {
      let sum = 0;
      for (let c = 0; c < numberOfChannels; c++) {
        sum += Math.abs(audioBuffer.getChannelData(c)[i] ?? 0);
      }
      const mono = sum / numberOfChannels;
      if (mono > max) {
        max = mono;
      }
    }
    peaks.push(max);
  }

  const top = Math.max(...peaks, 1e-8);
  return peaks.map((p) => p / top);
}
