import * as DialogPrimitive from '@radix-ui/react-dialog';
import * as DropdownPrimitive from '@radix-ui/react-dropdown-menu';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  closeLabel: string;
  description?: string;
  children: ReactNode;
  /** wide = popup rộng hơn trên màn lớn (Phố 3D, soạn bài). */
  size?: 'md' | 'lg';
  hideTitle?: boolean;
  tone?: 'plain' | 'wish';
  /** Chặn đóng khi bấm nền (dùng khi có bản nháp cần xác nhận). */
  onInteractOutside?: (event: Event) => void;
}

/** Bottom sheet trên điện thoại, popup giữa màn hình từ iPad trở lên (SRS mục 9). */
export function Sheet({ open, onOpenChange, title, closeLabel, description, children, size = 'md', hideTitle, tone = 'plain', onInteractOutside }: SheetProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 animate-fade-in bg-overlay" />
        <DialogPrimitive.Content
          onInteractOutside={onInteractOutside}
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            'fixed z-50 flex max-h-[92dvh] flex-col overflow-hidden bg-surface shadow-pop outline-none',
            'inset-x-0 bottom-0 animate-sheet-up rounded-t-sheet',
            'md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:animate-pop-in md:rounded-sheet md:max-h-[90dvh]',
            size === 'md' ? 'md:w-[min(92vw,34rem)]' : 'md:w-[min(92vw,44rem)]',
            tone === 'wish' && 'bg-linear-to-b from-wish-soft via-surface to-surface',
          )}
        >
          <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-4">
            <DialogPrimitive.Title className={cn('font-display text-2xl font-extrabold text-ink', hideTitle && 'sr-only')}>{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted" aria-label={closeLabel}>
              <X className="size-5" aria-hidden />
            </DialogPrimitive.Close>
          </div>
          {description ? <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description> : null}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function Popover({ trigger, children, className, align = 'start' }: { trigger: ReactNode; children: ReactNode; className?: string; align?: 'start' | 'center' | 'end' }) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content align={align} sideOffset={8} className={cn('z-50 animate-pop-in rounded-2xl bg-surface p-2 shadow-pop outline-none', className)}>
          {children}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export const PopoverClose = PopoverPrimitive.Close;

export interface MenuItem { key: string; label: string; onSelect: () => void; danger?: boolean; icon?: ReactNode }

export function Menu({ trigger, items, label }: { trigger: ReactNode; items: MenuItem[]; label: string }) {
  return (
    <DropdownPrimitive.Root>
      <DropdownPrimitive.Trigger asChild aria-label={label}>{trigger}</DropdownPrimitive.Trigger>
      <DropdownPrimitive.Portal>
        <DropdownPrimitive.Content align="end" sideOffset={6} className="z-50 min-w-48 animate-pop-in rounded-2xl bg-surface p-1.5 shadow-pop">
          {items.map((item) => (
            <DropdownPrimitive.Item
              key={item.key} onSelect={item.onSelect}
              className={cn('flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium outline-none data-[highlighted]:bg-surface-muted', item.danger ? 'text-danger' : 'text-ink')}
            >
              {item.icon}
              {item.label}
            </DropdownPrimitive.Item>
          ))}
        </DropdownPrimitive.Content>
      </DropdownPrimitive.Portal>
    </DropdownPrimitive.Root>
  );
}
