import { Helmet } from "react-helmet";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { TimelinePage } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelinePage";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

export const TimelineContainer = () => {
  const { data: posts, fetchMore, hasMore, isLoading, error } = useInfiniteFetch<Models.Post>(
    "/api/v1/posts",
    fetchJSON,
    { pageSize: 15 },
  );

  return (
    <InfiniteScroll fetchMore={fetchMore} hasMore={hasMore} items={posts}>
      <Helmet>
        <title>タイムライン - CaX</title>
      </Helmet>
      {error != null && posts.length === 0 ? (
        <div className="p-4">
          <p className="text-cax-danger text-2xl">タイムラインを読み込めませんでした</p>
        </div>
      ) : isLoading && posts.length === 0 ? (
        <div className="p-4">
          <p className="text-cax-text-muted text-2xl">タイムラインを読み込み中...</p>
        </div>
      ) : (
        <TimelinePage timeline={posts} />
      )}
    </InfiniteScroll>
  );
};
