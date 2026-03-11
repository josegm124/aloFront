import { NextRequest, NextResponse } from "next/server";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ messageId: string }> },
) {
  try {
    const { messageId } = await context.params;
    const apiBaseUrl = requiredEnv("ALOCHAT_API_BASE_URL");
    const response = await fetch(`${apiBaseUrl}/api/v1/web/messages/${messageId}`, {
      method: "GET",
      cache: "no-store",
    });

    const responseText = await response.text();
    const responseBody = responseText ? JSON.parse(responseText) : {};

    if (!response.ok) {
      return NextResponse.json(
        {
          error: responseBody.error ?? responseBody.message ?? "Unable to fetch message status",
          details: responseBody,
        },
        { status: response.status },
      );
    }

    return NextResponse.json(responseBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
