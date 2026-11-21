'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api, apiErrorMessage } from '@/lib/api-client';
import type { AuthUser } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast-provider';
import {
  Badge, Button, Card, EmptyState, ErrorState, Input, Label, LoadingState,
  Modal, PageHeader, Select, TableShell,
} from '@/components/ui';

const emptyForm = { name: '', email: '', password: '', role: 'staff' };

export default function UsersPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { notify } = useToast();
  const [users, setUsers] = useState<AuthUser[] | null>(null);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setError('');
    try {
      const res = await api.get<AuthUser[]>('/auth/users');
      setUsers(res.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  };

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin]);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await api.post('/auth/users', form);
      setModalOpen(false);
      setForm({ ...emptyForm });
      notify('Staff user created', 'success');
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function patchUser(user: AuthUser, data: { role?: string; active?: boolean }) {
    try {
      await api.patch(`/auth/users/${user.id}`, data);
      await load();
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    }
  }

  if (!authLoading && !isAdmin) {
    return <ErrorState title="Admin access required" message="Only administrators can manage staff accounts." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Administration" title="Staff Users" description="Create accounts and control access to the shop." actions={<Button leftIcon="plus" onClick={() => setModalOpen(true)}>Add user</Button>} />

      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!error && !users ? <LoadingState /> : null}
      {users && users.length === 0 ? <Card><EmptyState title="No staff users" icon="users" /></Card> : null}

      {users && users.length > 0 ? (
        <TableShell label="Staff users">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink/75">
              <tr><th scope="col" className="px-4 py-3">Name</th><th scope="col" className="px-4 py-3">Email</th><th scope="col" className="px-4 py-3">Role</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-canvas">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <Select aria-label={`Role for ${user.name}`} value={user.role} onChange={(e) => void patchUser(user, { role: e.target.value })} className="min-h-11 py-1 text-xs sm:min-h-9">
                      <option value="staff">Staff</option><option value="admin">Admin</option>
                    </Select>
                  </td>
                  <td className="px-4 py-3"><Badge value={user.active ? 'ACTIVE' : 'DISABLED'} /></td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => void patchUser(user, { active: !user.active })}>
                      {user.active ? 'Disable' : 'Enable'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      ) : null}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add staff user" width="max-w-xl">
        <form onSubmit={createUser} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label htmlFor="u-name">Name</Label><Input id="u-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label htmlFor="u-email">Email</Label><Input id="u-email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><Label htmlFor="u-password">Password</Label><Input id="u-password" type="password" minLength={6} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div>
              <Label htmlFor="u-role">Role</Label>
              <Select id="u-role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="staff">Staff</option><option value="admin">Admin</option>
              </Select>
            </div>
          </div>
          {formError ? <p role="alert" className="text-sm text-danger">{formError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>Create user</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
