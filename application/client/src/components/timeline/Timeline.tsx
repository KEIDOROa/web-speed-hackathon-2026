import { TimelineItem } from "@web-speed-hackathon-2026/client/src/components/timeline/TimelineItem";

interface Props {
  timeline: Models.Post[];
}

export const Timeline = ({ timeline }: Props) => {
  const firstImageIndex = timeline.findIndex((post) => (post.images?.length ?? 0) > 0);
  const priorityPostIndex = firstImageIndex === -1 ? 0 : firstImageIndex;

  return (
    <section>
      {timeline.map((post, index) => {
        return (
          <TimelineItem key={post.id} post={post} priority={index === priorityPostIndex} />
        );
      })}
    </section>
  );
};
