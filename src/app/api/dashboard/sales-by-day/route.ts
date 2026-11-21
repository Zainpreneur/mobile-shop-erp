import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiRoute } from "@/lib/http";

export const GET = apiRoute(async (request) => {
  await requireUser(request);
  const rawDays = Number(new URL(request.url).searchParams.get("days") ?? 14);
  const days = Number.isFinite(rawDays) ? Math.min(90, Math.max(1, Math.floor(rawDays))) : 14;

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = new Date(today.getTime() - (days - 1) * 86_400_000);

  const sales = await prisma.sale.findMany({
    where: { status: "completed", createdAt: { gte: start } },
    select: { createdAt: true, total: true },
  });

  const revenueByDay = new Map<string, number>();
  for (const sale of sales) {
    const day = sale.createdAt.toISOString().slice(0, 10);
    revenueByDay.set(day, (revenueByDay.get(day) ?? 0) + sale.total);
  }

  const points = Array.from({ length: days }, (_, index) => {
    const date = new Date(start.getTime() + index * 86_400_000).toISOString().slice(0, 10);
    return { date, revenue: revenueByDay.get(date) ?? 0 };
  });

  return Response.json(points);
});
