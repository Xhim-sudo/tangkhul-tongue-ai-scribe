import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SkeletonLoaderProps {
  variant?: "card" | "list" | "text" | "avatar" | "translation";
  count?: number;
  className?: string;
}

export default function SkeletonLoader({
  variant = "card",
  count = 1,
  className,
}: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (variant) {
      case "card":
        return (
          <div className={cn("space-y-3 p-4 border rounded-lg", className)}>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        );

      case "list":
        return (
          <div className={cn("flex items-center space-x-4 p-4", className)}>
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        );

      case "text":
        return (
          <div className={cn("space-y-2", className)}>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        );

      case "avatar":
        return <Skeleton className={cn("h-12 w-12 rounded-full", className)} />;

      case "translation":
        return (
          <div className={cn("space-y-4", className)}>
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
            <Skeleton className="h-12 w-full rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>
          </div>
        );

      default:
        return <Skeleton className={className} />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
}
