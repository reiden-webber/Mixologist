import { NextResponse } from "next/server";

const DEFAULT_BACKEND = "http://127.0.0.1:4000";

function backendBase(): string {
  const raw = process.env.BACKEND_URL?.trim() || DEFAULT_BACKEND;
  return raw.replace(/\/$/, "");
}

export async function POST(req: Request): Promise<NextResponse> {
  let body: string;
  try {
    body = await req.text();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const target = `${backendBase()}/api/chat`;
  try {
    const upstream = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: body.length ? body : "{}",
    });
    const ct =
      upstream.headers.get("content-type") ??
      "application/json; charset=utf-8";
    const cacheControl = upstream.headers.get("cache-control");
    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": ct,
        ...(cacheControl ? { "Cache-Control": cacheControl } : {}),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "backend_unreachable", message },
      { status: 502 },
    );
  }
}
