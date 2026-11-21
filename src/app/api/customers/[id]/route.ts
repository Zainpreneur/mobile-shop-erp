import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiRoute, dbError, notFound, parseBody, routeId } from "@/lib/http";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const GET = apiRoute(async (request, context) => {
  await requireUser(request);
  const { id } = await context.params;
  const customer = await prisma.customer.findUnique({
    where: { id: routeId(id) },
    include: {
      sales: { orderBy: { createdAt: "desc" }, include: { items: { include: { product: true } } } },
      repairs: { orderBy: { receivedAt: "desc" } },
    },
  });
  if (!customer) notFound("Customer");
  return Response.json(customer);
});

export const PUT = apiRoute(async (request, context) => {
  await requireUser(request);
  const { id } = await context.params;
  const data = await parseBody(request, patchSchema);
  try {
    const customer = await prisma.customer.update({
      where: { id: routeId(id) },
      data: {
        ...data,
        phone: data.phone === undefined ? undefined : data.phone?.trim() || null,
        email: data.email === undefined ? undefined : data.email?.trim() || null,
        address: data.address === undefined ? undefined : data.address?.trim() || null,
        notes: data.notes === undefined ? undefined : data.notes?.trim() || null,
      },
    });
    return Response.json(customer);
  } catch (error) {
    dbError(error, "Customer");
  }
});

export const DELETE = apiRoute(async (request, context) => {
  await requireAdmin(request);
  const { id } = await context.params;
  try {
    await prisma.customer.delete({ where: { id: routeId(id) } });
    return new Response(null, { status: 204 });
  } catch (error) {
    dbError(error, "Customer");
  }
});
