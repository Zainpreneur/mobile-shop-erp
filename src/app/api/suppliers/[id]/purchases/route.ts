import { z } from "zod";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, apiRoute, parseBody, routeId } from "@/lib/http";

const purchaseSchema = z.object({
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().positive(),
        unitCost: z.coerce.number().min(0),
      })
    )
    .min(1, "At least one item is required"),
});

export const POST = apiRoute(async (request, context) => {
  await requireUser(request);
  const { id } = await context.params;
  const supplierId = routeId(id);
  const data = await parseBody(request, purchaseSchema);

  for (const item of data.items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) throw new HttpError(400, `Product ${item.productId} not found`);
  }

  const purchase = await prisma.$transaction(async (tx) => {
    for (const item of data.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { quantity: { increment: item.quantity }, costPrice: item.unitCost },
      });
    }

    return tx.purchase.create({
      data: {
        supplierId,
        notes: data.notes?.trim() || null,
        totalCost: data.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0),
        items: {
          create: data.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
            total: item.quantity * item.unitCost,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });
  });

  return NextResponse.json(purchase, { status: 201 });
});
