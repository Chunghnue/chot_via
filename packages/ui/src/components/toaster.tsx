import { Toaster as Sonner, toast } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      toastOptions={{ classNames: { toast: '!rounded-2xl !bg-surface !text-ink !shadow-pop !border-border !font-sans', error: '!text-danger', success: '!text-primary-strong' } }}
    />
  );
}

export { toast };
