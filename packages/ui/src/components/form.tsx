import * as SwitchPrimitive from '@radix-ui/react-switch';
import type { InputHTMLAttributes, LabelHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { localizeValidationMessage } from '@chot-via/shared';
import { cn } from '../lib/cn';

const fieldBase =
  'w-full rounded-2xl border border-border bg-surface px-4 text-base text-ink placeholder:text-ink-subtle transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft aria-[invalid=true]:border-danger';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(fieldBase, 'h-12', className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(fieldBase, 'min-h-28 resize-y py-3', className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...rest }, ref) {
  return <select ref={ref} className={cn(fieldBase, 'select-arrow h-12', className)} {...rest} />;
});

export function Label({ className, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-sm font-semibold text-ink', className)} {...rest} />;
}

export function FieldError({ message }: { message?: string | undefined }) {
  const shown = localizeValidationMessage(message);
  return shown ? <p role="alert" className="mt-1 text-sm text-danger">{shown}</p> : null;
}

/** Một lựa chọn trong nhóm chọn một (radio) dạng thẻ viền; chọn thì viền và nền màu chính. */
export function RadioOption({
  checked,
  onChange,
  disabled,
  name,
  children,
  className,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  name?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium',
        checked ? 'border-primary bg-primary-soft' : 'border-border',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <input type="radio" name={name} checked={checked} disabled={disabled} onChange={onChange} className="accent-primary" />
      {children}
    </label>
  );
}

export function Switch({ checked, onCheckedChange, label, id }: { checked: boolean; onCheckedChange: (value: boolean) => void; label: string; id?: string }) {
  return (
    <SwitchPrimitive.Root
      id={id} checked={checked === true} onCheckedChange={onCheckedChange} aria-label={label}
      className="relative h-7 w-12 shrink-0 rounded-full bg-border transition data-[state=checked]:bg-primary-bright"
    >
      <SwitchPrimitive.Thumb className="block size-6 translate-x-0.5 rounded-full bg-surface shadow transition data-[state=checked]:translate-x-[22px]" />
    </SwitchPrimitive.Root>
  );
}
