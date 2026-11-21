'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api, apiErrorMessage } from '@/lib/api-client';
import type { DashboardSummary, SalesByDayPoint } from '@/lib/types';
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  StatCard,
  TableShell,
  money,
} from '@/components/ui';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [sales, setSales] = useState<SalesByDayPoint[]>([]);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setError('');
    try {
      const [summaryRes, salesRes] = await Promise.all([
        api.get<DashboardSummary>('/dashboard/summary'),
        api.get<SalesByDayPoint[]>('/dashboard/sales-by-day', { params: { days: 14 } }),
      ]);
      setSummary(summaryRes.data);
      setSales(salesRes.data);
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  if (error && !summary) return <ErrorState message={error} onRetry={() => setReloadKey((key) => key + 1)} />;
  if (!summary) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="A live snapshot of sales, stock and repair activity."
        actions={<Button variant="secondary" size="sm" onClick={() => void load()}>Refresh</Button>}
      />

      <section aria-label="Key metrics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Revenue today" value={money(summary.revenueToday)} sub={`${summary.salesToday} sales`} accent="green" icon="trendingUp" />
        <StatCard label="Revenue this month" value={money(summary.revenueMonth)} sub={`${summary.salesMonth} sales`} accent="blue" icon="trendingUp" />
        <StatCard label="Inventory value" value={money(summary.inventoryValue)} sub={`${summary.productCount} products`} accent="amber" icon="box" />
        <StatCard label="Pending repairs" value={String(summary.pendingRepairs)} sub="Open tickets" accent="red" icon="clock" />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-display text-base font-semibold text-ink">Revenue — last 14 days</h2>
          <div className="mt-4 h-72 w-full" role="img" aria-label="Line chart of daily revenue over the last 14 days">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sales} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-grid)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={(value: string) => value.slice(5)} tick={{ fontSize: 12, fill: 'var(--color-ink)' }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value: number) => `$${value}`} tick={{ fontSize: 12, fill: 'var(--color-ink)' }} tickLine={false} axisLine={false} width={64} />
                <Tooltip
                  formatter={(value) => money(Number(value))}
                  labelFormatter={(label) => String(label)}
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-line)',
                    borderRadius: 12,
                    color: 'var(--color-ink)',
                  }}
                  labelStyle={{ color: 'var(--color-ink)' }}
                  itemStyle={{ color: 'var(--color-ink)' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-accent)" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <table className="sr-only">
            <caption>Revenue by day for the last 14 days</caption>
            <thead>
              <tr><th scope="col">Date</th><th scope="col">Revenue</th></tr>
            </thead>
            <tbody>
              {sales.map((point) => (
                <tr key={point.date}>
                  <th scope="row">{point.date}</th>
                  <td>{money(point.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="font-display text-base font-semibold text-ink">At a glance</h2>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-ink/75">Customers</dt><dd className="mt-1 text-xl font-semibold">{summary.customerCount}</dd></div>
              <div><dt className="text-xs text-ink/75">Suppliers</dt><dd className="mt-1 text-xl font-semibold">{summary.supplierCount}</dd></div>
              <div><dt className="text-xs text-ink/75">Products</dt><dd className="mt-1 text-xl font-semibold">{summary.productCount}</dd></div>
              <div><dt className="text-xs text-ink/75">Low stock</dt><dd className="mt-1 text-xl font-semibold text-danger">{summary.lowStockCount}</dd></div>
            </dl>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-base font-semibold text-ink">Top selling products</h2>
            {summary.topProducts.length === 0 ? (
              <p className="mt-4 text-sm text-ink/75">No sales recorded yet.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {summary.topProducts.map((product) => (
                  <li key={product.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{product.name}</span>
                    <span className="shrink-0 text-xs text-ink/75">{product.qty} sold · {money(product.revenue)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">Low stock alert</h2>
            <p className="text-xs text-ink/75">Products at or below their reorder threshold.</p>
          </div>
          <Link href="/inventory" className="text-sm font-semibold text-accent hover:underline">View all</Link>
        </div>
        {summary.lowStockProducts.length === 0 ? (
          <EmptyState title="Stock levels look healthy" subtitle="No products are below their reorder threshold." icon="check" />
        ) : (
          <TableShell label="Low stock products" className="rounded-none border-0 shadow-none">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-surface-muted text-xs uppercase tracking-wide text-ink/75">
                <tr><th scope="col" className="px-5 py-3">Product</th><th scope="col" className="px-5 py-3">SKU</th><th scope="col" className="px-5 py-3">In stock</th><th scope="col" className="px-5 py-3">Threshold</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {summary.lowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-5 py-3 font-medium">{product.name}</td>
                    <td className="px-5 py-3 text-ink/75">{product.sku}</td>
                    <td className="px-5 py-3 font-semibold text-danger">{product.quantity}</td>
                    <td className="px-5 py-3 text-ink/75">{product.lowStockThreshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableShell>
        )}
      </Card>
    </div>
  );
}
