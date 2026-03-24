import { createHmac, randomUUID } from "node:crypto";

export function getComplianceApiBaseUrl() {
  return (
    process.env.ALOCHAT_API_BASE_URL ??
    process.env.ALO_BACKEND_URL ??
    process.env.NEXT_PUBLIC_ALO_BACKEND_URL
  );
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
