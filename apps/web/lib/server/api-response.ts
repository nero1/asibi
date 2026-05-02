import { NextResponse } from "next/server";

export function ok(data: unknown, requestId: string) {
  return NextResponse.json({ requestId, data });
}

export function fail(status: number, code: string, message: string, requestId: string, details?: unknown) {
  return NextResponse.json({ requestId, error: { code, message, details } }, { status });
}

export function requestIdFrom(request: Request): string {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}
