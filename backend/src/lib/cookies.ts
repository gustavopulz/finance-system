import { cookies } from "next/headers";

const isProd = process.env.NODE_ENV === "production";

export async function setAuthCookies(params: {
  accessToken: string;
  refreshToken: string;
}) {
  const c = await cookies();

  c.set("fs_at", params.accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15, // 15 min
  });

  c.set("fs_rt", params.refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/api/auth", // refresh/logout ficam aqui
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  });
}

export async function setCsrfCookie(csrf: string) {
  const c = await cookies();
  c.set("fs_csrf", csrf, {
    httpOnly: false, // precisa ser lido pelo front p/ mandar no header
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearAuthCookies() {
  const c = await cookies();
  c.set("fs_at", "", { path: "/", maxAge: 0 });
  c.set("fs_rt", "", { path: "/api/auth", maxAge: 0 });
  c.set("fs_csrf", "", { path: "/", maxAge: 0 });
}
