import bcrypt from "bcryptjs";
import { z } from "zod";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { HttpError, apiRoute, parseBody } from "@/lib/http";
import { TOKEN_COOKIE, sessionCookieOptions, signToken } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const POST = apiRoute(async (request) => {
  const data = await parseBody(request, loginSchema);
  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });

  if (!user || !user.active || !(await bcrypt.compare(data.password, user.password))) {
    throw new HttpError(401, "Invalid email or password");
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role as "admin" | "staff", name: user.name });
  const response = NextResponse.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, active: user.active },
  });
  response.cookies.set(TOKEN_COOKIE, token, sessionCookieOptions);
  return response;
});
