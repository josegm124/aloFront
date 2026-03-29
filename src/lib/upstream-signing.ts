import { createHmac, randomUUID } from "node:crypto";

const LOCAL_SERVICE_URLS = {
  assessment: "http://localhost:8080",
  document: "http://localhost:8082",
  report: "http://localhost:8086",
  notification: "http://localhost:8087",
} as const;

type ComplianceService = keyof typeof LOCAL_SERVICE_URLS;

export function getComplianceApiBaseUrl() {
  return (
    process.env.ALOCHAT_API_BASE_URL ??
    process.env.ALO_BACKEND_URL ??
    process.env.NEXT_PUBLIC_ALO_BACKEND_URL
  );
}

export function getComplianceServiceBaseUrl(service: ComplianceService) {
  const serviceSpecificBaseUrl = {
    assessment:
      process.env.ALOCHAT_ASSESSMENT_API_BASE_URL ?? process.env.ALOCHAT_LOCAL_ASSESSMENT_URL,
    document:
      process.env.ALOCHAT_DOCUMENT_API_BASE_URL ?? process.env.ALOCHAT_LOCAL_DOCUMENT_URL,
    report: process.env.ALOCHAT_REPORT_API_BASE_URL ?? process.env.ALOCHAT_LOCAL_REPORT_URL,
    notification:
      process.env.ALOCHAT_NOTIFICATION_API_BASE_URL ?? process.env.ALOCHAT_LOCAL_NOTIFICATION_URL,
  }[service];

  if (serviceSpecificBaseUrl) {
    return serviceSpecificBaseUrl;
  }

  if (process.env.ALOCHAT_LOCAL_MODE === "true") {
    return LOCAL_SERVICE_URLS[service];
  }

  const genericBaseUrl = getComplianceApiBaseUrl();
  if (genericBaseUrl) {
    return genericBaseUrl;
  }

  if (process.env.NODE_ENV !== "production") {
    return LOCAL_SERVICE_URLS[service];
  }

  return undefined;
}

export function getWebTenantId() {
  return process.env.ALOCHAT_WEB_TENANT_ID ?? "acme";
}

export function getWebSigningSecret() {
  return process.env.ALOCHAT_WEB_SIGNING_SECRET;
}

export function buildSignedJsonHeaders(rawBody: string) {
  const tenantId = getWebTenantId();
  const signingSecret = getWebSigningSecret();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const traceId = randomUUID();
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-tenant-id": tenantId,
    "x-trace-id": traceId,
  };

  if (signingSecret) {
    headers["x-timestamp"] = timestamp;
    headers["x-signature"] = createHmac("sha256", signingSecret)
      .update(`${timestamp}.${rawBody}`)
      .digest("hex");
  }

  return { headers, traceId };
}

export function buildSignedFormHeaders(fields: Record<string, string>) {
  const tenantId = getWebTenantId();
  const signingSecret = getWebSigningSecret();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const traceId = randomUUID();
  const headers: Record<string, string> = {
    "x-tenant-id": tenantId,
    "x-trace-id": traceId,
  };

  if (signingSecret) {
    const canonical = Object.entries(fields)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");
    headers["x-timestamp"] = timestamp;
    headers["x-signature"] = createHmac("sha256", signingSecret)
      .update(`${timestamp}.${canonical}`)
      .digest("hex");
  }

  return { headers, traceId };
}
