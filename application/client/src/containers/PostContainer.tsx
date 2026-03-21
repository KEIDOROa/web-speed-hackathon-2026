import { Helmet } from "react-helmet";
import { useParams } from "react-router";

import { InfiniteScroll } from "@web-speed-hackathon-2026/client/src/components/foundation/InfiniteScroll";
import { PostPage } from "@web-speed-hackathon-2026/client/src/components/post/PostPage";
import { NotFoundContainer } from "@web-speed-hackathon-2026/client/src/containers/NotFoundContainer";
import { useFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_fetch";
import { useInfiniteFetch } from "@web-speed-hackathon-2026/client/src/hooks/use_infinite_fetch";
import { fetchJSON } from "@web-speed-hackathon-2026/client/src/utils/fetchers";

const PostContainerContent = ({ postId }: { postId: string | undefined }) => {
  const { data: post, isLoading: isLoadingPost } = useFetch<Models.Post>(
    `/api/v1/posts/${postId}`,
    fetchJSON,
  );

  const { data: comments, fetchMore } = useInfiniteFetch<Models.Comment>(
    `/api/v1/posts/${postId}/comments`,
    fetchJSON,
  );

  if (isLoadingPost) {
    return (
      <>
        <Helmet>
          <title>読込中 - CaX</title>
        </Helmet>
        <div className="p-4">
          <p className="text-cax-text-muted text-2xl">投稿を読み込み中...</p>
        </div>
      </>
    );
  }

  if (post === null) {
    return <NotFoundContainer />;
  }

  const firstImageId = post.images?.[0]?.id;
  const movieId = post.movie?.id;
  const profileId = post.user.profileImage?.id;

  return (
    <InfiniteScroll fetchMore={fetchMore} items={comments}>
      <Helmet>
        <title>{post.user.name} さんのつぶやき - CaX</title>
        {firstImageId ? (
          <link rel="preload" as="image" href={`/images/${firstImageId}.jpg?w=640`} fetchPriority="high" />
        ) : null}
        {!firstImageId && movieId ? (
          <link rel="preload" as="image" href={`/movies/${movieId}.gif?w=360`} fetchPriority="high" />
        ) : null}
        {profileId ? (
          <link
            rel="preload"
            as="image"
            href={`/images/profiles/${profileId}.jpg?w=96`}
            fetchPriority={firstImageId || movieId ? "auto" : "high"}
          />
        ) : null}
      </Helmet>
      <PostPage comments={comments} post={post} />
    </InfiniteScroll>
  );
};

export const PostContainer = () => {
  const { postId } = useParams();
  return <PostContainerContent key={postId} postId={postId} />;
};
