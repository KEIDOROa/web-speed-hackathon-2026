export const DirectMessageDetailSkeleton = () => (
  <section
    className="bg-cax-surface flex min-h-[calc(100vh-(--spacing(12)))] flex-col lg:min-h-screen"
    aria-busy="true"
    aria-label="読み込み中"
  >
    <header className="border-cax-border bg-cax-surface sticky top-0 z-10 flex items-center gap-2 border-b px-4 py-3">
      <div className="bg-cax-surface-subtle h-12 w-12 shrink-0 animate-pulse rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="bg-cax-surface-subtle h-5 w-32 max-w-[60%] animate-pulse rounded" />
        <div className="bg-cax-surface-subtle h-3 w-24 max-w-[40%] animate-pulse rounded" />
      </div>
    </header>
    <div className="bg-cax-surface-subtle flex flex-1 flex-col space-y-4 px-4 pt-4 pb-8">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex gap-3">
          <div className="bg-cax-surface h-10 w-10 shrink-0 animate-pulse rounded-full" />
          <div className="bg-cax-surface h-14 min-w-0 flex-1 animate-pulse rounded-2xl" />
        </div>
      ))}
    </div>
  </section>
);
