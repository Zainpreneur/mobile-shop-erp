'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api, apiErrorMessage } from '@/lib/api-client';
import type { Customer, RepairTicket } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast-provider';
import {
  Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Input, Label,
  LoadingState, Modal, PageHeader, Select, TableShell, Textarea, money,
} from '@/components/ui';

const STATUSES = ['pending', 'in_progress', 'completed', 'delivered', 'cancelled'] as const;
const emptyForm = {
  customerId: '', deviceBrand: '', deviceModel: '', issueDescription: '',
  status: 'pending', estimatedCost: '', actualCost: '', technician: '', notes: '',
};

export default function RepairsPage() {
  const { isAdmin } = useAuth();
  const { notify } = useToast();
  const [repairs, setRepairs] = useState<RepairTicket[] | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RepairTicket | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<RepairTicket | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get<RepairTicket[]>('/repairs', { params: { search, status } });
      setRepairs(res.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }, [search, status]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    api.get<Customer[]>('/customers').then((res) => setCustomers(res.data)).catch(() => undefined);
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(repair: RepairTicket) {
    setEditing(repair);
    setForm({
      customerId: repair.customerId ? String(repair.customerId) : '',
      deviceBrand: repair.deviceBrand ?? '',
      deviceModel: repair.deviceModel ?? '',
      issueDescription: repair.issueDescription,
      status: repair.status,
      estimatedCost: repair.estimatedCost === null ? '' : String(repair.estimatedCost),
      actualCost: repair.actualCost === null ? '' : String(repair.actualCost),
      technician: repair.technician ?? '',
      notes: repair.notes ?? '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        customerId: form.customerId ? Number(form.customerId) : null,
        deviceBrand: form.deviceBrand,
        deviceModel: form.deviceModel,
        issueDescription: form.issueDescription,
        status: form.status,
        estimatedCost: form.estimatedCost === '' ? null : Number(form.estimatedCost),
        actualCost: form.actualCost === '' ? null : Number(form.actualCost),
        technician: form.technician,
        notes: form.notes,
      };
      if (editing) await api.patch(`/repairs/${editing.id}`, payload);
      else await api.post('/repairs', payload);
      setModalOpen(false);
      notify(editing ? 'Repair updated' : 'Repair ticket created', 'success');
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(repair: RepairTicket, nextStatus: string) {
    try {
      await api.patch(`/repairs/${repair.id}`, { status: nextStatus });
      await load();
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/repairs/${deleting.id}`);
      setDeleting(null);
      notify('Repair ticket deleted', 'success');
      await load();
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Service desk" title="Repairs" description="Track device repairs from drop-off to delivery." actions={<Button leftIcon="plus" onClick={openCreate}>New ticket</Button>} />

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
          <div><Label htmlFor="repair-search">Search</Label><Input id="repair-search" type="search" placeholder="Ticket, device or issue" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
          <div>
            <Label htmlFor="repair-status">Status</Label>
            <Select id="repair-status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {STATUSES.map((value) => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}
            </Select>
          </div>
        </div>
      </Card>

      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!error && !repairs ? <LoadingState /> : null}
      {repairs && repairs.length === 0 ? <Card><EmptyState title="No repair tickets found" subtitle="Create a ticket to start tracking a device repair." icon="clock" action={<Button onClick={openCreate}>New ticket</Button>} /></Card> : null}

      {repairs && repairs.length > 0 ? (
        <TableShell label="Repair tickets">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink/75">
              <tr><th scope="col" className="px-4 py-3">Ticket</th><th scope="col" className="px-4 py-3">Customer</th><th scope="col" className="px-4 py-3">Device</th><th scope="col" className="px-4 py-3">Issue</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3 text-right">Estimate</th><th scope="col" className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {repairs.map((repair) => (
                <tr key={repair.id} className="hover:bg-canvas">
                  <td className="px-4 py-3 font-medium">{repair.ticketNumber}<p className="text-xs font-normal text-ink/75">{new Date(repair.receivedAt).toLocaleDateString()}</p></td>
                  <td className="px-4 py-3">{repair.customer?.name ?? '—'}</td>
                  <td className="px-4 py-3">{[repair.deviceBrand, repair.deviceModel].filter(Boolean).join(' ') || '—'}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-ink/75">{repair.issueDescription}</td>
                  <td className="px-4 py-3">
                    <Select aria-label={`Status for ${repair.ticketNumber}`} value={repair.status} onChange={(e) => void changeStatus(repair, e.target.value)} className="min-h-11 py-1 text-xs sm:min-h-9">
                      {STATUSES.map((value) => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}
                    </Select>
                  </td>
                  <td className="px-4 py-3 text-right">{repair.estimatedCost === null ? '—' : money(repair.estimatedCost)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(repair)}>Edit</Button>
                      {isAdmin ? <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDeleting(repair)}>Delete</Button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      ) : null}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit repair ticket' : 'New repair ticket'} width="max-w-2xl">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="r-customer">Customer</Label>
              <Select id="r-customer" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}>
                <option value="">Walk-in customer</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
              </Select>
            </div>
            <div><Label htmlFor="r-brand">Device brand</Label><Input id="r-brand" value={form.deviceBrand} onChange={(e) => setForm({ ...form, deviceBrand: e.target.value })} /></div>
            <div><Label htmlFor="r-model">Device model</Label><Input id="r-model" value={form.deviceModel} onChange={(e) => setForm({ ...form, deviceModel: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label htmlFor="r-issue">Issue description</Label><Textarea id="r-issue" required value={form.issueDescription} onChange={(e) => setForm({ ...form, issueDescription: e.target.value })} /></div>
            <div>
              <Label htmlFor="r-status">Status</Label>
              <Select id="r-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((value) => <option key={value} value={value}>{value.replace('_', ' ')}</option>)}
              </Select>
            </div>
            <div><Label htmlFor="r-technician">Technician</Label><Input id="r-technician" value={form.technician} onChange={(e) => setForm({ ...form, technician: e.target.value })} /></div>
            <div><Label htmlFor="r-estimated">Estimated cost</Label><Input id="r-estimated" type="number" min="0" step="0.01" value={form.estimatedCost} onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })} /></div>
            <div><Label htmlFor="r-actual">Actual cost</Label><Input id="r-actual" type="number" min="0" step="0.01" value={form.actualCost} onChange={(e) => setForm({ ...form, actualCost: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label htmlFor="r-notes">Notes</Label><Textarea id="r-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          {formError ? <p role="alert" className="text-sm text-danger">{formError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Create ticket'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={Boolean(deleting)} title="Delete repair ticket" message={`Delete ${deleting?.ticketNumber ?? 'this ticket'}?`} loading={deleteLoading} onConfirm={() => void confirmDelete()} onClose={() => setDeleting(null)} />
    </div>
  );
}
