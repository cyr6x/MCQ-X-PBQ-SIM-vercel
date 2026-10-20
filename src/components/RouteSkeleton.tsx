import { Skeleton } from '@/components/ui/skeleton';
import { Panel } from '@/components/product/ProductUI';

/**
 * Generic route-level loading placeholder. Pages load as lazy chunks so the
 * shell paints immediately; this keeps the transition from flashing empty
 * main content. Matches the Dashboard/Analytics card rhythm loosely.
 */
export function RouteSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-6" aria-busy="true" aria-label="Loading screen">
      <div className="mb-6 space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-3/4 max-w-md" />
        <Skeleton className="h-4 w-2/3 max-w-lg" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Panel key={i} className="space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-7 w-20" />
          </Panel>
        ))}
      </div>

      <div className="grid gap-3">
        {[3, 2, 4].map((bars, i) => (
          <Panel key={i} className="space-y-3">
            <Skeleton className="h-3 w-32" />
            <div className="space-y-2">
              {Array.from({ length: bars }).map((_, j) => (
                <Skeleton key={j} className="h-2.5 w-full" />
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
