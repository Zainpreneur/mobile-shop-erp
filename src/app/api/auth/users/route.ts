import bcrypt from "bcryptjs";
import { z } from "zod";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HttpError, apiRoute, dbError, parseBody } from "@/lib/http";

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "staff"]).optional(),
});

export const GET = apiRoute(async (request) => {
  await requireAdmin(request);
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  return Response.json(users);
});

export const POST = apiRoute(async (request) => {
  await requireAdmin(request);
  const data = await parseBody(request, createSchema);
  const email = data.email.toLowerCase();

  if (await prisma.user.findUnique({ where: { email } })) {
    throw new HttpError(409, "A user with that email already exists");
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        password: await bcrypt.hash(data.password, 10),
        role: data.role ?? "staff",
      },
      select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    dbError(error, "User");
  }
});
