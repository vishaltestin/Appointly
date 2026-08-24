import { Skeleton } from "@/components/ui/skeleton"

export default function BookingLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6" aria-busy="true" aria-label="Loading">
      <div className="flex flex-col items-center gap-3 pt-4 text-center">
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
