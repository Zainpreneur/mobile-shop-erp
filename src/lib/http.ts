import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

type Context = { params: Promise<Record<string, string>> };

type Handler = (request: Request, context: Context) => Promise<Response> | Response;

export function apiRoute(handler: Handler): Handler {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json({ error: error.message }, { status: error.status });
      }
      if (error instanceof ZodError) {
        const message = error.issues.map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`).join("; ");
        return NextResponse.json({ error: message }, { status: 400 });
      }
      console.error("API error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export async function parseBody<T>(request: Request, schema: { parse: (value: unknown) => T }): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
  return schema.parse(body);
}

export function notFound(resource: string): never {
  throw new HttpError(404, `${resource} not found`);
}

export function routeId(value: string | undefined, name = "id"): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw new HttpError(400, `Invalid ${name}`);
  return id;
}

/** Translate common Prisma failures into the same error shapes the old API returned. */
export function dbError(error: unknown, resource: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") notFound(resource);
    if (error.code === "P2002") throw new HttpError(409, `${resource} already exists`);
  }
  throw error;
}
