export const NAME_COOKIE = "alo_user_name";
export const EMAIL_COOKIE = "alo_user_email";
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const CONVERSATION_COOKIE = "alo_conversation_id";
export const SESSION_COOKIE = "alo_session_id";
export const ANONYMOUS_COOKIE = "alo_anonymous_id";

export type AcceptedMessageResponse = {
  messageId: string;
  idempotencyKey: string;
  channel: string;
  status: string;
};

export type MessageStatusResponse = {
  messageId: string;
  conversationId: string;
  channel: string;
  status: string;
  updatedAt: string;
  contentText: string;
};

export type SendChatPayload = {
  prompt: string;
  page?: string;
  language?: "es" | "en";
};

export type SendChatResult = AcceptedMessageResponse & {
  conversationId: string;
};

export const TERMINAL_STATUSES = new Set([
  "AI_COMPLETED",
  "READY_FOR_DISPATCH",
  "DISPATCHED",
  "FAILED",
]);
