import { MouseEvent, useCallback, useId, useMemo } from "react";

import { Button } from "@web-speed-hackathon-2026/client/src/components/foundation/Button";
import { Modal } from "@web-speed-hackathon-2026/client/src/components/modal/Modal";
import { buildPostImageResponsive } from "@web-speed-hackathon-2026/client/src/utils/get_path";

interface Props {
  imageId: string;
  alt: string;
  priority?: boolean;
  /** タイムライン等。解像度を抑えて LCP/TBT に効かせる */
  feedOptimize?: boolean;
  sizes: string;
}

/**
 * アスペクト比を維持したまま、要素のコンテンツボックス全体を埋めるように画像を拡大縮小します
 */
export const CoveredImage = ({
  imageId,
  alt,
  priority = false,
  feedOptimize = false,
  sizes,
}: Props) => {
  const dialogId = useId();
  const { src, srcSet } = useMemo(
    () => buildPostImageResponsive(imageId, { feed: feedOptimize }),
    [imageId, feedOptimize],
  );

  const handleDialogClick = useCallback((ev: MouseEvent<HTMLDialogElement>) => {
    ev.stopPropagation();
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <img
        alt={alt}
        className="absolute left-1/2 top-1/2 h-full w-full max-w-none -translate-x-1/2 -translate-y-1/2 object-cover"
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        loading={priority ? "eager" : "lazy"}
        sizes={sizes}
        src={src}
        srcSet={srcSet}
      />

      <button
        className="border-cax-border bg-cax-surface-raised/90 text-cax-text-muted hover:bg-cax-surface absolute right-1 bottom-1 rounded-full border px-2 py-1 text-center text-xs"
        type="button"
        command="show-modal"
        commandfor={dialogId}
      >
        ALT を表示する
      </button>

      <Modal id={dialogId} closedby="any" onClick={handleDialogClick}>
        <div className="grid gap-y-6">
          <h1 className="text-center text-2xl font-bold">画像の説明</h1>

          <p className="text-sm">{alt || "（説明はありません）"}</p>

          <Button variant="secondary" command="close" commandfor={dialogId}>
            閉じる
          </Button>
        </div>
      </Modal>
    </div>
  );
};
