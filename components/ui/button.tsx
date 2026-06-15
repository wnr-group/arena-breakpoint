import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'gradient'
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
          'inline-flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-300 relative overflow-hidden group',
          'focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-gradient-to-br from-primary via-amber-500 to-orange-600 text-black font-black shadow-[0_0_15px_rgba(255,193,7,0.3)] hover:shadow-[0_0_25px_rgba(255,193,7,0.5)] hover:scale-[1.02] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700': variant === 'default',
            'bg-gradient-to-r from-primary via-amber-400 to-primary text-black font-black shadow-[0_0_20px_rgba(255,193,7,0.3)] hover:shadow-[0_0_40px_rgba(255,193,7,0.5)] hover:scale-[1.02] before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-700': variant === 'gradient',
            'border-2 border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 hover:border-primary/50 hover:from-primary/10 hover:to-orange-600/10 text-zinc-300 hover:text-white backdrop-blur-sm shadow-[0_0_8px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(255,193,7,0.2)]': variant === 'outline',
            'bg-gradient-to-br from-zinc-900/50 to-zinc-950/50 hover:from-primary/20 hover:to-orange-600/20 hover:text-white transition-all text-zinc-400 hover:shadow-[0_0_10px_rgba(255,193,7,0.15)]': variant === 'ghost',
            'text-primary hover:text-amber-300 font-bold underline-offset-4 hover:underline hover:drop-shadow-[0_0_8px_rgba(255,193,7,0.6)]': variant === 'link',
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
