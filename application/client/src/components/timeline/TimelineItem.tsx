import { MouseEventHandler, useCallback } from "react";
import { Link, useNavigate } from "react-router";

import { formatLongDate, toISOString } from "@web-speed-hackathon-2026/client/src/utils/date";

import { ImageArea } from "@web-speed-hackathon-2026/client/src/components/post/ImageArea";
import { MovieArea } from "@web-speed-hackathon-2026/client/src/components/post/MovieArea";
import { SoundArea } from "@web-speed-hackathon-2026/client/src/components/post/SoundArea";
import { TranslatableText } from "@web-speed-hackathon-2026/client/src/components/post/TranslatableText";
import {
  ImageAreaSkeleton,
  MovieAreaSkeleton,
  SoundAreaSkeleton,
} from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineMediaSkeleton";
import { useInView } from "@web-speed-hackathon-2026/client/src/hooks/use_in_view";
import { getProfileImagePath } from "@web-speed-hackathon-2026/client/src/utils/get_path";

const isClickedAnchorOrButton = (target: EventTarget | null, currentTarget: Element): boolean => {
  while (target !== null && target instanceof Element) {
    const tagName = target.tagName.toLowerCase();
    if (["a", "button"].includes(tagName)) {
      return true;
    }
    if (currentTarget === target) {
      return false;
    }
    target = target.parentNode;
  }
  return false;
};

/**
 * @typedef {object} Props
 * @property {Models.Post} post
 */
interface Props {
  post: Models.Post;
  /** 先頭行のアバター・LCP を早める */
  priorityAvatar?: boolean;
  /** フィード内で最初に現れる画像・動画 */
  priorityMedia?: boolean;
  /** 折りたたみ下の行のみ。レイアウト・描画コストを抑える */
  contentVisibilityAuto?: boolean;
}

export const TimelineItem = ({
  post,
  priorityAvatar = false,
  priorityMedia = false,
  contentVisibilityAuto = false,
}: Props) => {
  const navigate = useNavigate();
  const { ref: articleRef, inView: mediaInView } = useInView<HTMLElement>({
    rootMargin: "240px 0px 240px 0px",
    once: true,
  });

  const loadHeavyMedia = priorityMedia || mediaInView;
  const mediaPriority = priorityMedia && loadHeavyMedia;

  /**
   * ボタンやリンク以外の箇所をクリックしたとき かつ 文字が選択されてないとき、投稿詳細ページに遷移する
   */
  const handleClick = useCallback<MouseEventHandler>(
    (ev) => {
      const isSelectedText = document.getSelection()?.isCollapsed === false;
      if (!isClickedAnchorOrButton(ev.target, ev.currentTarget) && !isSelectedText) {
        navigate(`/posts/${post.id}`);
      }
    },
    [navigate, post.id],
  );

  return (
    <article
      ref={articleRef}
      className="hover:bg-cax-surface-subtle px-1 sm:px-4"
      onClick={handleClick}
      style={
        contentVisibilityAuto
          ? { contentVisibility: "auto", containIntrinsicSize: "auto 280px" }
          : undefined
      }
    >
      <div className="border-cax-border flex border-b px-2 pt-2 pb-4 sm:px-4">
        <div className="shrink-0 grow-0 pr-2 sm:pr-4">
          <Link
            aria-label={`${post.user.name}（@${post.user.username}）のプロフィール`}
            className="border-cax-border bg-cax-surface-subtle block h-12 w-12 overflow-hidden rounded-full border hover:opacity-75 sm:h-16 sm:w-16"
            to={`/users/${post.user.username}`}
          >
            <img
              alt={post.user.profileImage.alt || `${post.user.name}のプロフィール画像`}
              src={getProfileImagePath(post.user.profileImage.id, 96)}
              loading={priorityAvatar ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={priorityAvatar ? "high" : "auto"}
              width={64}
              height={64}
            />
          </Link>
        </div>
        <div className="min-w-0 shrink grow">
          <p className="overflow-hidden text-sm text-ellipsis whitespace-nowrap">
            <Link
              className="text-cax-text pr-1 font-bold hover:underline"
              to={`/users/${post.user.username}`}
            >
              {post.user.name}
            </Link>
            <Link
              className="text-cax-text-muted pr-1 hover:underline"
              to={`/users/${post.user.username}`}
            >
              @{post.user.username}
            </Link>
            <span className="text-cax-text-muted pr-1">-</span>
            <Link className="text-cax-text-muted pr-1 hover:underline" to={`/posts/${post.id}`}>
              <time dateTime={toISOString(post.createdAt)}>
                {formatLongDate(post.createdAt)}
              </time>
            </Link>
          </p>
          <div className="text-cax-text leading-relaxed">
            <TranslatableText text={post.text} />
          </div>
          {post.images?.length > 0 ? (
            <div className="relative mt-2 w-full">
              {loadHeavyMedia ? (
                <ImageArea images={post.images} priority={mediaPriority} />
              ) : (
                <ImageAreaSkeleton count={post.images.length} />
              )}
            </div>
          ) : null}
          {post.movie ? (
            <div className="relative mt-2 w-full">
              {loadHeavyMedia ? (
                <MovieArea
                  movie={post.movie}
                  priority={mediaPriority && (post.images?.length ?? 0) === 0}
                />
              ) : (
                <MovieAreaSkeleton />
              )}
            </div>
          ) : null}
          {post.sound ? (
            <div className="relative mt-2 w-full">
              {loadHeavyMedia ? <SoundArea sound={post.sound} /> : <SoundAreaSkeleton />}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
};
