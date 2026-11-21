import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiRoute } from "@/lib/http";

export const GET = apiRoute(async (request) => {
  await requireUser(request);

  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [
    todaySales,
    monthSales,
    lowStockProducts,
    allProducts,
    pendingRepairs,
    customerCount,
    supplierCount,
    productCount,
    completedItems,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { status: "completed", createdAt: { gte: startOfToday } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { status: "completed", createdAt: { gte: startOfMonth } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.product.findMany({ orderBy: { quantity: "asc" }, take: 10 }),
    prisma.product.findMany({ select: { costPrice: true, quantity: true } }),
    prisma.repairTicket.count({ where: { status: { in: ["pending", "in_progress"] } } }),
    prisma.customer.count(),
    prisma.supplier.count(),
    prisma.product.count(),
    prisma.saleItem.findMany({
      where: { sale: { status: "completed" } },
      include: { product: { select: { name: true } } },
    }),
  ]);

  const byProduct = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const item of completedItems) {
    const current = byProduct.get(String(item.productId)) ?? {
      name: item.product.name,
      qty: 0,
      revenue: 0,
    };
    current.qty += item.quantity;
    current.revenue += item.total;
    byProduct.set(String(item.productId), current);
  }
  const topProducts = [...byProduct.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);

  return Response.json({
    revenueToday: todaySales._sum.total ?? 0,
    revenueMonth: monthSales._sum.total ?? 0,
    salesToday: todaySales._count,
    salesMonth: monthSales._count,
    lowStockCount: lowStockProducts.filter((p) => p.quantity <= p.lowStockThreshold).length,
    lowStockProducts: lowStockProducts.filter((p) => p.quantity <= p.lowStockThreshold),
    inventoryValue: allProducts.reduce((sum, p) => sum + p.costPrice * p.quantity, 0),
    pendingRepairs,
    customerCount,
    supplierCount,
    productCount,
    topProducts,
  });
});
