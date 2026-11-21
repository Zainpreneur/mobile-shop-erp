'use client';

import { useEffect, useId, useRef } from 'react';
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import clsx from 'clsx';
import { Icon } from '@/components/icons';
import type { IconName } from '@/components/icons';

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <div className={clsx('inline-flex items-center gap-2 text-accent', className)} role="status" aria-live="polite">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function Card({ children, className, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-line bg-surface shadow-sm',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'icon';
  loading?: boolean;
  leftIcon?: IconName;
  rightIcon?: IconName;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const styles = {
    primary: 'bg-accent text-on-accent shadow-sm hover:bg-accent-strong active:bg-accent-strong/90',
    secondary: 'bg-surface-muted text-ink hover:bg-surface-hover active:bg-surface-hover/80',
    danger: 'bg-red-600 text-on-accent shadow-sm hover:bg-red-700 active:bg-red-700/90',
    ghost: 'bg-transparent text-accent hover:bg-surface-muted active:bg-surface-hover',
  };
  const sizes = {
    sm: 'min-h-11 gap-1.5 rounded-lg px-2.5 py-1.5 text-xs sm:min-h-9',
    md: 'min-h-11 gap-2 rounded-xl px-4 py-2 text-sm',
    icon: 'h-11 w-11 rounded-xl p-0 sm:h-10 sm:w-10',
  };

  return (
    <button
      className={clsx(
        'inline-flex shrink-0 items-center justify-center font-medium transition-all duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none',
        'active:scale-[0.98] motion-reduce:active:scale-100',
        styles[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="[&>span:first-child]:h-4 [&>span:first-child]:w-4" /> : null}
      {!loading && leftIcon ? <Icon name={leftIcon} size={size === 'sm' ? 14 : 16} /> : null}
      {children}
      {!loading && rightIcon ? <Icon name={rightIcon} size={size === 'sm' ? 14 : 16} /> : null}
    </button>
  );
}

const fieldStyles =
  'w-full min-h-11 rounded-xl border border-line bg-surface px-3 py-2 text-base text-ink transition placeholder:text-ink/75 hover:border-line-strong focus:border-focus focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus/50 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink/75 sm:text-sm';

export function Input({ className, invalid, ...props }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={clsx(fieldStyles, invalid && 'border-red-400', className)} aria-invalid={invalid || undefined} {...props} />;
}

export function Select({
  className,
  children,
  invalid,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      className={clsx(fieldStyles, 'cursor-pointer pr-8', invalid && 'border-red-400', className)}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  );
}

export function Textarea({
  className,
  invalid,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      className={clsx(fieldStyles, 'min-h-24 resize-y', invalid && 'border-red-400', className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}

export function Label({
  children,
  htmlFor,
  hint,
  error,
  className,
}: {
  children: ReactNode;
  htmlFor?: string;
  hint?: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={clsx('mb-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-wide text-ink/75">
        {children}
      </label>
      {hint && !error ? <p className="mt-1 text-xs leading-4 text-ink/75">{hint}</p> : null}
      {error ? (
        <p className="mt-1 flex items-center gap-1 text-xs font-medium text-danger">
          <Icon name="alert" size={12} />
          {error}
        </p>
      ) : null}
    </div>
  );
}

const badgeColors: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-800 ring-amber-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 ring-blue-200',
  CONFIRMED: 'bg-purple-100 text-purple-800 ring-purple-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  CANCELLED: 'bg-red-100 text-red-800 ring-red-200',
  PAID: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  PARTIAL: 'bg-amber-100 text-amber-800 ring-amber-200',
  UNPAID: 'bg-red-100 text-red-800 ring-red-200',
  default: 'bg-surface-hover text-ink ring-line',
};

export function Badge({ value, label }: { value: string; label?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        badgeColors[value] ?? badgeColors.default
      )}
    >
      {label ?? value.replace(/_/g, ' ')}
    </span>
  );
}

export function EmptyState({
  title,
  subtitle,
  icon = 'box',
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: IconName;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
      <div className="rounded-2xl bg-surface-muted p-3 text-accent">
        <Icon name={icon} size={24} />
      </div>
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {subtitle ? <p className="max-w-sm text-sm leading-6 text-ink/75">{subtitle}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = 'Loading your data…' }: { label?: string }) {
  return (
    <div
      className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface p-8 text-center"
      role="status"
      aria-live="polite"
    >
      <Spinner />
      <p className="text-sm font-medium text-ink/75">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry, title = 'We couldn’t load this' }: { message: string; onRetry?: () => void; title?: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-danger-line bg-danger-soft/50 p-8 text-center" role="alert">
      <div className="rounded-2xl bg-red-100 p-3 text-red-700">
        <Icon name="alert" size={24} />
      </div>
      <div>
        <p className="font-display text-base font-semibold text-ink">{title}</p>
        <p className="mt-1 max-w-md text-sm text-ink/75">{message}</p>
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" leftIcon="refresh" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('animate-pulse rounded-xl bg-surface-hover/70 motion-reduce:animate-none', className)} />;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
        ) : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm leading-6 text-ink/75">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function TableShell({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={clsx('overflow-hidden', className)}>
      <div
        className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-focus/50"
        role="region"
        aria-label={label}
        tabIndex={0}
      >
        {children}
      </div>
    </Card>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent = 'amber',
  icon,
  trend,
  trendDirection = 'up',
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: 'amber' | 'green' | 'red' | 'blue';
  icon?: IconName;
  trend?: string;
  trendDirection?: 'up' | 'down';
}) {
  const accents: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-700',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-sky-100 text-sky-700',
  };

  return (
    <Card className="p-4 transition-shadow hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/75">{label}</p>
        {icon ? (
          <span className={clsx('rounded-xl p-2', accents[accent])}>
            <Icon name={icon} size={18} />
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink sm:text-[26px]">{value}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink/75">
        {sub ? <span>{sub}</span> : null}
        {trend ? (
          <span
            className={clsx(
              'inline-flex items-center gap-1 font-semibold',
              trendDirection === 'up' ? 'text-emerald-700' : 'text-danger'
            )}
          >
            <Icon name={trendDirection === 'up' ? 'trendingUp' : 'trendingDown'} size={12} />
            {trend}
          </span>
        ) : null}
      </div>
    </Card>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  width?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      requestAnimationFrame(() => titleRef.current?.focus());
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }

    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className={clsx(
        'app-dialog w-[calc(100%_-_2rem)] rounded-3xl border border-line bg-surface p-0 text-ink shadow-2xl',
        width
      )}
    >
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <h3 id={titleId} ref={titleRef} tabIndex={-1} className="font-display text-lg font-semibold outline-none sm:text-xl">
              {title}
            </h3>
            {description ? (
              <p id={descriptionId} className="mt-1 text-sm text-ink/75">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1 -mt-1 text-ink/75"
          >
            <Icon name="close" size={18} />
          </Button>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
      </div>
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  tone = 'danger',
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-md">
      <div className="space-y-6">
        <p className="text-sm leading-6 text-ink/75">{message}</p>
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" variant={tone} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function money(n: number | undefined | null) {
  return currency.format(n ?? 0);
}
