import { NextRequest, NextResponse } from "next/server";

function normalizeOrderRef(value: unknown): string {
  return String(value ?? "")
    .replace(/^#/, "")
    .trim();
}

function normalizeEmail(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { orderRef?: unknown; email?: unknown }
    | null;

  const orderRef = normalizeOrderRef(body?.orderRef);
  const email = normalizeEmail(body?.email);

  if (!orderRef || !email) {
    return NextResponse.json(
      { message: "Order reference and email are required." },
      { status: 400 },
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { message: "Backend URL is not configured." },
      { status: 500 },
    );
  }

  const endpoint = new URL("/store/orders/track", baseUrl);
  endpoint.searchParams.set("order_ref", orderRef);
  endpoint.searchParams.set("email", email);

  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_API_KEY;
  const upstream = await fetch(endpoint.toString(), {
    method: "GET",
    headers: {
      accept: "application/json",
      ...(publishableKey ? { "x-publishable-api-key": publishableKey } : {}),
    },
    cache: "no-store",
  });

  const payload = (await upstream.json().catch(() => null)) as
    | { message?: string; order?: unknown }
    | null;

  if (!upstream.ok) {
    return NextResponse.json(
      { message: payload?.message ?? "Unable to track this order right now." },
      { status: upstream.status },
    );
  }

  return NextResponse.json(payload ?? { order: null });
}
