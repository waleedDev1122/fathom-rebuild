export default function SettingsLoading() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-4 w-64" />
      </div>

      <div className="card flex flex-col gap-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="skeleton h-4 w-40" />
            <div className="skeleton h-9 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
