import classNames from "classnames";

import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";
import { CoveredImage } from "@web-speed-hackathon-2026/client/src/components/foundation/CoveredImage";

const IMAGE_SIZES_FULL = "(max-width: 640px) min(100vw - 5rem, 560px), 560px";
const IMAGE_SIZES_GRID = "(max-width: 640px) min(44vw - 0.75rem, 280px), 280px";

interface Props {
  images: Models.Image[];
  priority?: boolean;
}

export const ImageArea = ({ images, priority = false }: Props) => {
  return (
    <AspectRatioBox aspectHeight={9} aspectWidth={16}>
      <div className="border-cax-border grid h-full w-full grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-lg border">
        {images.map((image, idx) => {
          return (
            <div
              key={image.id}
              // CSS Grid で表示領域を指定する
              className={classNames("bg-cax-surface-subtle", {
                "col-span-1": images.length !== 1,
                "col-span-2": images.length === 1,
                "row-span-1": images.length > 2 && (images.length !== 3 || idx !== 0),
                "row-span-2": images.length <= 2 || (images.length === 3 && idx === 0),
              })}
            >
              <CoveredImage
                imageId={image.id}
                priority={priority}
                sizes={images.length === 1 ? IMAGE_SIZES_FULL : IMAGE_SIZES_GRID}
              />
            </div>
          );
        })}
      </div>
    </AspectRatioBox>
  );
};
