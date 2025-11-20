import { NextRequest, NextResponse } from "next/server";
import { ALLOWED_ORIGINS } from "@/lib/env";
import { verifyToken, signAccessToken } from "@/lib/auth";

export const config = {
  matcher: ["/api/:path*"],
};

export async function middleware(req: NextRequest) {
  const origin = req.headers.get("origin") ?? "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin);

  // Pré-flight CORS
  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(origin, isAllowed),
    });
  }

  const res = NextResponse.next();

  // CORS + headers de segurança
  const headers = corsHeaders(origin, isAllowed);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Permissions-Policy", "geolocation=()");
  headers.forEach((v, k) => res.headers.set(k, v));

  // --- Autenticação e Auto-Refresh ---
  const auth = req.headers.get("authorization");
  const refreshToken = req.cookies.get("refresh_token")?.value;
  const pathname = req.nextUrl.pathname;

  // Rotas públicas por método
  const publicRoutes = [
    "/api/health",
  ];

  if (publicRoutes.some((r) => pathname.startsWith(r))) {
    const res = NextResponse.next();
    headers.forEach((v, k) => res.headers.set(k, v));
    return res;
  }

  // Bloqueia se não houver Authorization
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized - Missing token" } },
      { status: 401, headers }
    );
  }

  const token = auth.slice("Bearer ".length);

  try {
    await verifyToken(token);
    return res;
  } catch {
    // Token expirado → tenta refresh
    if (refreshToken) {
      try {
        const payload = await verifyToken(refreshToken);
        const newAccessToken = await signAccessToken(payload);

        res.headers.set("x-new-access-token", newAccessToken);
        return res;
      } catch {
        // Refresh token inválido → limpa cookie
        res.cookies.set({
          name: "refresh_token",
          value: "",
          expires: new Date(0),
          path: "/",
        });
        return NextResponse.json(
          { success: false, error: { message: "Session expired" } },
          { status: 401, headers }
        );
      }
    }

    // Sem refresh token → 401
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401, headers }
    );
  }
}

// 🌐 Função utilitária de CORS
function corsHeaders(origin: string, isAllowed: boolean) {
  const h = new Headers();
  h.set("Access-Control-Allow-Origin", isAllowed ? origin : "");
  h.set("Access-Control-Allow-Credentials", "true");
  h.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  h.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  h.set("Vary", "Origin");
  return h;
}
