'use client';

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icons';
import type { IconName } from '@/components/icons';
import { Button, LoadingState } from '@/components/ui';

const navItems: Array<{ href: string; label: string; icon: IconName; adminOnly?: boolean }> = [
  { href: '/', label: 'Dashboard', icon: 'dashboard' },
  { href: '/inventory', label: 'Inventory', icon: 'supplies' },
  { href: '/pos', label: 'Sales', icon: 'appointments' },
  { href: '/repairs', label: 'Repairs', icon: 'clock' },
  { href: '/customers', label: 'Customers', icon: 'clients' },
  { href: '/suppliers', label: 'Suppliers', icon: 'suppliers' },
  { href: '/users', label: 'Staff', icon: 'users', adminOnly: true },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, isAdmin, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) window.location.replace('/login');
  }, [loading, user]);

  if (loading || !user) {
    return (
      <div className="min-h-dvh p-6">
        <LoadingState label="Checking your session…" />
      </div>
    );
  }

  const links = navItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="min-h-dvh bg-canvas pl-[72px] lg:pl-[264px]">
      <a href="#main-content" className="skip-link">Skip to content</a>

      <aside className="fixed inset-y-0 left-0 z-40 flex w-[72px] flex-col border-r border-line bg-surface lg:w-[264px]">
        <div className="flex h-[73px] shrink-0 items-center justify-center gap-3 px-2 lg:justify-start lg:px-6">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-on-accent">
            <Icon name="box" size={22} />
          </span>
          <div className="hidden min-w-0 lg:block">
            <p className="font-display text-lg font-semibold leading-tight text-ink">MobileShop</p>
            <p className="truncate text-xs uppercase tracking-widest text-ink/75">Shop management</p>
          </div>
        </div>

        <nav aria-label="Main navigation" className="flex flex-1 flex-col gap-1 overflow-y-auto p-2 lg:p-4">
          {links.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex min-h-11 items-center justify-center gap-3 rounded-xl px-2 text-sm font-medium transition-colors lg:justify-start lg:px-3',
                  active
                    ? 'bg-accent text-on-accent shadow-sm'
                    : 'text-ink/75 hover:bg-surface-muted hover:text-ink'
                )}
              >
                <Icon name={item.icon} size={20} className="shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-line p-2 lg:p-4">
          <div className="mb-2 flex justify-center lg:hidden">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-on-accent">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="mb-3 hidden items-center gap-3 rounded-xl bg-surface-muted p-3 lg:flex">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-on-accent">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
              <p className="text-xs capitalize text-ink/75">{user.role}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="mx-auto flex lg:mx-0 lg:h-11 lg:w-full lg:justify-start lg:px-3"
            leftIcon="logout"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => void logout()}
          >
            <span className="hidden lg:inline">Sign out</span>
          </Button>
        </div>
      </aside>

      <main id="main-content" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {children}
      </main>
    </div>
  );
}
