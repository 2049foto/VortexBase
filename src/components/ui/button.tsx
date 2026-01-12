/**
 * VORTEX PROTOCOL - BUTTON COMPONENT
 * Cyber-themed button with glow effects
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, type HTMLMotionProps } from 'framer-motion';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vortex-cyan/50 focus-visible:ring-offset-2 focus-visible:ring-offset-vortex-dark disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-vortex-cyan via-vortex-purple to-vortex-pink text-vortex-dark shadow-glow-cyan hover:shadow-glow-purple hover:scale-[1.02] active:scale-[0.98]',
        secondary:
          'bg-vortex-surface/80 text-vortex-text border border-vortex-cyan/30 hover:bg-vortex-cyan/10 hover:border-vortex-cyan/50',
        outline:
          'border-2 border-vortex-cyan/50 bg-transparent text-vortex-cyan hover:bg-vortex-cyan/10 hover:border-vortex-cyan',
        ghost:
          'text-vortex-text hover:bg-vortex-surface/50 hover:text-vortex-cyan',
        danger:
          'bg-vortex-red/20 text-vortex-red border border-vortex-red/30 hover:bg-vortex-red/30',
        success:
          'bg-vortex-green/20 text-vortex-green border border-vortex-green/30 hover:bg-vortex-green/30',
      },
      size: {
        default: 'h-11 px-6 py-2',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-14 px-8 text-base',
        xl: 'h-16 px-10 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        whileHover={{ scale: disabled ? 1 : 1.02 }}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
