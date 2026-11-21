'use client';

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { api, apiErrorMessage } from '@/lib/api-client';
import type { Product, Supplier } from '@/lib/types';
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  Label,
  LoadingState,
  Modal,
  PageHeader,
  Select,
  TableShell,
  Textarea,
  money,
} from '@/components/ui';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast-provider';

const emptyForm = {
  name: '',
  brand: '',
  category: 'phone',
  sku: '',
  imei: '',
  costPrice: 0,
  sellingPrice: 0,
  quantity: 0,
  lowStockThreshold: 3,
  supplierId: '',
};

export default function InventoryPage() {
  const { isAdmin } = useAuth();
  const { notify } = useToast();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [lowStock, setLowStock] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const res = await api.get<Product[]>('/products', {
        params: { search, category, lowStock: lowStock ? 'true' : undefined },
      });
      setProducts(res.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }, [search, category, lowStock]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 250);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    api.get<Supplier[]>('/suppliers').then((res) => setSuppliers(res.data)).catch(() => undefined);
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setFormError('');
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      brand: product.brand ?? '',
      category: product.category,
      sku: product.sku,
      imei: product.imei ?? '',
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      lowStockThreshold: product.lowStockThreshold,
      supplierId: product.supplierId ? String(product.supplierId) : '',
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
        ...form,
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        quantity: Number(form.quantity),
        lowStockThreshold: Number(form.lowStockThreshold),
        supplierId: form.supplierId ? Number(form.supplierId) : null,
      };
      if (editing) await api.put(`/products/${editing.id}`, payload);
      else await api.post('/products', payload);
      setModalOpen(false);
      notify(editing ? 'Product updated' : 'Product added', 'success');
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/products/${deleting.id}`);
      setDeleting(null);
      notify('Product deleted', 'success');
      await load();
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalog"
        title="Inventory"
        description="Track phones, accessories, pricing and stock levels."
        actions={<Button leftIcon="plus" onClick={openCreate}>Add product</Button>}
      />

      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]">
          <div>
            <Label htmlFor="product-search">Search</Label>
            <Input id="product-search" type="search" placeholder="Name, brand, SKU or IMEI" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="product-category">Category</Label>
            <Select id="product-category" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              <option value="phone">Phones</option>
              <option value="accessory">Accessories</option>
            </Select>
          </div>
          <label className="flex min-h-11 items-end gap-2 pb-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-blue-600" checked={lowStock} onChange={(event) => setLowStock(event.target.checked)} />
            Low stock only
          </label>
        </div>
      </Card>

      {error ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {!error && !products ? <LoadingState /> : null}
      {products && products.length === 0 ? (
        <Card><EmptyState title="No products found" subtitle="Try adjusting your filters or add a new product." icon="box" action={<Button onClick={openCreate}>Add product</Button>} /></Card>
      ) : null}

      {products && products.length > 0 ? (
        <TableShell label="Products">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink/75">
              <tr>
                <th scope="col" className="px-4 py-3">Product</th><th scope="col" className="px-4 py-3">SKU / IMEI</th><th scope="col" className="px-4 py-3">Supplier</th>
                <th scope="col" className="px-4 py-3 text-right">Cost</th><th scope="col" className="px-4 py-3 text-right">Price</th>
                <th scope="col" className="px-4 py-3 text-right">Stock</th><th scope="col" className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-canvas">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{product.name}</p>
                    <p className="text-xs capitalize text-ink/75">{product.brand || '—'} · {product.category}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink/75"><p>{product.sku}</p><p>{product.imei || ''}</p></td>
                  <td className="px-4 py-3 text-ink/75">{product.supplier?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right">{money(product.costPrice)}</td>
                  <td className="px-4 py-3 text-right font-medium">{money(product.sellingPrice)}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge value={product.quantity <= product.lowStockThreshold ? 'LOW' : 'IN STOCK'} label={`${product.quantity}`} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(product)}>Edit</Button>
                      {isAdmin ? <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDeleting(product)}>Delete</Button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      ) : null}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit product' : 'Add product'} description="Product details and stock levels" width="max-w-2xl">
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><Label htmlFor="p-name">Name</Label><Input id="p-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label htmlFor="p-brand">Brand</Label><Input id="p-brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} /></div>
            <div>
              <Label htmlFor="p-category">Category</Label>
              <Select id="p-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="phone">Phone</option><option value="accessory">Accessory</option>
              </Select>
            </div>
            <div><Label htmlFor="p-sku">SKU</Label><Input id="p-sku" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
            <div><Label htmlFor="p-imei">IMEI (optional)</Label><Input id="p-imei" value={form.imei} onChange={(e) => setForm({ ...form, imei: e.target.value })} /></div>
            <div>
              <Label htmlFor="p-supplier">Supplier</Label>
              <Select id="p-supplier" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                <option value="">None</option>
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </Select>
            </div>
            <div><Label htmlFor="p-cost">Cost price</Label><Input id="p-cost" type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })} /></div>
            <div><Label htmlFor="p-price">Selling price</Label><Input id="p-price" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: Number(e.target.value) })} /></div>
            <div><Label htmlFor="p-quantity">Quantity</Label><Input id="p-quantity" type="number" min="0" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></div>
            <div><Label htmlFor="p-threshold">Low stock threshold</Label><Input id="p-threshold" type="number" min="0" value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: Number(e.target.value) })} /></div>
          </div>
          {formError ? <p role="alert" className="text-sm text-danger">{formError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Add product'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete product"
        message={`Delete ${deleting?.name ?? 'this product'}? This cannot be undone.`}
        loading={deleteLoading}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}
