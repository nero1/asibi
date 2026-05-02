import { ok, requestIdFrom } from "@/lib/server/api-response";

export async function GET(request: Request) {
  const requestId = requestIdFrom(request);
  return ok({ status: "ok", service: "asibi-web", timestamp: new Date().toISOString() }, requestId);
}

