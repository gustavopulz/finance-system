import { ok } from "@/lib/response";
import { generateCsrfToken } from "@/lib/auth";
import { setCsrfCookie } from "@/lib/cookies";

export async function GET() {
  const csrf = generateCsrfToken();
  setCsrfCookie(csrf);
  await setCsrfCookie(csrf);
  return ok({ csrf });
}