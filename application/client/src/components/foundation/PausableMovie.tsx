import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";

interface Props {
  src: string;
  srcSet?: string;
  sizes?: string;
  priority?: boolean;
}

/**
 * アニメ GIF/WebP を表示します。サーバーが Accept に応じて WebP に転送します。
 */
export const PausableMovie = ({ src, srcSet, sizes, priority = false }: Props) => {
  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <div className="relative block h-full w-full">
        <img
          alt="動画"
          className="w-full h-full object-cover"
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          loading={priority ? "eager" : "lazy"}
          sizes={sizes}
          src={src}
          srcSet={srcSet}
        />
      </div>
    </AspectRatioBox>
  );
};
