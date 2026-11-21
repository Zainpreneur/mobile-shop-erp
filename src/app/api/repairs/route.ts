import { z } from "zod";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiRoute, parseBody } from "@/lib/http";

const createSchema = z.object({
  ticketNumber: z.string().min(1).optional(),
  customerId: z.coerce.number().int().positive().optional().nullable(),
  deviceBrand: z.string().optional().nullable(),
  deviceModel: z.string().optional().nullable(),
  issueDescription: z.string().min(1),
  status: z.enum(["pending", "in_progress", "completed", "delivered", "cancelled"]).default("pending"),
  estimatedCost: z.coerce.number().min(0).optional().nullable(),
  actualCost: z.coerce.number().min(0).optional().nullable(),
  technician: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const GET = apiRoute(async (request) => {
  await requireUser(request);
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search")?.trim() ?? "";

  const repairs = await prisma.repairTicket.findMany({
    where: {
      ...(status && status !== "all" ? { status } : {}),
      ...(search
        ? {
            OR: [
              { ticketNumber: { contains: search } },
              { deviceBrand: { contains: search } },
              { deviceModel: { contains: search } },
              { issueDescription: { contains: search } },
            ],
          }
        : {}),
    },
    include: { customer: true },
    orderBy: { receivedAt: "desc" },
  });
  return Response.json(repairs);
});

export const POST = apiRoute(async (request) => {
  await requireUser(request);
  const data = await parseBody(request, createSchema);
  const count = await prisma.repairTicket.count();
  const ticketNumber = data.ticketNumber || `RPR-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;

  const repair = await prisma.repairTicket.create({
    data: {
      ...data,
      ticketNumber,
      customerId: data.customerId ?? null,
      deviceBrand: data.deviceBrand?.trim() || null,
      deviceModel: data.deviceModel?.trim() || null,
      estimatedCost: data.estimatedCost ?? null,
      actualCost: data.actualCost ?? null,
      technician: data.technician?.trim() || null,
      notes: data.notes?.trim() || null,
    },
    include: { customer: true },
  });
  return NextResponse.json(repair, { status: 201 });
});
