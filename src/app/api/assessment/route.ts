import { NextResponse } from "next/server";
import { buildSignedJsonHeaders, getComplianceApiBaseUrl } from "@/lib/upstream-signing";

function buildMockAssessment(payload: Record<string, unknown>) {
  const now = new Date().toISOString();
  const artifacts = Array.isArray(payload.artifacts)
    ? payload.artifacts.map((artifact: Record<string, unknown>) => ({
        ...artifact,
        artifactId: crypto.randomUUID(),
      }))
    : [];

  const regulatoryProfileId = `${String(payload.sector ?? "healthcare").toLowerCase()}:${String(
    payload.geography ?? "mx",
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")}:${String(payload.aiSystemCategory ?? "default")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")}`;

  return NextResponse.json(
    {
      assessmentId: crypto.randomUUID(),
      submissionId: crypto.randomUUID(),
      traceId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      regulatoryProfileId,
      status: "RECEIVED",
      backendMode: "mock",
      assessment: {
        ...payload,
        regulatoryProfileId,
        artifacts,
        status: "RECEIVED",
        createdAt: now,
        updatedAt: now,
      },
    },
    { status: 202 },
  );
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Record<string, unknown>;
  const preferredLanguage = String(payload.preferredLanguage ?? "ES").toUpperCase();
  const backendBaseUrl = getComplianceApiBaseUrl();

  if (backendBaseUrl) {
    const rawBody = JSON.stringify(payload);
    const { headers } = buildSignedJsonHeaders(rawBody);

    try {
      const response = await fetch(`${backendBaseUrl}/api/v1/assessments`, {
        method: "POST",
        headers,
        body: rawBody,
        cache: "no-store",
      });

      const text = await response.text();
      if (response.ok) {
        return new Response(text, {
          status: response.status,
          headers: {
            "Content-Type": response.headers.get("Content-Type") ?? "application/json",
          },
        });
      }

      if (![404, 502, 503].includes(response.status)) {
        return new Response(text, {
          status: response.status,
          headers: {
            "Content-Type": response.headers.get("Content-Type") ?? "application/json",
          },
        });
      }
    } catch {
      // fall through to mock response
    }
  }

  const mockResponse = buildMockAssessment(payload);
  mockResponse.headers.set(
    "x-alo-warning",
    preferredLanguage === "EN"
      ? "Assessment backend unavailable, mock response returned."
      : "Backend de assessment no disponible, se devolvio respuesta mock.",
  );
  return mockResponse;
}
