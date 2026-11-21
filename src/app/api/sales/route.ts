import { z } from "zod";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiRoute, parseBody } from "@/lib/http";

const saleSchema = z.object({
  customerId: z.coerce.number().int().positive().optional().nullable(),
  discount: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(["cash", "card", "mobile_wallet"]).default("cash"),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int().positive(),
        quantity: z.coerce.number().int().positive(),
        unitPrice: z.coerce.number().min(0).optional(),
      })
    )
    .min(1, "At least one item is required"),
});

export const GET = apiRoute(async (request) => {
  await requireUser(request);
  const url = new URL(request.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const customerId = url.searchParams.get("customerId");

  const sales = await prisma.sale.findMany({
    where: {
      ...(from ? { createdAt: { gte: new Date(from) } } : {}),
      ...(to ? { createdAt: { lte: new Date(`${to}T23:59:59.999Z`) } } : {}),
      ...(customerId ? { customerId: Number(customerId) } : {}),
    },
    include: {
      customer: true,
      user: { select: { id: true, name: true, email: true, role: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(sales);
});

export const POST = apiRoute(async (request) => {
  const session = await requireUser(request);
  const data = await parseBody(request, saleSchema);

  const sale = await prisma.$transaction(async (tx) => {
    const products = await Promise.all(
      data.items.map((item) => tx.product.findUnique({ where: { id: item.productId } }))
    );

    for (let index = 0; index < data.items.length; index += 1) {
      const item = data.items[index];
      const product = products[index];
      if (!product) throw new Error(`Product ${item.productId} not found`);
      if (product.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
      await tx.product.update({
        where: { id: product.id },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    const lineItems = data.items.map((item, index) => {
      const unitPrice = item.unitPrice ?? products[index]!.sellingPrice;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        total: unitPrice * item.quantity,
      };
    });
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const total = Math.max(0, subtotal - data.discount + data.tax);
    const count = await tx.sale.count();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

    return tx.sale.create({
      data: {
        invoiceNumber,
        customerId: data.customerId ?? null,
        userId: session.id,
        subtotal,
        discount: data.discount,
        tax: data.tax,
        total,
        paymentMethod: data.paymentMethod,
        status: "completed",
        items: { create: lineItems },
      },
      include: {
        customer: true,
        user: { select: { id: true, name: true, email: true, role: true } },
        items: { include: { product: true } },
      },
    });
  });

  return NextResponse.json(sale, { status: 201 });
});
