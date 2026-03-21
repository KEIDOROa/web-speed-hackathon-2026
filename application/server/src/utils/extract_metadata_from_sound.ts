import * as MusicMetadata from "music-metadata";

interface SoundMetadata {
  artist: string;
  title: string;
}

function normalizeField(value: unknown, fallback: string): string {
  if (value == null) {
    return fallback;
  }
  if (Array.isArray(value)) {
    const joined = value.filter(Boolean).join(", ");
    return joined.length > 0 ? joined : fallback;
  }
  return String(value);
}

export async function extractMetadataFromSound(data: Buffer): Promise<SoundMetadata> {
  try {
    const metadata = await MusicMetadata.parseBuffer(data);
    return {
      artist: normalizeField(metadata.common.artist, "Unknown"),
      title: normalizeField(metadata.common.title, "Unknown"),
    };
  } catch {
    return {
      artist: "Unknown",
      title: "Unknown",
    };
  }
}
