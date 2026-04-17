export function SkeletonCard() {
  return (
    <div className="relative h-full rounded-xl border border-[#1C1C1C] bg-[#0A0A0A] p-5 flex flex-col gap-4 animate-pulse overflow-hidden">
      {/* Top shimmer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />

      {/* Badge */}
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
        <div className="h-2.5 w-16 bg-zinc-800 rounded" />
      </div>

      {/* Title */}
      <div className="space-y-2">
        <div className="h-3.5 w-full bg-zinc-800 rounded" />
        <div className="h-3.5 w-3/4 bg-zinc-800 rounded" />
        <div className="h-2 w-1/3 bg-zinc-900 rounded mt-1" />
      </div>

      {/* Specs mono rows */}
      <div className="border-t border-[#1C1C1C] pt-3 space-y-2.5">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex justify-between">
            <div className="h-2 w-12 bg-zinc-900 rounded" />
            <div className="h-2 w-16 bg-zinc-800 rounded" />
          </div>
        ))}
      </div>

      {/* Price */}
      <div className="mt-auto space-y-3">
        <div className="flex justify-between items-baseline">
          <div className="h-2 w-16 bg-zinc-900 rounded" />
          <div className="h-6 w-24 bg-zinc-800 rounded" />
        </div>
        <div className="bg-[#0F0F0F] border border-[#1C1C1C] rounded-lg p-2.5 space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="flex justify-between">
              <div className="h-2 w-20 bg-zinc-900 rounded" />
              <div className="h-2 w-16 bg-zinc-900 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Button placeholder */}
      <div className="pt-3 border-t border-[#1C1C1C]">
        <div className="h-9 w-full bg-zinc-900 rounded-lg" />
      </div>
    </div>
  );
}
