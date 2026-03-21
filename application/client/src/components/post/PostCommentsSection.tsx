import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { CommentList } from "@web-speed-hackathon-2026/client/src/components/post/CommentList";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

interface Props {
  postId: string;
}

export const PostCommentsSection = ({ postId }: Props) => {
  const { data: comments, fetchMore, hasMore } = useInfiniteFetch<Models.Comment>(
    `/api/v1/posts/${postId}/comments`,
    fetchJSON,
  );

  return (
    <InfiniteScroll fetchMore={fetchMore} hasMore={hasMore} items={comments}>
      <CommentList comments={comments} />
    </InfiniteScroll>
  );
};
