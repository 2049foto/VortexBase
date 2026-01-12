/**
 * VORTEX PROTOCOL - BADGE COMPONENT
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-vortex-cyan/20 text-vortex-cyan border border-vortex-cyan/30',
        secondary:
          'bg-vortex-surface text-vortex-muted border border-vortex-surface',
        success:
          'bg-vortex-green/20 text-vortex-green border border-vortex-green/30',
        warning:
          'bg-vortex-yellow/20 text-vortex-yellow border border-vortex-yellow/30',
        danger:
          'bg-vortex-red/20 text-vortex-red border border-vortex-red/30',
        purple:
          'bg-vortex-purple/20 text-vortex-purple border border-vortex-purple/30',
        pink:
          'bg-vortex-pink/20 text-vortex-pink border border-vortex-pink/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
