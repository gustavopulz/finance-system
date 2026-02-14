import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function middleware(req: NextRequest) {
  // libera auth endpoints (login/register/refresh/csrf/logout)
  if (req.nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const access = req.cookies.get("fs_at")?.value;
  if (!access) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 }
    );
  }

  // CSRF (double submit)
  if (!SAFE_METHODS.has(req.method)) {
    const csrfCookie = req.cookies.get("fs_csrf")?.value;
    const csrfHeader = req.headers.get("x-csrf-token");

    if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
      return NextResponse.json(
        { success: false, error: { message: "CSRF validation failed" } },
        { status: 403 }
      );
    }
  }

  try {
    const payload = await verifyAccessToken(access);

    const headers = new Headers(req.headers);
    headers.set("x-user-id", payload.sub);
    headers.set("x-role", payload.role);

    return NextResponse.next({ request: { headers } });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Invalid token" } },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ["/api/:path*"],
};
