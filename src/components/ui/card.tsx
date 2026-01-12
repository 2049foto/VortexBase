/**
 * VORTEX PROTOCOL - CARD COMPONENT
 * Glass morphism card with glow effects
 */

import * as React from 'react';

import { cn } from '@/lib/utils';

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'glow' | 'outline';
    glowColor?: 'cyan' | 'purple' | 'pink' | 'green';
  }
>(({ className, variant = 'default', glowColor = 'cyan', ...props }, ref) => {
  const glowClasses = {
    cyan: 'hover:shadow-glow-cyan border-vortex-cyan/30',
    purple: 'hover:shadow-glow-purple border-vortex-purple/30',
    pink: 'hover:shadow-glow-pink border-vortex-pink/30',
    green: 'hover:shadow-glow-green border-vortex-green/30',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'rounded-xl backdrop-blur-xl transition-all duration-300',
        variant === 'default' && 'glass-card',
        variant === 'glow' && `glass-card border ${glowClasses[glowColor]}`,
        variant === 'outline' && 'border border-vortex-surface bg-transparent',
        className
      )}
      {...props}
    />
  );
});
Card.displayName = 'Card';

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-xl font-bold leading-none tracking-tight text-vortex-text',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-vortex-muted', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
