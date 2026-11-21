import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, apiRoute, notFound, routeId } from "@/lib/http";

export const POST = apiRoute(async (request, context) => {
  await requireAdmin(request);
  const { id } = await context.params;
  const saleId = routeId(id);

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { items: true },
  });
  if (!sale) notFound("Sale");
  if (sale.status === "refunded") throw new HttpError(400, "Sale is already refunded");

  await prisma.$transaction(async (tx) => {
    for (const item of sale.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
    }
    await tx.sale.update({ where: { id: saleId }, data: { status: "refunded" } });
  });

  return Response.json({ ok: true });
});
