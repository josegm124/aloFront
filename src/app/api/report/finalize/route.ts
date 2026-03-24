import { NextResponse } from "next/server";
import { buildSignedJsonHeaders, getComplianceApiBaseUrl } from "@/lib/upstream-signing";

export async function POST(request: Request) {
  const payload = await request.json();
  const backendBaseUrl = getComplianceApiBaseUrl();

  if (!backendBaseUrl) {
    return NextResponse.json({ error: "Compliance backend URL is not configured." }, { status: 503 });
  }

  const rawBody = JSON.stringify(payload);
  const { headers } = buildSignedJsonHeaders(rawBody);

  const response = await fetch(`${backendBaseUrl}/api/v1/reports/finalize`, {
    method: "POST",
    headers,
    body: rawBody,
    cache: "no-store",
  });

  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/json",
    },
  });
}
