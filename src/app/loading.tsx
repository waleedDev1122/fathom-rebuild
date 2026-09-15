export default function HomeLoading() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-4 w-40" />
      </div>

      <div className="skeleton h-10 w-full" />

      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card flex flex-col gap-2">
            <div className="flex items-start justify-between gap-4">
              <div className="skeleton h-5 w-48" />
              <div className="skeleton h-5 w-12" />
            </div>
            <div className="skeleton h-4 w-64" />
          </div>
        ))}
      </div>
    </div>
  );
}
