import { z } from "zod";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiRoute, dbError, parseBody } from "@/lib/http";

const supplierSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

function normalize(data: z.infer<typeof supplierSchema>) {
  return {
    ...data,
    phone: data.phone?.trim() || null,
    email: data.email?.trim() || null,
    address: data.address?.trim() || null,
    notes: data.notes?.trim() || null,
  };
}

export const GET = apiRoute(async (request) => {
  await requireUser(request);
  const search = new URL(request.url).searchParams.get("search")?.trim() ?? "";
  const suppliers = await prisma.supplier.findMany({
    where: search
      ? { OR: [{ name: { contains: search } }, { phone: { contains: search } }, { email: { contains: search } }] }
      : undefined,
    include: { _count: { select: { products: true, purchases: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(suppliers);
});

export const POST = apiRoute(async (request) => {
  await requireUser(request);
  const data = normalize(await parseBody(request, supplierSchema));
  try {
    const supplier = await prisma.supplier.create({ data });
    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    dbError(error, "Supplier");
  }
});
