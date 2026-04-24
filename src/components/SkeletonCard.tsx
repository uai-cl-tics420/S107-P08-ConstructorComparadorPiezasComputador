export function SkeletonCard() {
  return (
    <div className='relative h-full rounded-xl border border-tw-border-deep bg-tw-surface p-5 flex flex-col gap-4 animate-pulse overflow-hidden'>
      {/* Top shimmer */}
      <div className='absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-linear-to-r from-transparent via-tw-glass/5 to-transparent' />

      {/* Badge */}
      <div className='flex items-center gap-2'>
        <div className='w-1.5 h-1.5 rounded-full bg-tw-surface-highlight' />
        <div className='h-2.5 w-16 bg-tw-surface-highlight rounded' />
      </div>

      {/* Title */}
      <div className='space-y-2'>
        <div className='h-3.5 w-full bg-tw-surface-highlight rounded' />
        <div className='h-3.5 w-3/4 bg-tw-surface-highlight rounded' />
        <div className='h-2 w-1/3 bg-tw-base-highlight rounded mt-1' />
      </div>

      {/* Specs mono rows */}
      <div className='border-t border-tw-border-deep pt-3 space-y-2.5'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='flex justify-between'>
            <div className='h-2 w-12 bg-tw-base-highlight rounded' />
            <div className='h-2 w-16 bg-tw-surface-highlight rounded' />
          </div>
        ))}
      </div>

      {/* Price */}
      <div className='mt-auto space-y-3'>
        <div className='flex justify-between items-baseline'>
          <div className='h-2 w-16 bg-tw-base-highlight rounded' />
          <div className='h-6 w-24 bg-tw-surface-highlight rounded' />
        </div>
        <div className='bg-tw-surface border border-tw-border-deep rounded-lg p-2.5 space-y-2'>
          {[1, 2].map((i) => (
            <div key={i} className='flex justify-between'>
              <div className='h-2 w-20 bg-tw-base-highlight rounded' />
              <div className='h-2 w-16 bg-tw-base-highlight rounded' />
            </div>
          ))}
        </div>
      </div>

      {/* Button placeholder */}
      <div className='pt-3 border-t border-tw-border-deep'>
        <div className='h-9 w-full bg-tw-base-highlight rounded-lg' />
      </div>
    </div>
  );
}
