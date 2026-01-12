/**
 * VORTEX PROTOCOL - SKELETON COMPONENT
 */

import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-vortex-surface/50',
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
