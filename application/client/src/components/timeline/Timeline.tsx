import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
  const firstMediaIndex = timeline.findIndex(
    (post) => (post.images?.length ?? 0) > 0 || Boolean(post.movie),
  );
  const priorityPostIndex = firstMediaIndex === -1 ? 0 : firstMediaIndex;

  return (
    <section>
      {timeline.map((post, index) => {
        return (
          <TimelineItem
            key={post.id}
            contentVisibilityAuto={index > 1}
            post={post}
            priorityAvatar={index === 0}
            priorityMedia={index === priorityPostIndex}
          />
        );
      })}
    </section>
  );
};
