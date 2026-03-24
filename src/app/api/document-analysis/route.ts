import { NextResponse } from "next/server";
import { buildSignedFormHeaders, getComplianceApiBaseUrl } from "@/lib/upstream-signing";

function buildMockDocumentResponse(formData: FormData, fileName: string, preferredLanguage: string) {
  const mockPreview = preferredLanguage === "EN" ? "Mock analysis ready for" : "Mock analysis listo para";
  const mockPreviewSuffix =
    preferredLanguage === "EN"
      ? "Configure ALOCHAT_API_BASE_URL with the compliance backend to run the real analyzer."
      : "Configura ALOCHAT_API_BASE_URL con el backend de compliance para ejecutar el analizador real.";
  const mockRationale =
    preferredLanguage === "EN"
      ? "Frontend mock response. The real backend document analyzer is not publicly reachable yet."
      : "Respuesta mock del frontend. El analizador documental real del backend aun no esta expuesto publicamente.";

  return NextResponse.json({
    assessmentId: String(formData.get("assessmentId") ?? ""),
    artifactId: String(formData.get("artifactId") ?? ""),
    preferredLanguage: String(formData.get("preferredLanguage") ?? "ES"),
    sector: String(formData.get("sector") ?? "HEALTHCARE"),
    regulatoryProfileId: String(formData.get("regulatoryProfileId") ?? ""),
    pageCount: 1,
    extractedCharacterCount: 214,
    extractedTextPreview: `${mockPreview} ${fileName}. ${mockPreviewSuffix}`,
    findings: [
      {
        findingId: crypto.randomUUID(),
        controlId: "DOC-001",
        title: "Technical documentation presence",
        severity: "MEDIUM",
        status: "PARTIAL",
        rationale: mockRationale,
      },
    ],
    backendMode: "mock",
    analyzedAt: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const preferredLanguage = String(formData.get("preferredLanguage") ?? "ES").toUpperCase();
  const backendBaseUrl = getComplianceApiBaseUrl();
  const file = formData.get("file");
  const fileName = file instanceof File ? file.name : "document.pdf";

  if (backendBaseUrl) {
    const { headers } = buildSignedFormHeaders({
      assessmentId: String(formData.get("assessmentId") ?? ""),
      artifactId: String(formData.get("artifactId") ?? ""),
      sector: String(formData.get("sector") ?? ""),
      regulatoryProfileId: String(formData.get("regulatoryProfileId") ?? ""),
      fileName,
    });

    try {
      const response = await fetch(`${backendBaseUrl}/api/v1/document-compliance/analyze`, {
        method: "POST",
        headers,
        body: formData,
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

  const mockResponse = buildMockDocumentResponse(formData, fileName, preferredLanguage);
  mockResponse.headers.set(
    "x-alo-warning",
    preferredLanguage === "EN"
      ? "Document analyzer backend unavailable, mock response returned."
      : "Backend de analisis documental no disponible, se devolvio respuesta mock.",
  );
  return mockResponse;
}
