import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apiRoute, dbError, parseBody, routeId } from "@/lib/http";

const patchSchema = z
  .object({
    role: z.enum(["admin", "staff"]).optional(),
    active: z.boolean().optional(),
  })
  .refine((value) => value.role !== undefined || value.active !== undefined, {
    message: "Provide at least one field to update",
  });

export const PATCH = apiRoute(async (request, context) => {
  await requireAdmin(request);
  const { id } = await context.params;
  const data = await parseBody(request, patchSchema);

  try {
    const user = await prisma.user.update({
      where: { id: routeId(id) },
      data,
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    return Response.json(user);
  } catch (error) {
    dbError(error, "User");
  }
});
