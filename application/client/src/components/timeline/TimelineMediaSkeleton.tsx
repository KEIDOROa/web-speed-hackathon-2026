import classNames from "classnames";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";

const pulse = "bg-cax-surface-subtle animate-pulse";

export function ImageAreaSkeleton({ count }: { count: number }) {
  const n = Math.min(count, 4);
  return (
    <AspectRatioBox aspectHeight={9} aspectWidth={16}>
      <div className="border-cax-border grid h-full w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg border">
        {Array.from({ length: n }).map((_, idx) => (
          <div
            key={idx}
            className={classNames(pulse, {
              "col-span-1": count !== 1,
              "col-span-2": count === 1,
              "row-span-1": count > 2 && (count !== 3 || idx !== 0),
              "row-span-2": count <= 2 || (count === 3 && idx === 0),
            })}
          />
        ))}
      </div>
    </AspectRatioBox>
  );
}

export function MovieAreaSkeleton() {
  return (
    <div className="border-cax-border aspect-square w-full rounded-lg border">
      <div className={`h-full w-full rounded-lg ${pulse}`} />
    </div>
  );
}

export function SoundAreaSkeleton() {
  return (
    <div
      className="border-cax-border relative min-h-[4.5rem] w-full overflow-hidden rounded-lg border sm:min-h-0 sm:h-full"
      data-sound-area
    >
      <div className={`h-full min-h-[4.5rem] w-full rounded-lg sm:min-h-[5rem] ${pulse}`} />
    </div>
  );
}
