import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
  const mediaIndices = timeline
    .map((_, i) => i)
    .filter((i) => {
      const post = timeline[i];
      return (post.images?.length ?? 0) > 0 || Boolean(post.movie);
    });
  const priorityMediaIndices = new Set(mediaIndices.slice(0, 2));

  return (
    <section>
      {timeline.map((post, index) => {
        return (
          <TimelineItem
            key={post.id}
            contentVisibilityAuto={index > 1}
            post={post}
            priorityAvatar={index === 0}
            priorityMedia={priorityMediaIndices.has(index)}
          />
        );
      })}
    </section>
  );
};
