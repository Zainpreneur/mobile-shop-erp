'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { Icon } from '@/components/icons';
import { Button, Card, Input, Label } from '@/components/ui';
import { apiErrorMessage } from '@/lib/api-client';

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('admin@mobileshop.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [loading, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/');
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  function useDemoAccount(role: 'admin' | 'staff') {
    setError('');
    if (role === 'admin') {
      setEmail('admin@mobileshop.com');
      setPassword('admin123');
    } else {
      setEmail('staff@mobileshop.com');
      setPassword('staff123');
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-surface-muted px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent text-on-accent shadow-lg">
            <Icon name="box" size={28} />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink-strong">MobileShop</h1>
          <p className="mt-1 text-sm text-ink/75">Sign in to manage your shop</p>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate aria-describedby={error ? 'login-error' : undefined}>
            <div>
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="pr-12"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-ink/75 transition hover:text-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </div>
            {error ? (
              <p id="login-error" role="alert" className="flex items-center gap-2 rounded-xl bg-danger-soft px-3 py-2 text-sm text-danger">
                <Icon name="alert" size={16} />
                {error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" loading={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-surface-muted p-4">
            <p className="text-xs font-semibold text-ink">Demo accounts</p>
            <p className="mt-1 text-xs leading-5 text-ink/75">Fill a demo account to try the app.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => useDemoAccount('admin')}>
                Use admin demo
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => useDemoAccount('staff')}>
                Use staff demo
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
