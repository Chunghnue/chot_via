'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { useTranslations } from 'use-intl';
import { cn } from '../lib/cn';
import { Avatar, Button, Chip } from './primitives';
import { FieldError, Label, Switch } from './form';
import { Sheet } from './overlay';

/** Nhãn + ô nhập + thông báo lỗi: bộ ba dùng ở mọi form của cả hai web. */
export function FormField({ label, htmlFor, error, className, children }: { label: string; htmlFor?: string; error?: string | undefined; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

/** Hàng nền xám có chữ bên trái và công tắc bên phải. */
export function SwitchField({ label, checked, onCheckedChange, id, className }: { label: string; checked: boolean; onCheckedChange: (value: boolean) => void; id?: string; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 rounded-2xl bg-surface-muted px-4 py-3', className)}>
      <Label htmlFor={id} className="mb-0">{label}</Label>
      <Switch id={id} label={label} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

/** Nội dung xác nhận (tiêu đề, mô tả, hai nút): dùng trong hộp xác nhận và trong khung có sẵn (ví dụ bỏ bản nháp). */
export function ConfirmPanel({ title, description, confirmLabel, cancelLabel, danger = true, onConfirm, onCancel }: { title: string; description?: string | undefined; confirmLabel: string; cancelLabel: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="flex flex-col gap-3 py-2">
      <h3 className="font-display text-xl font-bold">{title}</h3>
      {description ? <p className="text-sm text-ink-muted">{description}</p> : null}
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>{cancelLabel}</Button>
        <Button variant={danger ? 'danger' : 'primary'} className="flex-1" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </div>
  );
}

export interface ConfirmOptions { title: string; description?: string; confirmLabel?: string; danger?: boolean }
type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<ConfirmFn | null>(null);

interface Pending extends ConfirmOptions { resolve: (value: boolean) => void }

/** Thay hộp xác nhận mặc định của trình duyệt: `const confirm = useConfirm(); if (!(await confirm({ title }))) return;` */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const t = useTranslations('common');
  const [pending, setPending] = useState<Pending | null>(null);
  const confirm = useCallback<ConfirmFn>((options) => new Promise<boolean>((resolve) => { setPending({ ...options, resolve }); }), []);
  const settle = (value: boolean): void => { pending?.resolve(value); setPending(null); };
  const value = useMemo(() => confirm, [confirm]);
  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Sheet open={pending !== null} onOpenChange={(open) => { if (!open) settle(false); }} title={pending?.title ?? ''} hideTitle closeLabel={t('close')}>
        {pending ? (
          <ConfirmPanel
            title={pending.title} description={pending.description} danger={pending.danger ?? true}
            confirmLabel={pending.confirmLabel ?? t('confirm')} cancelLabel={t('cancel')}
            onConfirm={() => settle(true)} onCancel={() => settle(false)}
          />
        ) : null}
      </Sheet>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm cần nằm trong ConfirmProvider');
  return ctx;
}

export interface TabItem<K extends string> { key: K; label: ReactNode }
/**
 * Thanh tab dùng chung: `pill` (các viên chia đều), `underline` (gạch chân), `chips` (hàng chip cuộn ngang).
 * Luôn có role tablist/tab và aria-selected để trình đọc màn hình và test dùng được.
 */
export function Tabs<K extends string>({ items, value, onChange, variant = 'pill', size = 'md', label, className }: { items: readonly TabItem<K>[]; value: K; onChange: (key: K) => void; variant?: 'pill' | 'underline' | 'chips'; size?: 'sm' | 'md'; label?: string; className?: string }) {
  if (variant === 'chips') {
    return (
      <div role="tablist" aria-label={label} className={cn('flex gap-2 overflow-x-auto pb-0.5 scrollbar-none', className)}>
        {items.map((item) => <Chip key={item.key} active={value === item.key} role="tab" aria-selected={value === item.key} onClick={() => onChange(item.key)}>{item.label}</Chip>)}
      </div>
    );
  }
  const columns = { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` };
  return (
    <div role="tablist" aria-label={label} style={columns} className={cn('grid', variant === 'underline' ? 'border-b border-border' : 'gap-2', className)}>
      {items.map((item) => {
        const active = value === item.key;
        return (
          <button
            key={item.key} type="button" role="tab" aria-selected={active} onClick={() => onChange(item.key)}
            className={variant === 'underline'
              ? cn('h-12 border-b-4 text-sm font-bold sm:text-base', active ? 'border-primary text-primary-strong' : 'border-transparent text-ink')
              : cn('rounded-full border font-semibold transition', size === 'sm' ? 'h-9 text-sm' : 'h-11 text-base', active ? 'border-primary bg-primary text-on-primary shadow-card' : 'border-border bg-surface text-ink hover:bg-surface-muted')}
          >{item.label}</button>
        );
      })}
    </div>
  );
}

/** Tiêu đề khối (thẻ cột phải, khối trong trang): biểu tượng + tiêu đề, bên phải là liên kết/nút tùy chọn. */
export function SectionTitle({ icon, title, sub, action, as: Heading = 'h2', className }: { icon?: string | ReactNode; title: ReactNode; sub?: ReactNode; action?: ReactNode; as?: 'h2' | 'h3'; className?: string }) {
  return (
    <div className={cn('mb-3 flex items-center gap-2', className)}>
      {typeof icon === 'string' ? <img src={icon} alt="" aria-hidden className="size-8 shrink-0 object-contain" draggable={false} /> : icon}
      <div className="min-w-0">
        <Heading className="font-display text-xl font-extrabold leading-tight text-ink">{title}</Heading>
        {sub ? <p className="text-xs text-ink-muted">{sub}</p> : null}
      </div>
      {action ? <div className="ml-auto shrink-0">{action}</div> : null}
    </div>
  );
}

/** Nút chỉ có biểu tượng: bắt buộc có `label` (aria-label). */
export function IconButton({ label, className, children, type = 'button', ...rest }: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> & { label: string }) {
  return <button type={type} aria-label={label} className={cn('inline-flex size-10 shrink-0 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-muted active:scale-95 disabled:opacity-50', className)} {...rest}>{children}</button>;
}

const tileTones = {
  soft: ['border-primary bg-primary-soft', 'border-border bg-surface'],
  solid: ['border-primary bg-primary text-on-primary shadow-card', 'border-border bg-surface text-ink hover:bg-surface-muted'],
  outline: ['border-primary bg-surface', 'border-border bg-surface'],
} as const;

/** Ô chọn một giá trị (sticker, loại lời chúc...): viền/màu nền đổi khi được chọn. */
export function ToggleTile({ active, tone = 'soft', className, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean; tone?: keyof typeof tileTones }) {
  return <button type={type} aria-pressed={active} className={cn('rounded-xl border transition active:scale-[0.98]', tileTones[tone][active ? 0 : 1], className)} {...rest} />;
}

export const RANK_MEDALS = ['/images/ic-medal-1.webp', '/images/ic-medal-2.webp', '/images/ic-medal-3.webp'] as const;

/** Hàng xếp hạng: hạng (huy chương cho top 3) + ảnh đại diện + tên + số liệu. `render` cho phép app truyền Link riêng. */
export function RankRow({ rank, avatar, title, sub, value, valueClassName, highlight, rankLabel, render }: {
  rank: number; avatar: { src: string | null; name: string }; title: ReactNode; sub?: ReactNode; value: ReactNode; valueClassName?: string; highlight?: boolean; rankLabel?: string;
  render: (className: string, children: ReactNode) => ReactNode;
}) {
  const medal = RANK_MEDALS[rank - 1];
  return render(
    cn('flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition hover:bg-surface-muted', highlight && 'bg-primary-soft'),
    <>
      <span className="flex w-8 shrink-0 justify-center font-display text-lg font-extrabold text-ink-muted" aria-label={rankLabel}>
        {medal ? <img src={medal} alt="" aria-hidden className="size-8 object-contain" draggable={false} /> : rank}
      </span>
      <Avatar src={avatar.src} name={avatar.name} size={36} />
      <span className="min-w-0 flex-1"><span className="line-clamp-2 break-words text-[0.8rem] font-semibold leading-tight text-ink sm:text-sm">{title}</span>{sub}</span>
      <span className={cn('shrink-0 font-display text-base font-extrabold text-primary-strong', valueClassName)}>{value}</span>
    </>,
  );
}
