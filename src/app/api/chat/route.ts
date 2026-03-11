import { createHmac, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  ANONYMOUS_COOKIE,
  CONVERSATION_COOKIE,
  COOKIE_MAX_AGE,
  EMAIL_COOKIE,
  NAME_COOKIE,
  SESSION_COOKIE,
  SendChatPayload,
} from "@/lib/chat-config";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function sign(timestamp: string, rawBody: string, secret: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as SendChatPayload;
    const prompt = payload.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const name = request.cookies.get(NAME_COOKIE)?.value?.trim() ?? "";
    const email = request.cookies.get(EMAIL_COOKIE)?.value?.trim() ?? "";

    if (!name || !email) {
      return NextResponse.json({ error: "Missing visitor profile cookies" }, { status: 400 });
    }

    const apiBaseUrl = requiredEnv("ALOCHAT_API_BASE_URL");
    const tenantId = requiredEnv("ALOCHAT_WEB_TENANT_ID");
    const signingSecret = requiredEnv("ALOCHAT_WEB_SIGNING_SECRET");

    const conversationId = request.cookies.get(CONVERSATION_COOKIE)?.value ?? randomUUID();
    const sessionId = request.cookies.get(SESSION_COOKIE)?.value ?? randomUUID();
    const anonymousId = request.cookies.get(ANONYMOUS_COOKIE)?.value ?? randomUUID();
    const externalMessageId = `web-${randomUUID()}`;
    const traceId = randomUUID();

    const upstreamPayload = {
      tenantId,
      messageId: externalMessageId,
      conversationId,
      user: {
        id: email.toLowerCase(),
        role: "customer",
        name,
      },
      message: {
        type: "text",
        text: prompt,
      },
      context: {
        source: "vercel-web",
        locale: request.headers.get("accept-language")?.split(",")[0] ?? "es-MX",
        client: {
          app: "alofront",
          version: "0.1.0",
          platform: "web",
        },
        session: {
          id: sessionId,
          anonymousId,
        },
      },
      metadata: {
        correlationId: traceId,
        page: payload.page ?? "/",
        referrer: request.headers.get("referer") ?? "",
        userEmail: email,
      },
    };

    const rawBody = JSON.stringify(upstreamPayload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = sign(timestamp, rawBody, signingSecret);

    const upstreamResponse = await fetch(`${apiBaseUrl}/api/v1/inbound/web`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": tenantId,
        "x-timestamp": timestamp,
        "x-signature": signature,
        "x-trace-id": traceId,
      },
      body: rawBody,
      cache: "no-store",
    });

    const responseText = await upstreamResponse.text();
    const responseBody = responseText ? JSON.parse(responseText) : {};

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          error: responseBody.error ?? responseBody.message ?? "Upstream request failed",
          details: responseBody,
        },
        { status: upstreamResponse.status },
      );
    }

    const response = NextResponse.json({ ...responseBody, conversationId });
    response.cookies.set(CONVERSATION_COOKIE, conversationId, {
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
    response.cookies.set(SESSION_COOKIE, sessionId, {
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
    response.cookies.set(ANONYMOUS_COOKIE, anonymousId, {
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
