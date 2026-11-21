'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { api, apiErrorMessage } from '@/lib/api-client';
import type { Customer, Product, Sale } from '@/lib/types';
import { useAuth } from '@/components/auth-provider';
import { useToast } from '@/components/toast-provider';
import {
  Badge, Button, Card, ConfirmDialog, EmptyState, ErrorState, Input, Label,
  LoadingState, PageHeader, Select, TableShell, money,
} from '@/components/ui';

interface CartLine {
  productId: number;
  name: string;
  sellingPrice: number;
  quantity: number;
  stock: number;
}

export default function PosPage() {
  const { isAdmin } = useAuth();
  const { notify } = useToast();
  const [tab, setTab] = useState<'checkout' | 'history'>('checkout');
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successInvoice, setSuccessInvoice] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [refunding, setRefunding] = useState<Sale | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      const res = await api.get<Product[]>('/products', { params: { search } });
      setProducts(res.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => void loadProducts(), 200);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  useEffect(() => {
    api.get<Customer[]>('/customers').then((res) => setCustomers(res.data)).catch(() => undefined);
  }, []);

  const loadSales = useCallback(async () => {
    setError('');
    setSales(null);
    try {
      const res = await api.get<Sale[]>('/sales');
      setSales(res.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    if (tab === 'history') void loadSales();
  }, [tab, loadSales]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0), [cart]);
  const total = Math.max(0, subtotal - discount + tax);

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.quantity) } : item
        );
      }
      return [...current, { productId: product.id, name: product.name, sellingPrice: product.sellingPrice, quantity: 1, stock: product.quantity }];
    });
  }

  function setQuantity(productId: number, quantity: number) {
    setCart((current) =>
      current
        .map((item) => item.productId === productId ? { ...item, quantity: Math.max(0, Math.min(quantity, item.stock)) } : item)
        .filter((item) => item.quantity > 0)
    );
  }

  async function checkout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cart.length === 0) {
      setError('Add at least one product to the cart.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccessInvoice('');
    try {
      const res = await api.post<Sale>('/sales', {
        customerId: customerId ? Number(customerId) : null,
        discount,
        tax,
        paymentMethod,
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity, unitPrice: item.sellingPrice })),
      });
      setSuccessInvoice(res.data.invoiceNumber);
      setCart([]);
      setDiscount(0);
      setTax(0);
      setCustomerId('');
      notify('Sale recorded', 'success');
      void loadProducts();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmRefund() {
    if (!refunding) return;
    setRefundLoading(true);
    try {
      await api.post(`/sales/${refunding.id}/refund`);
      setRefunding(null);
      notify('Sale refunded and stock restored', 'success');
      await loadSales();
      void loadProducts();
    } catch (err) {
      notify(apiErrorMessage(err), 'error');
    } finally {
      setRefundLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Point of sale"
        title="POS & Sales"
        description="Build a cart, check out customers and review sales history."
        actions={
          <div className="inline-flex rounded-xl bg-surface-muted p-1" role="tablist" aria-label="POS sections">
            <button type="button" role="tab" id="pos-tab-checkout" aria-controls="pos-panel-checkout" aria-selected={tab === 'checkout'} onClick={() => setTab('checkout')} className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium sm:min-h-9 ${tab === 'checkout' ? 'bg-surface text-ink shadow-sm' : 'text-ink/75'}`}>Checkout</button>
            <button type="button" role="tab" id="pos-tab-history" aria-controls="pos-panel-history" aria-selected={tab === 'history'} onClick={() => setTab('history')} className={`min-h-11 rounded-lg px-3 py-2 text-sm font-medium sm:min-h-9 ${tab === 'history' ? 'bg-surface text-ink shadow-sm' : 'text-ink/75'}`}>Sales history</button>
          </div>
        }
      />

      {error ? <ErrorState message={error} onRetry={() => void (tab === 'checkout' ? loadProducts() : loadSales())} /> : null}

      {tab === 'checkout' ? (
        <div id="pos-panel-checkout" role="tabpanel" aria-labelledby="pos-tab-checkout" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Card className="p-5">
            <h2 className="font-display text-base font-semibold">Products</h2>
            <div className="mt-4">
              <Label htmlFor="pos-search">Search products</Label>
              <Input id="pos-search" type="search" placeholder="Search by name, SKU or IMEI" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            {loading ? <div className="mt-6"><LoadingState label="Loading products…" /></div> : null}
            {!loading && products.length === 0 ? <div className="mt-4"><EmptyState title="No products found" icon="search" /></div> : null}
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  disabled={product.quantity === 0}
                  onClick={() => addToCart(product)}
                  className="rounded-xl border border-line p-3 text-left transition hover:border-accent hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="mt-1 text-xs text-ink/75">SKU {product.sku}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold text-accent">{money(product.sellingPrice)}</span>
                    <Badge value={product.quantity > 0 ? 'IN STOCK' : 'LOW'} label={`${product.quantity} left`} />
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-base font-semibold">Current sale</h2>
            <form onSubmit={checkout} className="mt-4 space-y-4">
              <div>
                <Label htmlFor="sale-customer">Customer (optional)</Label>
                <Select id="sale-customer" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Walk-in customer</option>
                  {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                </Select>
              </div>

              {cart.length === 0 ? (
                <p className="rounded-xl bg-surface-muted p-4 text-sm text-ink/75">Select products to build the cart.</p>
              ) : (
                <ul className="divide-y divide-line rounded-xl border border-line">
                  {cart.map((item) => (
                    <li key={item.productId} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0"><p className="truncate text-sm font-medium">{item.name}</p><p className="text-xs text-ink/75">{money(item.sellingPrice)} each · {item.stock} in stock</p></div>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setQuantity(item.productId, 0)}>Remove</Button>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Button type="button" size="icon" variant="secondary" className="h-11 w-11 sm:h-9 sm:w-9" aria-label={`Decrease ${item.name}`} onClick={() => setQuantity(item.productId, item.quantity - 1)}>−</Button>
                        <Input aria-label={`Quantity of ${item.name}`} type="number" min="1" max={item.stock} value={item.quantity} onChange={(e) => setQuantity(item.productId, Number(e.target.value))} className="h-11 w-16 text-center sm:h-9" />
                        <Button type="button" size="icon" variant="secondary" className="h-11 w-11 sm:h-9 sm:w-9" aria-label={`Increase ${item.name}`} onClick={() => setQuantity(item.productId, item.quantity + 1)}>+</Button>
                        <span className="ml-auto text-sm font-semibold">{money(item.sellingPrice * item.quantity)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="sale-discount">Discount</Label><Input id="sale-discount" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
                <div><Label htmlFor="sale-tax">Tax</Label><Input id="sale-tax" type="number" min="0" step="0.01" value={tax} onChange={(e) => setTax(Number(e.target.value))} /></div>
              </div>
              <div>
                <Label htmlFor="sale-payment">Payment method</Label>
                <Select id="sale-payment" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">Cash</option><option value="card">Card</option><option value="mobile_wallet">Mobile wallet</option>
                </Select>
              </div>

              <dl className="space-y-1 border-t border-line pt-3 text-sm">
                <div className="flex justify-between"><dt className="text-ink/75">Subtotal</dt><dd>{money(subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink/75">Total</dt><dd className="text-lg font-semibold text-accent">{money(total)}</dd></div>
              </dl>

              {successInvoice ? <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">Sale complete — {successInvoice}</p> : null}
              <Button type="submit" className="w-full" loading={submitting} disabled={cart.length === 0}>Complete sale</Button>
            </form>
          </Card>
        </div>
      ) : (
        <Card id="pos-panel-history" role="tabpanel" aria-labelledby="pos-tab-history" className="overflow-hidden">
          {!sales ? <div className="p-5"><LoadingState label="Loading sales…" /></div> : null}
          {sales && sales.length === 0 ? <EmptyState title="No sales yet" subtitle="Completed sales will appear here." icon="box" /> : null}
          {sales && sales.length > 0 ? (
            <TableShell label="Sales history" className="rounded-none border-0 shadow-none">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink/75">
                  <tr><th scope="col" className="px-4 py-3">Invoice</th><th scope="col" className="px-4 py-3">Date</th><th scope="col" className="px-4 py-3">Customer</th><th scope="col" className="px-4 py-3">Payment</th><th scope="col" className="px-4 py-3">Status</th><th scope="col" className="px-4 py-3 text-right">Total</th><th scope="col" className="px-4 py-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {sales.map((sale) => (
                    <FragmentRow key={sale.id} sale={sale} expanded={expanded === sale.id} onToggle={() => setExpanded(expanded === sale.id ? null : sale.id)} onRefund={isAdmin ? () => setRefunding(sale) : undefined} />
                  ))}
                </tbody>
              </table>
            </TableShell>
          ) : null}
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(refunding)}
        title="Refund sale"
        message={`Refund ${refunding?.invoiceNumber ?? 'this sale'}? Stock will be returned to inventory.`}
        confirmLabel="Refund sale"
        loading={refundLoading}
        onConfirm={() => void confirmRefund()}
        onClose={() => setRefunding(null)}
      />
    </div>
  );
}

function FragmentRow({ sale, expanded, onToggle, onRefund }: { sale: Sale; expanded: boolean; onToggle: () => void; onRefund?: () => void }) {
  return (
    <>
      <tr className="hover:bg-canvas">
        <td className="px-4 py-3 font-medium">{sale.invoiceNumber}</td>
        <td className="px-4 py-3 text-ink/75">{new Date(sale.createdAt).toLocaleDateString()}</td>
        <td className="px-4 py-3">{sale.customer?.name ?? 'Walk-in'}</td>
        <td className="px-4 py-3 capitalize">{sale.paymentMethod.replace('_', ' ')}</td>
        <td className="px-4 py-3"><Badge value={sale.status.toUpperCase()} /></td>
        <td className="px-4 py-3 text-right font-semibold">{money(sale.total)}</td>
        <td className="px-4 py-3 text-right">
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={onToggle}>{expanded ? 'Hide' : 'Items'}</Button>
            {onRefund && sale.status === 'completed' ? <Button variant="ghost" size="sm" className="text-accent" onClick={onRefund}>Refund</Button> : null}
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr><td colSpan={7} className="bg-surface-muted px-6 py-3">
          <ul className="space-y-1 text-sm">
            {sale.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-3"><span>{item.quantity} × {item.product?.name ?? `Product ${item.productId}`}</span><span>{money(item.total)}</span></li>
            ))}
          </ul>
        </td></tr>
      ) : null}
    </>
  );
}
