import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL,
  createAdminSessionToken,
} from "@/lib/admin-session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const expectedPassword = process.env.ADMIN_PASSWORD || process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "shovo2026";
    if (!expectedPassword || typeof password !== "string" || password.length === 0 || password !== expectedPassword) {
      return NextResponse.json({ error: "Invalid admin password." }, { status: 401 });
    }
    const token = createAdminSessionToken();
    if (!token || token.endsWith(".")) {
      return NextResponse.json({ error: "Admin session signing is not configured." }, { status: 500 });
    }
    const response = NextResponse.json({ success: true });
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: ADMIN_SESSION_TTL,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Could not create admin session." }, { status: 400 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return response;
}
