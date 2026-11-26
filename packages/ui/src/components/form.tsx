import * as SwitchPrimitive from '@radix-ui/react-switch';
import type { InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { localizeValidationMessage } from '@chot-via/shared';
import { cn } from '../lib/cn';

const fieldBase = 'w-full rounded-2xl border border-border bg-surface px-4 text-base text-ink placeholder:text-ink-subtle transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft aria-[invalid=true]:border-danger';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cn(fieldBase, 'h-12', className)} {...rest} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cn(fieldBase, 'min-h-28 resize-y py-3', className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...rest }, ref) {
  return <select ref={ref} className={cn(fieldBase, 'h-12 appearance-auto pr-3', className)} {...rest} />;
});

export function Label({ className, ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-sm font-semibold text-ink', className)} {...rest} />;
}

export function FieldError({ message }: { message?: string | undefined }) {
  const shown = localizeValidationMessage(message);
  return shown ? <p role="alert" className="mt-1 text-sm text-danger">{shown}</p> : null;
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
