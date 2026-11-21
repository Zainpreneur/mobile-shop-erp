'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api, apiErrorMessage } from '@/lib/api-client';
import type { Product, Purchase, Supplier } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast-provider';
import {
  Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Input, Label,
  LoadingState, Modal, PageHeader, Select, TableShell, Textarea, money,
} from '@/components/ui';

const emptyForm = { name: '', phone: '', email: '', address: '', notes: '' };

interface SupplierDetail extends Supplier {
  products: Product[];
  purchases: Purchase[];
}

export default function SuppliersPage() {
  const { isAdmin } = useAuth();
  const { notify } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[] | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [detail, setDetail] = useState<SupplierDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [restocking, setRestocking] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get<Supplier[]>('/suppliers', { params: { search } });
      setSuppliers(res.data);
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

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setForm({
      name: supplier.name,
      phone: supplier.phone ?? '',
      email: supplier.email ?? '',
      address: supplier.address ?? '',
      notes: supplier.notes ?? '',
    });
    setFormError('');
    setModalOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing) await api.put(`/suppliers/${editing.id}`, form);
      else await api.post('/suppliers', form);
      setModalOpen(false);
      notify(editing ? 'Supplier updated' : 'Supplier added', 'success');
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function openDetail(supplier: Supplier) {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await api.get<SupplierDetail>(`/suppliers/${supplier.id}`);
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
      await api.delete(`/suppliers/${deleting.id}`);
      setDeleting(null);
      notify('Supplier deleted', 'success');
      await load();
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Procurement" title="Suppliers" description="Manage vendors and record restocking purchases." actions={<Button leftIcon="plus" onClick={openCreate}>Add supplier</Button>} />

      <Card className="p-4">
        <Label htmlFor="supplier-search">Search</Label>
        <Input id="supplier-search" type="search" placeholder="Name, phone or email" value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!error && !suppliers ? <LoadingState /> : null}
      {suppliers && suppliers.length === 0 ? <Card><EmptyState title="No suppliers found" subtitle="Add a supplier to track who supplies your products." icon="suppliers" action={<Button onClick={openCreate}>Add supplier</Button>} /></Card> : null}

      {suppliers && suppliers.length > 0 ? (
        <TableShell label="Suppliers">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink/75">
              <tr><th scope="col" className="px-4 py-3">Name</th><th scope="col" className="px-4 py-3">Contact</th><th scope="col" className="px-4 py-3">Products</th><th scope="col" className="px-4 py-3 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-canvas">
                  <td className="px-4 py-3"><p className="font-medium">{supplier.name}</p><p className="text-xs text-ink/75">{supplier.address || '—'}</p></td>
                  <td className="px-4 py-3"><p>{supplier.phone || '—'}</p><p className="text-xs text-ink/75">{supplier.email || ''}</p></td>
                  <td className="px-4 py-3"><Badge value="PRODUCTS" label={String(supplier._count?.products ?? 0)} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => void openDetail(supplier)}>Details</Button>
                      <Button variant="ghost" size="sm" onClick={() => setRestocking(supplier)}>Restock</Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(supplier)}>Edit</Button>
                      {isAdmin ? <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDeleting(supplier)}>Delete</Button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      ) : null}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit supplier' : 'Add supplier'} width="max-w-xl">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label htmlFor="s-name">Name</Label><Input id="s-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label htmlFor="s-phone">Phone</Label><Input id="s-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label htmlFor="s-email">Email</Label><Input id="s-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label htmlFor="s-address">Address</Label><Input id="s-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label htmlFor="s-notes">Notes</Label><Textarea id="s-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
          {formError ? <p role="alert" className="text-sm text-danger">{formError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Add supplier'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={detailLoading || Boolean(detail)} onClose={() => setDetail(null)} title={detail?.name ?? 'Supplier details'} width="max-w-2xl">
        {detailLoading ? <LoadingState label="Loading supplier history…" /> : null}
        {detail ? (
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-ink">Products supplied</h3>
              {detail.products.length === 0 ? <p className="mt-2 text-sm text-ink/75">No linked products.</p> : (
                <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                  {detail.products.map((product) => <li key={product.id} className="flex justify-between gap-3 p-3 text-sm"><span>{product.name}</span><span className="text-ink/75">{product.quantity} in stock</span></li>)}
                </ul>
              )}
            </section>
            <section>
              <h3 className="text-sm font-semibold text-ink">Purchase history</h3>
              {detail.purchases.length === 0 ? <p className="mt-2 text-sm text-ink/75">No purchases recorded.</p> : (
                <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                  {detail.purchases.map((purchase) => <li key={purchase.id} className="flex justify-between gap-3 p-3 text-sm"><span>{new Date(purchase.createdAt).toLocaleDateString()} · {purchase.items?.length ?? 0} items</span><span className="font-semibold">{money(purchase.totalCost)}</span></li>)}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </Modal>

      <RestockModal supplier={restocking} onClose={() => setRestocking(null)} onSaved={load} />

      <ConfirmDialog open={Boolean(deleting)} title="Delete supplier" message={`Delete ${deleting?.name ?? 'this supplier'}?`} loading={deleteLoading} onConfirm={() => void confirmDelete()} onClose={() => setDeleting(null)} />
    </div>
  );
}

function RestockModal({ supplier, onClose, onSaved }: { supplier: Supplier | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const { notify } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [items, setItems] = useState<Array<{ productId: string; quantity: number; unitCost: number }>>([{ productId: '', quantity: 1, unitCost: 0 }]);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supplier) return;
    api.get<Product[]>('/products').then((res) => setProducts(res.data)).catch(() => undefined);
    setItems([{ productId: '', quantity: 1, unitCost: 0 }]);
    setNotes('');
    setError('');
  }, [supplier]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supplier) return;
    setSaving(true);
    setError('');
    try {
      await api.post(`/suppliers/${supplier.id}/purchases`, {
        notes,
        items: items.map((item) => ({ productId: Number(item.productId), quantity: Number(item.quantity), unitCost: Number(item.unitCost) })),
      });
      notify('Restock recorded', 'success');
      onClose();
      await onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);

  return (
    <Modal open={Boolean(supplier)} onClose={onClose} title={`Restock ${supplier?.name ?? ''}`} description="Add inventory and update product cost prices." width="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={index} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[minmax(0,1fr)_100px_120px_auto]">
              <Select aria-label={`Product ${index + 1}`} required value={item.productId} onChange={(e) => {
                const product = products.find((candidate) => candidate.id === Number(e.target.value));
                setItems((current) => current.map((entry, position) => position === index ? { ...entry, productId: e.target.value, unitCost: product?.costPrice ?? entry.unitCost } : entry));
              }}>
                <option value="">Select product</option>
                {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
              </Select>
              <Input aria-label={`Quantity ${index + 1}`} type="number" min="1" value={item.quantity} onChange={(e) => setItems((current) => current.map((entry, position) => position === index ? { ...entry, quantity: Number(e.target.value) } : entry))} />
              <Input aria-label={`Unit cost ${index + 1}`} type="number" min="0" step="0.01" value={item.unitCost} onChange={(e) => setItems((current) => current.map((entry, position) => position === index ? { ...entry, unitCost: Number(e.target.value) } : entry))} />
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove item ${index + 1}`} onClick={() => setItems((current) => current.filter((_, position) => position !== index))}><span className="text-danger">×</span></Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={() => setItems((current) => [...current, { productId: '', quantity: 1, unitCost: 0 }])}>Add line item</Button>
        <div><Label htmlFor="restock-notes">Notes</Label><Textarea id="restock-notes" value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        <p className="text-right text-sm font-semibold">Total cost: {money(total)}</p>
        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving} disabled={items.length === 0}>Record restock</Button>
        </div>
      </form>
    </Modal>
  );
}
