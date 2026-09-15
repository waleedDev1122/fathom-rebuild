export function MeetingDetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="skeleton h-4 w-24" />
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="skeleton h-6 w-64" />
            <div className="skeleton h-4 w-48" />
          </div>
          <div className="skeleton h-8 w-32 shrink-0" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-2">
          <div className="skeleton h-10 w-full" />
          <div className="card flex flex-col gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-5/6" />
              </div>
            ))}
          </div>
        </div>

        <div className="card flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="skeleton h-8 w-24" />
            <div className="skeleton h-8 w-20" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
