import { SoundPlayer } from "@web-speed-hackathon-2026/client/src/components/foundation/SoundPlayer";

interface Props {
  sound: Models.Sound;
}

export const SoundArea = ({ sound }: Props) => {
  return (
    <div
      className="border-cax-border relative min-h-[4.5rem] w-full overflow-hidden rounded-lg border sm:min-h-0 sm:h-full"
      data-sound-area
    >
      <SoundPlayer sound={sound} />
    </div>
  );
};
