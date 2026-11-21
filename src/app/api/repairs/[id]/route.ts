import { z } from "zod";
import { requireAdmin, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiRoute, dbError, notFound, parseBody, routeId } from "@/lib/http";

const patchSchema = z.object({
  customerId: z.coerce.number().int().positive().optional().nullable(),
  deviceBrand: z.string().optional().nullable(),
  deviceModel: z.string().optional().nullable(),
  issueDescription: z.string().min(1).optional(),
  status: z.enum(["pending", "in_progress", "completed", "delivered", "cancelled"]).optional(),
  estimatedCost: z.coerce.number().min(0).optional().nullable(),
  actualCost: z.coerce.number().min(0).optional().nullable(),
  technician: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const GET = apiRoute(async (request, context) => {
  await requireUser(request);
  const { id } = await context.params;
  const repair = await prisma.repairTicket.findUnique({
    where: { id: routeId(id) },
    include: { customer: true },
  });
  if (!repair) notFound("Repair ticket");
  return Response.json(repair);
});

export const PATCH = apiRoute(async (request, context) => {
  await requireUser(request);
  const { id } = await context.params;
  const data = await parseBody(request, patchSchema);

  const update: Record<string, unknown> = { ...data };
  if (data.status === "completed" || data.status === "delivered") update.completedAt = new Date();
  if (data.customerId === undefined) delete update.customerId;

  try {
    const repair = await prisma.repairTicket.update({
      where: { id: routeId(id) },
      data: update,
      include: { customer: true },
    });
    return Response.json(repair);
  } catch (error) {
    dbError(error, "Repair ticket");
  }
});

export const DELETE = apiRoute(async (request, context) => {
  await requireAdmin(request);
  const { id } = await context.params;
  try {
    await prisma.repairTicket.delete({ where: { id: routeId(id) } });
    return new Response(null, { status: 204 });
  } catch (error) {
    dbError(error, "Repair ticket");
  }
});
