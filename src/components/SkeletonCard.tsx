export function SkeletonCard() {
  return (
    <div className="relative bg-neutral-900/60 border border-white/5 rounded-2xl p-5 flex flex-col gap-4 animate-pulse">

      {/* Badge placeholder */}
      <div>
        <div className="h-6 w-20 bg-neutral-800 rounded-full" />
        <div className="h-4 w-3/4 bg-neutral-800 rounded-lg mt-3" />
        <div className="h-3 w-1/3 bg-neutral-800 rounded-lg mt-2" />
      </div>

      {/* Divider */}
      <div className="h-px bg-white/5" />

      {/* Price area */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 bg-neutral-800 rounded-md" />
          <div className="h-5 w-24 bg-neutral-800 rounded-md" />
        </div>

        {/* Vendor rows */}
        <div className="bg-white/[0.03] rounded-xl p-3 flex flex-col gap-2 border border-white/5">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-3 w-20 bg-neutral-800 rounded-md" />
              <div className="h-3 w-16 bg-neutral-800 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Button placeholder */}
      <div className="h-10 bg-neutral-800 rounded-xl" />
    </div>
  );
}
