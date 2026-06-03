import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

export const buttonVariants = ({ variant = 'default', size = 'default' }: { variant?: string; size?: string } = {}) => {
  return cn(
    'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
    {
      'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
      'border border-input bg-background hover:bg-accent': variant === 'outline',
      'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
      'text-primary underline-offset-4 hover:underline': variant === 'link',
    },
    {
      'h-10 px-4 py-2': size === 'default',
      'h-9 rounded-md px-3': size === 'sm',
      'h-11 rounded-md px-8': size === 'lg',
      'h-10 w-10': size === 'icon',
    }
  )
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = 'button'
    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-300',
          'focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-gradient-primary hover:bg-gradient-primary-hover text-black font-bold hover-gradient-shift glow-primary-hover': variant === 'default',
            'border-2 border-transparent bg-gradient-primary bg-origin-border bg-clip-padding hover:bg-gradient-primary-hover backdrop-blur-sm': variant === 'outline',
            'hover:bg-gradient-primary hover:text-black hover:font-bold transition-all': variant === 'ghost',
            'text-gradient-primary hover:text-gradient-secondary font-bold underline-offset-4 hover:underline': variant === 'link',
          },
          {
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-11 rounded-md px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
