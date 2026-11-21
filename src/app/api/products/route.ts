import { z } from "zod";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, apiRoute, dbError, parseBody } from "@/lib/http";

const productSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  brand: z.string().optional().nullable(),
  category: z.enum(["phone", "accessory"]).default("phone"),
  imei: z.string().optional().nullable(),
  costPrice: z.coerce.number().default(0),
  sellingPrice: z.coerce.number().default(0),
  quantity: z.coerce.number().int().default(0),
  lowStockThreshold: z.coerce.number().int().default(3),
  supplierId: z.coerce.number().int().optional().nullable(),
});

function normalize(data: z.infer<typeof productSchema>) {
  return {
    ...data,
    brand: data.brand?.trim() || null,
    imei: data.imei?.trim() || null,
    supplierId: data.supplierId ?? null,
  };
}

export const GET = apiRoute(async (request) => {
  await requireUser(request);
  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim() ?? "";
  const category = url.searchParams.get("category");
  const lowStock = url.searchParams.get("lowStock") === "true";

  const products = await prisma.product.findMany({
    where: {
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { brand: { contains: search } },
              { sku: { contains: search } },
              { imei: { contains: search } },
            ],
          }
        : {}),
      ...(category && category !== "all" ? { category } : {}),
    },
    include: { supplier: true },
    orderBy: { createdAt: "desc" },
  });

  return Response.json(lowStock ? products.filter((p) => p.quantity <= p.lowStockThreshold) : products);
});

export const POST = apiRoute(async (request) => {
  await requireUser(request);
  const data = normalize(await parseBody(request, productSchema));
  try {
    const product = await prisma.product.create({ data, include: { supplier: true } });
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    dbError(error, "Product");
  }
});
