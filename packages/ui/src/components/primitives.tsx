import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

const buttonVariants = cva(
  'inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-on-primary hover:bg-primary-strong',
        wish: 'bg-linear-to-b from-wish to-wish-strong text-on-wish shadow-cta hover:brightness-105',
        soft: 'bg-primary-soft text-primary-strong hover:brightness-95',
        outline: 'border border-border bg-surface text-ink hover:bg-surface-muted',
        ghost: 'text-ink hover:bg-surface-muted',
        danger: 'bg-danger text-on-primary hover:brightness-110',
        story: 'bg-story text-on-primary hover:brightness-110',
      },
      size: {
        sm: 'h-9 rounded-full px-3.5 text-sm',
        md: 'h-11 rounded-full px-5 text-base',
        lg: 'h-14 rounded-full px-8 font-display text-xl font-bold',
        icon: 'size-11 rounded-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export function Button({ className, variant, size, loading, disabled, children, type = 'button', ...rest }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...rest}>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

export function buttonClass(props: VariantProps<typeof buttonVariants>, className?: string): string {
  return cn(buttonVariants(props), className);
}

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-card bg-surface shadow-card', className)} {...rest} />;
}

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> { active?: boolean; tone?: 'primary' | 'story' | 'brag' | 'deal' | 'wish' }
const chipActive: Record<NonNullable<ChipProps['tone']>, string> = {
  primary: 'bg-primary text-on-primary border-primary',
  story: 'bg-story text-on-primary border-story',
  brag: 'bg-brag text-on-primary border-brag',
  deal: 'bg-deal text-on-primary border-deal',
  wish: 'bg-wish text-on-wish border-wish',
};

export function Chip({ active, tone = 'primary', className, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        'inline-flex h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition active:scale-95',
        active ? chipActive[tone] : 'border-border bg-surface text-ink hover:bg-surface-muted',
        className,
      )}
      {...rest}
    />
  );
}

const badgeTones = {
  owner: 'bg-role-owner-soft text-role-owner',
  sale: 'bg-role-sale-soft text-role-sale',
  story: 'bg-story-soft text-story',
  brag: 'bg-brag-soft text-brag',
  deal: 'bg-deal-soft text-deal',
  neutral: 'bg-surface-muted text-ink-muted',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  gold: 'bg-gold-soft text-gold-strong',
} as const;
export type BadgeTone = keyof typeof badgeTones;

export function Badge({ tone = 'neutral', className, ...rest }: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold', badgeTones[tone], className)} {...rest} />;
}

export function Avatar({ src, name, size = 40, className }: { src: string | null; name: string; size?: number; className?: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft font-display font-bold text-primary-strong', className)}
      style={{ width: size, height: size, fontSize: size * 0.45 }}
    >
      {src ? <img src={src} alt="" className="size-full object-cover" loading="lazy" /> : initial}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-primary', className)} aria-hidden />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-shimmer rounded-xl bg-linear-to-r from-surface-muted via-border to-surface-muted bg-[length:200%_100%]', className)} aria-hidden />;
}

export function ProgressBar({ value, max, className }: { value: number; max: number; className?: string }) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={cn('h-2.5 w-full overflow-hidden rounded-full bg-surface-muted', className)} role="progressbar" aria-valuenow={value} aria-valuemax={max}>
      <div className="h-full rounded-full bg-linear-to-r from-primary to-gold transition-all" style={{ width: `${percent}%` }} />
    </div>
  );
}

export function EmptyState({ icon, title, action, className }: { icon?: ReactNode; title: string; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-card bg-surface px-6 py-10 text-center text-ink-muted shadow-card', className)}>
      {icon ? <div className="text-4xl" aria-hidden>{icon}</div> : null}
      <p className="max-w-sm text-sm">{title}</p>
      {action}
    </div>
  );
}
