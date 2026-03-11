"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  AcceptedMessageResponse,
  COOKIE_MAX_AGE,
  EMAIL_COOKIE,
  MessageStatusResponse,
  NAME_COOKIE,
  TERMINAL_STATUSES,
} from "@/lib/chat-config";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  status?: "idle" | "pending" | "error";
};

type VisitorProfile = {
  name: string;
  email: string;
};

const sidebarChats = [
  "Pintura para casa",
  "Vinil-Acrilica Premium",
  "Impermeabilizante 10 anos",
  "Pintura para herreria",
  "Promociones recientes",
];

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=")[1] ?? "") : "";
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

function greetingFor(name: string) {
  return `Hola ${name}, soy AloChat. Preguntame por pinturas, precios, usos o recomendaciones para tu proyecto.`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollMessage(messageId: string): Promise<MessageStatusResponse> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await fetch(`/api/chat/${messageId}`, {
      method: "GET",
      cache: "no-store",
    });

    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? "No se pudo consultar el estado del mensaje");
    }

    if (TERMINAL_STATUSES.has(body.status)) {
      return body as MessageStatusResponse;
    }

    await sleep(2000);
  }

  throw new Error("Tiempo de espera agotado al consultar la respuesta de AloChat");
}

export function ChatExperience() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profile, setProfile] = useState<VisitorProfile>({ name: "", email: "" });
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [statusLabel, setStatusLabel] = useState("Listo para conversar");

  useEffect(() => {
    const savedName = readCookie(NAME_COOKIE);
    const savedEmail = readCookie(EMAIL_COOKIE);

    if (!savedName || !savedEmail) {
      setShowOnboarding(true);
      return;
    }

    setProfile({ name: savedName, email: savedEmail });
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: greetingFor(savedName),
      },
    ]);
  }, []);

  const handleOnboardingSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = draftName.trim();
    const cleanEmail = draftEmail.trim();

    if (!cleanName || !cleanEmail) {
      return;
    }

    writeCookie(NAME_COOKIE, cleanName);
    writeCookie(EMAIL_COOKIE, cleanEmail);

    setProfile({ name: cleanName, email: cleanEmail });
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: greetingFor(cleanName),
      },
    ]);
    setShowOnboarding(false);
  };

  const handleSendMessage = async () => {
    const cleanPrompt = messageDraft.trim();
    if (!cleanPrompt || !profile.name || isSending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${crypto.randomUUID()}`,
      role: "user",
      content: cleanPrompt,
    };

    const pendingAssistantId = `assistant-${crypto.randomUUID()}`;
    const pendingAssistantMessage: ChatMessage = {
      id: pendingAssistantId,
      role: "assistant",
      content: "Consultando AloChat...",
      status: "pending",
    };

    setMessages((current) => [...current, userMessage, pendingAssistantMessage]);
    setMessageDraft("");
    setIsSending(true);
    setStatusLabel("Enviando tu consulta al backend");

    try {
      const sendResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          prompt: cleanPrompt,
          page: window.location.pathname,
        }),
      });

      const sendBody = (await sendResponse.json()) as AcceptedMessageResponse & { error?: string };
      if (!sendResponse.ok) {
        throw new Error(sendBody.error ?? "No se pudo enviar el mensaje");
      }

      setStatusLabel(`Mensaje aceptado: ${sendBody.status}`);
      const finalStatus = await pollMessage(sendBody.messageId);

      setMessages((current) =>
        current.map((message) =>
          message.id === pendingAssistantId
            ? {
                ...message,
                content: finalStatus.contentText || `Estado actual: ${finalStatus.status}`,
                status: finalStatus.status === "FAILED" ? "error" : "idle",
              }
            : message,
        ),
      );
      setStatusLabel(`Estado final: ${finalStatus.status}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado al enviar la consulta";
      setMessages((current) =>
        current.map((entry) =>
          entry.id === pendingAssistantId
            ? {
                ...entry,
                content: message,
                status: "error",
              }
            : entry,
        ),
      );
      setStatusLabel("Fallo la consulta al backend");
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSendMessage();
  };

  return (
    <div className="app-shell">
      <main className="chat-stage">
        <section className="chat-surface">
          <header className="chat-header">
            <div>
              <p className="eyebrow">AloChat</p>
              <h1>Asistente comercial para tu tienda</h1>
              <p className="header-status">{statusLabel}</p>
            </div>
            <div className="profile-chip">
              <span>{profile.name || "Visitante"}</span>
              <small>{profile.email || "Sin correo"}</small>
            </div>
          </header>

          <div className="message-stream">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`message-card ${message.role === "user" ? "user" : "assistant"} ${message.status === "error" ? "error" : ""}`}
              >
                <span className="message-role">{message.role === "user" ? "Tu" : "A"}</span>
                <p>{message.content}</p>
              </article>
            ))}
          </div>

          <form className="composer" onSubmit={handleComposerSubmit}>
            <textarea
              value={messageDraft}
              onChange={(event) => setMessageDraft(event.target.value)}
              placeholder="Escribe aqui tu consulta sobre pinturas, precios o recomendaciones..."
              rows={1}
              disabled={isSending}
            />
            <button type="submit" aria-label="Enviar mensaje" disabled={isSending}>
              <span>{isSending ? "…" : "↗"}</span>
            </button>
          </form>
        </section>
      </main>

      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : "expanded"}`}>
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed((current) => !current)}
          aria-label={sidebarCollapsed ? "Expandir menu" : "Colapsar menu"}
        >
          A
        </button>

        <div className="sidebar-middle">
          {!sidebarCollapsed && (
            <>
              <div className="sidebar-name-block">
                <span className="sidebar-label">Cliente actual</span>
                <strong>{profile.name || "Nuevo visitante"}</strong>
              </div>
              <nav className="chat-list" aria-label="Chats recientes">
                {sidebarChats.map((chat) => (
                  <button key={chat} type="button" className="chat-link">
                    {chat}
                  </button>
                ))}
              </nav>
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="brand-orb">A</div>
          {!sidebarCollapsed && <span>AloChat</span>}
        </div>
      </aside>

      {showOnboarding && (
        <div className="onboarding-backdrop">
          <form className="onboarding-card" onSubmit={handleOnboardingSubmit}>
            <div>
              <p className="eyebrow">Primer acceso</p>
              <h2>Antes de empezar</h2>
              <p className="onboarding-copy">
                Dinos tu nombre y correo para personalizar la conversacion. Se guardan en cookies locales para llenar la vista la proxima vez.
              </p>
            </div>

            <label>
              Nombre
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="Eduardo Perez"
                required
              />
            </label>

            <label>
              Correo
              <input
                type="email"
                value={draftEmail}
                onChange={(event) => setDraftEmail(event.target.value)}
                placeholder="lalo@correo.com"
                required
              />
            </label>

            <button type="submit" className="primary-action">
              Entrar al chat
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
