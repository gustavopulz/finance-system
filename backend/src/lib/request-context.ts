import { headers } from "next/headers";

export type RequestContext = {
  userId: string;
  role: "admin" | "user";
};

export async function getRequestContext(): Promise<RequestContext> {
  const h = await headers();

  const userId = h.get("x-user-id");
  const role = h.get("x-role") as RequestContext["role"] | null;

  if (!userId || (role !== "admin" && role !== "user")) {
    throw new Error("Missing auth context");
  }

  return { userId, role };
}
