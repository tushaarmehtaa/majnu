"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function LeaderboardRowSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-12 w-full rounded-xl bg-gradient-to-r from-red/5 via-white to-red/5"
        />
      ))}
    </div>
  );
}
