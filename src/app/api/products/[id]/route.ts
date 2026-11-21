import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiRoute, dbError, notFound, parseBody, routeId } from "@/lib/http";

const patchSchema = z
  .object({
    name: z.string().min(1).optional(),
    sku: z.string().min(1).optional(),
    brand: z.string().optional().nullable(),
    category: z.enum(["phone", "accessory"]).optional(),
    imei: z.string().optional().nullable(),
    costPrice: z.coerce.number().optional(),
    sellingPrice: z.coerce.number().optional(),
    quantity: z.coerce.number().int().optional(),
    lowStockThreshold: z.coerce.number().int().optional(),
    supplierId: z.coerce.number().int().optional().nullable(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: "Provide at least one field to update" });

export const GET = apiRoute(async (request, context) => {
  await requireUser(request);
  const { id } = await context.params;
  const product = await prisma.product.findUnique({
    where: { id: routeId(id) },
    include: { supplier: true },
  });
  if (!product) notFound("Product");
  return Response.json(product);
});

export const PUT = apiRoute(async (request, context) => {
  await requireUser(request);
  const { id } = await context.params;
  const data = await parseBody(request, patchSchema);
  try {
    const product = await prisma.product.update({
      where: { id: routeId(id) },
      data: {
        ...data,
        brand: data.brand === undefined ? undefined : data.brand?.trim() || null,
        imei: data.imei === undefined ? undefined : data.imei?.trim() || null,
      },
    });
    return Response.json(product);
  } catch (error) {
    dbError(error, "Product");
  }
});

export const DELETE = apiRoute(async (request, context) => {
  await requireAdmin(request);
  const { id } = await context.params;
  try {
    await prisma.product.delete({ where: { id: routeId(id) } });
    return new Response(null, { status: 204 });
  } catch (error) {
    dbError(error, "Product");
  }
});
