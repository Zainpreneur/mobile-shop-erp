import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiRoute, notFound, routeId } from "@/lib/http";

export const GET = apiRoute(async (request, context) => {
  await requireUser(request);
  const { id } = await context.params;
  const sale = await prisma.sale.findUnique({
    where: { id: routeId(id) },
    include: {
      customer: true,
      user: { select: { id: true, name: true, email: true, role: true } },
      items: { include: { product: true } },
    },
  });
  if (!sale) notFound("Sale");
  return Response.json(sale);
});
