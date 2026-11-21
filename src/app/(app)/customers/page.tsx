'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api, apiErrorMessage } from '@/lib/api-client';
import type { Customer, RepairTicket, Sale } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast-provider';
import {
  Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Input, Label,
  LoadingState, Modal, PageHeader, TableShell, Textarea, money,
} from '@/components/ui';

const emptyForm = { name: '', phone: '', email: '', address: '', notes: '' };

interface CustomerDetail extends Customer {
  sales: Sale[];
  repairs: RepairTicket[];
}

export default function CustomersPage() {
  const { isAdmin } = useAuth();
  const { notify } = useToast();
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get<Customer[]>('/customers', { params: { search } });
      setCustomers(res.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setForm({
      name: customer.name,
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      address: customer.address ?? '',
      notes: customer.notes ?? '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing) await api.put(`/customers/${editing.id}`, form);
      else await api.post('/customers', form);
      setModalOpen(false);
      notify(editing ? 'Customer updated' : 'Customer added', 'success');
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function openDetail(customer: Customer) {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await api.get<CustomerDetail>(`/customers/${customer.id}`);
      setDetail(res.data);
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setDetailLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/customers/${deleting.id}`);
      setDeleting(null);
      notify('Customer deleted', 'success');
      await load();
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Relationships" title="Customers" description="Keep customer details, purchases and repair history together." actions={<Button leftIcon="plus" onClick={openCreate}>Add customer</Button>} />

      <Card className="p-4">
        <Label htmlFor="customer-search">Search</Label>
        <Input id="customer-search" type="search" placeholder="Name, phone or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!error && !customers ? <LoadingState /> : null}
      {customers && customers.length === 0 ? <Card><EmptyState title="No customers found" subtitle="Add a customer to keep track of their purchases and repairs." icon="clients" action={<Button onClick={openCreate}>Add customer</Button>} /></Card> : null}

      {customers && customers.length > 0 ? (
        <TableShell label="Customers">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink/75">
              <tr><th scope="col" className="px-4 py-3">Name</th><th scope="col" className="px-4 py-3">Phone</th><th scope="col" className="px-4 py-3">Email</th><th scope="col" className="px-4 py-3">Activity</th><th scope="col" className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-canvas">
                  <td className="px-4 py-3"><p className="font-medium">{customer.name}</p><p className="text-xs text-ink/75">{new Date(customer.createdAt).toLocaleDateString()}</p></td>
                  <td className="px-4 py-3">{customer.phone || '—'}</td>
                  <td className="px-4 py-3">{customer.email || '—'}</td>
                  <td className="px-4 py-3 text-xs text-ink/75">
                    {customer._count ? <span>{customer._count.sales} sales · {customer._count.repairs} repairs</span> : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => void openDetail(customer)}>Details</Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(customer)}>Edit</Button>
                      {isAdmin ? <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDeleting(customer)}>Delete</Button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      ) : null}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit customer' : 'Add customer'} width="max-w-xl">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label htmlFor="c-name">Name</Label><Input id="c-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label htmlFor="c-phone">Phone</Label><Input id="c-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label htmlFor="c-email">Email</Label><Input id="c-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label htmlFor="c-address">Address</Label><Input id="c-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label htmlFor="c-notes">Notes</Label><Textarea id="c-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          {formError ? <p role="alert" className="text-sm text-danger">{formError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Add customer'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={detailLoading || Boolean(detail)} onClose={() => setDetail(null)} title={detail?.name ?? 'Customer details'} description={detail ? [detail.phone, detail.email].filter(Boolean).join(' · ') : undefined} width="max-w-2xl">
        {detailLoading ? <LoadingState label="Loading customer history…" /> : null}
        {detail ? (
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-ink">Purchase history</h3>
              {detail.sales.length === 0 ? <p className="mt-2 text-sm text-ink/75">No sales recorded.</p> : (
                <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                  {detail.sales.map((sale) => <li key={sale.id} className="flex items-center justify-between gap-3 p-3 text-sm"><span>{sale.invoiceNumber}<span className="ml-2 text-xs text-ink/75">{new Date(sale.createdAt).toLocaleDateString()}</span></span><span className="flex items-center gap-3"><Badge value={sale.status.toUpperCase()} />{money(sale.total)}</span></li>)}
                </ul>
              )}
            </section>
            <section>
              <h3 className="text-sm font-semibold text-ink">Repair history</h3>
              {detail.repairs.length === 0 ? <p className="mt-2 text-sm text-ink/75">No repair tickets.</p> : (
                <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                  {detail.repairs.map((repair) => <li key={repair.id} className="flex items-center justify-between gap-3 p-3 text-sm"><span>{repair.ticketNumber} · {[repair.deviceBrand, repair.deviceModel].filter(Boolean).join(' ')}</span><Badge value={repair.status.toUpperCase()} /></li>)}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog open={Boolean(deleting)} title="Delete customer" message={`Delete ${deleting?.name ?? 'this customer'}?`} loading={deleteLoading} onConfirm={() => void confirmDelete()} onClose={() => setDeleting(null)} />
    </div>
  );
}
