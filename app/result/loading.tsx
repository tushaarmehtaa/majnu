import { Skeleton } from "@/components/ui/skeleton";

export default function ResultLoading() {
  return (
    <div className="container relative max-w-3xl py-16">
      <div className="space-y-8 rounded-3xl border border-red/20 bg-white/70 p-8 shadow-[0_30px_80px_-30px_rgba(192,57,43,0.45)]">
        <div className="flex flex-col items-center gap-4 text-center">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-10 w-64 rounded-full" />
          <Skeleton className="h-4 w-72 rounded-full" />
          <Skeleton className="h-48 w-full max-w-sm rounded-2xl" />
        </div>
        <div className="space-y-4 rounded-2xl border border-red/20 bg-white/80 p-6">
          <Skeleton className="h-4 w-32 rounded-full" />
          <Skeleton className="h-4 w-40 rounded-full" />
          <Skeleton className="h-4 w-full rounded-full" />
          <Skeleton className="h-4 w-3/4 rounded-full" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-32 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
