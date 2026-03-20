import { AspectRatioBox } from "@web-speed-hackathon-2026/client/src/components/foundation/AspectRatioBox";

interface Props {
  src: string;
}

/**
 * GIF動画を表示します。ブラウザのネイティブGIF再生を使用します。
 */
export const PausableMovie = ({ src }: Props) => {
  return (
    <AspectRatioBox aspectHeight={1} aspectWidth={1}>
      <div className="relative block h-full w-full">
        <img alt="動画" className="w-full h-full object-cover" src={src} />
      </div>
    </AspectRatioBox>
  );
};
