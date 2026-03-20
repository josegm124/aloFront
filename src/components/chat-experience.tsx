"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
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

type Language = "es" | "en";
type StatusState =
  | { type: "ready" }
  | { type: "sending" }
  | { type: "accepted"; status: string }
  | { type: "final"; status: string }
  | { type: "error" };

const LANGUAGE_STORAGE_KEY = "alochat-language";

// i18n strings and quick prompts.
const translations = {
  es: {
    appName: "AloChat",
    headerTitle: "Asistente comercial para tu tienda",
    status: {
      ready: "Listo para conversar",
      sending: "Enviando tu consulta al backend",
      accepted: (status: string) => `Mensaje aceptado: ${status}`,
      final: (status: string) => `Estado final: ${status}`,
      error: "Fallo la consulta al backend",
    },
    greeting: (name: string) =>
      `Hola ${name}, soy AloChat. Preguntame por pinturas, precios, usos o recomendaciones para tu proyecto.`,
    profileFallbackName: "Visitante",
    profileFallbackEmail: "Sin correo",
    profileNewVisitor: "Nuevo visitante",
    chatListLabel: "Chats recientes",
    inputPlaceholder: "Escribe aqui tu consulta sobre pinturas, precios o recomendaciones...",
    pendingMessage: "Consultando AloChat...",
    role: {
      user: "Tu",
      assistant: "A",
    },
    aria: {
      sendMessage: "Enviar mensaje",
      openMenu: "Abrir menu",
      closeMenu: "Cerrar menu",
      collapseMenu: "Colapsar menu",
      expandMenu: "Expandir menu",
      language: "Idioma",
    },
    onboarding: {
      eyebrow: "Primer acceso",
      title: "Antes de empezar",
      copy:
        "Dinos tu nombre y correo para personalizar la conversacion. Se guardan en cookies locales para llenar la vista la proxima vez.",
      nameLabel: "Nombre",
      emailLabel: "Correo",
      namePlaceholder: "Eduardo Perez",
      emailPlaceholder: "lalo@correo.com",
      submit: "Entrar al chat",
    },
    errors: {
      pollStatus: "No se pudo consultar el estado del mensaje",
      pollTimeout: "Tiempo de espera agotado al consultar la respuesta de AloChat",
      sendFailed: "No se pudo enviar el mensaje",
      sendUnexpected: "Error inesperado al enviar la consulta",
    },
    quickPrompts: [
      "Pintura para casa",
      "Vinil-Acrilica Premium",
      "Impermeabilizante 10 años",
      "Pintura para herreria",
      "Promociones recientes",
    ],
  },
  en: {
    appName: "AloChat",
    headerTitle: "Commercial assistant for your store",
    status: {
      ready: "Ready to chat",
      sending: "Sending your request to the backend",
      accepted: (status: string) => `Message accepted: ${status}`,
      final: (status: string) => `Final status: ${status}`,
      error: "Backend request failed",
    },
    greeting: (name: string) =>
      `Hi ${name}, I'm AloChat. Ask me about paints, prices, uses, or recommendations for your project.`,
    profileFallbackName: "Visitor",
    profileFallbackEmail: "No email",
    profileNewVisitor: "New visitor",
    chatListLabel: "Recent chats",
    inputPlaceholder: "Write your question about paints, prices, or recommendations...",
    pendingMessage: "Checking with AloChat...",
    role: {
      user: "You",
      assistant: "A",
    },
    aria: {
      sendMessage: "Send message",
      openMenu: "Open menu",
      closeMenu: "Close menu",
      collapseMenu: "Collapse menu",
      expandMenu: "Expand menu",
      language: "Language",
    },
    onboarding: {
      eyebrow: "First visit",
      title: "Before we start",
      copy:
        "Share your name and email to personalize the conversation. They are stored locally to prefill your next visit.",
      nameLabel: "Name",
      emailLabel: "Email",
      namePlaceholder: "Eduardo Perez",
      emailPlaceholder: "lalo@mail.com",
      submit: "Enter chat",
    },
    errors: {
      pollStatus: "Unable to check message status",
      pollTimeout: "Timed out while waiting for AloChat response",
      sendFailed: "Unable to send message",
      sendUnexpected: "Unexpected error while sending the request",
    },
    quickPrompts: [
      "Home interior paint",
      "Premium vinyl acrylic",
      "10-year waterproofing",
      "Metalwork paint",
      "Recent promotions",
    ],
  },
} as const;

type Strings = (typeof translations)[Language];

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

function greetingFor(name: string, strings: Strings) {
  return strings.greeting(name);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function statusLabelFor(state: StatusState, strings: Strings) {
  switch (state.type) {
    case "sending":
      return strings.status.sending;
    case "accepted":
      return strings.status.accepted(state.status);
    case "final":
      return strings.status.final(state.status);
    case "error":
      return strings.status.error;
    case "ready":
    default:
      return strings.status.ready;
  }
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQueryList = window.matchMedia(query);
    const updateMatch = () => setMatches(mediaQueryList.matches);

    updateMatch();

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", updateMatch);
      return () => mediaQueryList.removeEventListener("change", updateMatch);
    }

    mediaQueryList.addListener(updateMatch);
    return () => mediaQueryList.removeListener(updateMatch);
  }, [query]);

  return matches;
}

async function pollMessage(messageId: string, strings: Strings): Promise<MessageStatusResponse> {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await fetch(`/api/chat/${messageId}`, {
      method: "GET",
      cache: "no-store",
    });

    const body = await response.json();
    if (!response.ok) {
      throw new Error(body.error ?? strings.errors.pollStatus);
    }

    if (TERMINAL_STATUSES.has(body.status)) {
      return body as MessageStatusResponse;
    }

    await sleep(2000);
  }

  throw new Error(strings.errors.pollTimeout);
}

export function ChatExperience() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<VisitorProfile>({ name: "", email: "" });
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [statusState, setStatusState] = useState<StatusState>({ type: "ready" });
  const [language, setLanguage] = useState<Language>("es");
  const [languageReady, setLanguageReady] = useState(false);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useMediaQuery("(max-width: 900px)");
  const strings = translations[language];
  const sidebarVisible = isMobile ? sidebarOpen : !sidebarCollapsed;
  const statusLabel = statusLabelFor(statusState, strings);

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    let initialLanguage: Language = "es";

    if (typeof window !== "undefined") {
      const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (storedLanguage === "es" || storedLanguage === "en") {
        initialLanguage = storedLanguage;
      }
    }

    setLanguage(initialLanguage);
    setLanguageReady(true);

    const initialStrings = translations[initialLanguage];
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
        content: greetingFor(savedName, initialStrings),
      },
    ]);
  }, []);

  useEffect(() => {
    if (!languageReady || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language, languageReady]);

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
        content: greetingFor(cleanName, strings),
      },
    ]);
    setShowOnboarding(false);
  };

  const handleQuickPrompt = (prompt: string) => {
    setMessageDraft(prompt);
    requestAnimationFrame(() => {
      messageInputRef.current?.focus();
      messageInputRef.current?.setSelectionRange(prompt.length, prompt.length);
    });

    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Desktop collapses the sidebar; mobile toggles a drawer.
  const handleSidebarToggle = () => {
    if (isMobile) {
      setSidebarOpen((current) => !current);
      return;
    }

    setSidebarCollapsed((current) => !current);
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
      content: strings.pendingMessage,
      status: "pending",
    };

    setMessages((current) => [...current, userMessage, pendingAssistantMessage]);
    setMessageDraft("");
    setIsSending(true);
    setStatusState({ type: "sending" });

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
        throw new Error(sendBody.error ?? strings.errors.sendFailed);
      }

      setStatusState({ type: "accepted", status: sendBody.status });
      const finalStatus = await pollMessage(sendBody.messageId, strings);

      setMessages((current) =>
        current.map((message) =>
          message.id === pendingAssistantId
            ? {
                ...message,
                content: finalStatus.contentText || strings.status.final(finalStatus.status),
                status: finalStatus.status === "FAILED" ? "error" : "idle",
              }
            : message,
        ),
      );
      setStatusState({ type: "final", status: finalStatus.status });
    } catch (error) {
      const message = error instanceof Error ? error.message : strings.errors.sendUnexpected;
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
      setStatusState({ type: "error" });
    } finally {
      setIsSending(false);
    }
  };

  const handleComposerSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSendMessage();
  };

  const sidebarToggleLabel = isMobile
    ? sidebarOpen
      ? strings.aria.closeMenu
      : strings.aria.openMenu
    : sidebarCollapsed
      ? strings.aria.expandMenu
      : strings.aria.collapseMenu;

  return (
    <div
      className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${sidebarOpen ? "sidebar-open" : ""}`}
      data-sidebar-state={sidebarVisible ? "open" : "closed"}
    >
      <main className="chat-stage">
        <section className="chat-surface">
          <header className="chat-header">
            <div className="chat-title">
              <button
                type="button"
                className="sidebar-toggle"
                onClick={handleSidebarToggle}
                aria-label={sidebarToggleLabel}
                aria-expanded={sidebarVisible}
                aria-controls="sidebar"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    d="M9 6l6 6-6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <div>
                <p className="eyebrow">{strings.appName}</p>
                <h1>{strings.headerTitle}</h1>
                <p className="header-status">{statusLabel}</p>
              </div>
            </div>
            <div className="header-actions">
              <div className="language-switcher" role="group" aria-label={strings.aria.language}>
                <button
                  type="button"
                  onClick={() => setLanguage("es")}
                  className={language === "es" ? "active" : ""}
                  aria-pressed={language === "es"}
                >
                  ES
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage("en")}
                  className={language === "en" ? "active" : ""}
                  aria-pressed={language === "en"}
                >
                  EN
                </button>
              </div>
              <div className="profile-chip">
                <span>{profile.name || strings.profileFallbackName}</span>
                <small>{profile.email || strings.profileFallbackEmail}</small>
              </div>
            </div>
          </header>

          <div className="message-stream">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`message-card ${message.role === "user" ? "user" : "assistant"} ${message.status === "error" ? "error" : ""}`}
              >
                <span className="message-role">{message.role === "user" ? strings.role.user : strings.role.assistant}</span>
                <p>{message.content}</p>
              </article>
            ))}
          </div>

          <form className="composer" onSubmit={handleComposerSubmit}>
            <textarea
              ref={messageInputRef}
              value={messageDraft}
              onChange={(event) => setMessageDraft(event.target.value)}
              placeholder={strings.inputPlaceholder}
              rows={1}
              disabled={isSending}
            />
            <button type="submit" aria-label={strings.aria.sendMessage} disabled={isSending}>
              <span>{isSending ? "…" : "↗"}</span>
            </button>
          </form>
        </section>
      </main>

      {isMobile && (
        <button
          type="button"
          className={`sidebar-scrim ${sidebarOpen ? "visible" : ""}`}
          onClick={() => setSidebarOpen(false)}
          aria-label={strings.aria.closeMenu}
          aria-hidden={!sidebarOpen}
          tabIndex={sidebarOpen ? 0 : -1}
        />
      )}

      <aside id="sidebar" className="sidebar" aria-hidden={!sidebarVisible}>
        <div className="sidebar-middle">
          {sidebarVisible && (
            <>
              <div className="sidebar-name-block">
                <strong>{profile.name || strings.profileNewVisitor}</strong>
                <small>{profile.email || strings.profileFallbackEmail}</small>
              </div>
              <nav className="chat-list" aria-label={strings.chatListLabel}>
                {strings.quickPrompts.map((chat) => (
                  <button key={chat} type="button" className="chat-link" onClick={() => handleQuickPrompt(chat)}>
                    {chat}
                  </button>
                ))}
              </nav>
            </>
          )}
        </div>

        <div className="sidebar-footer">
          <div className="brand-orb">A</div>
          {sidebarVisible && <span>{strings.appName}</span>}
        </div>
      </aside>

      {showOnboarding && (
        <div className="onboarding-backdrop">
          <form className="onboarding-card" onSubmit={handleOnboardingSubmit}>
            <div>
              <p className="eyebrow">{strings.onboarding.eyebrow}</p>
              <h2>{strings.onboarding.title}</h2>
              <p className="onboarding-copy">{strings.onboarding.copy}</p>
            </div>

            <label>
              {strings.onboarding.nameLabel}
              <input
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder={strings.onboarding.namePlaceholder}
                required
              />
            </label>

            <label>
              {strings.onboarding.emailLabel}
              <input
                type="email"
                value={draftEmail}
                onChange={(event) => setDraftEmail(event.target.value)}
                placeholder={strings.onboarding.emailPlaceholder}
                required
              />
            </label>

            <button type="submit" className="primary-action">
              {strings.onboarding.submit}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
