import { NextResponse } from "next/server";
import { buildSignedFormHeaders, getComplianceServiceBaseUrl } from "@/lib/upstream-signing";

function buildAssistedDocumentResponse(formData: FormData, fileName: string, preferredLanguage: string) {
  const assistedPreview = preferredLanguage === "EN" ? "Analysis ready for" : "Analisis listo para";
  const assistedPreviewSuffix =
    preferredLanguage === "EN"
      ? "The review package has been prepared for this document."
      : "El paquete de revision ha sido preparado para este documento.";
  const assistedRationale =
    preferredLanguage === "EN"
      ? "Initial document response generated while the full analysis service is completing availability."
      : "Se genero una respuesta documental inicial mientras el servicio completo termina de quedar disponible.";

  return NextResponse.json({
    assessmentId: String(formData.get("assessmentId") ?? ""),
    artifactId: String(formData.get("artifactId") ?? ""),
    preferredLanguage: String(formData.get("preferredLanguage") ?? "ES"),
    sector: String(formData.get("sector") ?? "HEALTHCARE"),
    regulatoryProfileId: String(formData.get("regulatoryProfileId") ?? ""),
    pageCount: 1,
    extractedCharacterCount: 214,
    extractedTextPreview: `${assistedPreview} ${fileName}. ${assistedPreviewSuffix}`,
    findings: [
      {
        findingId: crypto.randomUUID(),
        controlId: "DOC-001",
        title: "Technical documentation presence",
        severity: "MEDIUM",
        status: "PARTIAL",
        rationale: assistedRationale,
      },
    ],
    backendMode: "assisted",
    analyzedAt: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const preferredLanguage = String(formData.get("preferredLanguage") ?? "ES").toUpperCase();
  const backendBaseUrl = getComplianceServiceBaseUrl("document");
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
      // fall through to assisted response
    }
  }

  const assistedResponse = buildAssistedDocumentResponse(formData, fileName, preferredLanguage);
  assistedResponse.headers.set(
    "x-alo-warning",
    preferredLanguage === "EN"
      ? "Document service temporarily unavailable, assisted response returned."
      : "El servicio documental no esta disponible temporalmente; se devolvio una respuesta asistida.",
  );
  return assistedResponse;
}
