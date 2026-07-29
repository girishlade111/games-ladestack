export default function Loading() {
  return (
    <div className="flex flex-col animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
          <div className="w-48 h-8 bg-muted rounded-full mx-auto" />
          <div className="w-96 h-12 bg-muted rounded mx-auto" />
          <div className="w-80 h-6 bg-muted rounded mx-auto" />
          <div className="flex gap-4 justify-center">
            <div className="w-40 h-12 bg-muted rounded-md" />
            <div className="w-40 h-12 bg-muted rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-8 mb-16">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded" />
              <div className="w-16 h-8 bg-muted rounded" />
              <div className="w-20 h-4 bg-muted rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border p-6 space-y-3">
              <div className="w-12 h-12 bg-muted rounded-xl" />
              <div className="w-32 h-5 bg-muted rounded" />
              <div className="w-full h-4 bg-muted rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
