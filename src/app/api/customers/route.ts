import { z } from "zod";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiRoute, dbError, parseBody } from "@/lib/http";

const customerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

function normalize(data: z.infer<typeof customerSchema>) {
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
  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : undefined,
    include: { _count: { select: { sales: true, repairs: true } } },
    orderBy: { createdAt: "desc" },
  });
  return Response.json(customers);
});

export const POST = apiRoute(async (request) => {
  await requireUser(request);
  const data = normalize(await parseBody(request, customerSchema));
  try {
    const customer = await prisma.customer.create({ data });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    dbError(error, "Customer");
  }
});
