"use client";

import { FormEvent, useEffect, useState } from "react";
import { COOKIE_MAX_AGE, EMAIL_COOKIE, NAME_COOKIE } from "@/lib/chat-config";
import styles from "./compliance-portal.module.css";

type View = "landing" | "login" | "signup" | "assessment";
type Locale = "es" | "en";
type PreferredLanguage = "ES" | "EN";
type Sector = "HEALTHCARE" | "HR";
type ArtifactType = "DOCUMENT_PDF";
type NoticeTone = "info" | "success" | "error";

type Notice = {
  tone: NoticeTone;
  key?: keyof (typeof copy)["es"]["notices"];
  text?: string;
};

type LoginFormState = {
  email: string;
  password: string;
};

type SignupFormState = {
  fullName: string;
  company: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type StoredAccount = {
  fullName: string;
  company: string;
  email: string;
  password: string;
  createdAt: string;
};

type AssessmentFormState = {
  tenantId: string;
  organizationId: string;
  userId: string;
  preferredLanguage: PreferredLanguage;
  sector: Sector;
  useCaseType: string;
  aiSystemCategory: string;
  geography: string;
  datasetProvided: boolean;
  systemName: string;
  systemVersion: string;
  provider: string;
  deploymentContext: string;
  usesPersonalData: boolean;
  usesSensitiveData: boolean;
  humanOversight: boolean;
  s3Bucket: string;
  s3Key: string;
  checksum: string;
  artifactMetadataText: string;
  extraIntakeAnswersText: string;
  healthcareAuditProfileJson: string;
};

type ArtifactRecord = {
  artifactId: string;
  fileName: string;
  artifactType: string;
};

type AssessmentResponse = {
  assessmentId: string;
  submissionId: string;
  traceId: string;
  idempotencyKey: string;
  regulatoryProfileId: string;
  status: string;
  assessment?: {
    regulatoryProfileId?: string;
    artifacts?: ArtifactRecord[];
  };
};

type AnalysisFinding = {
  findingId?: string;
  controlId?: string;
  title?: string;
  severity?: string;
  status?: string;
  rationale?: string;
};

type DocumentAnalysisResponse = {
  assessmentId: string;
  artifactId: string;
  regulatoryProfileId: string;
  pageCount: number;
  extractedCharacterCount: number;
  extractedTextPreview: string;
  analyzedAt: string;
  findings?: AnalysisFinding[];
};

type ReportSection = {
  title: string;
  summary: string;
  items: string[];
};

type GeneratedAssessmentReport = {
  reportId: string;
  assessmentId: string;
  preferredLanguage: PreferredLanguage;
  generatedAt: string;
  webReport: {
    title: string;
    subtitle: string;
    htmlContent: string;
    sections: ReportSection[];
  };
  pdfReportArtifact: {
    fileName: string;
    contentType: string;
    sizeBytes: number;
    base64Content: string;
  };
};

type PublishedReportResponse = {
  generatedAssessmentReport: GeneratedAssessmentReport;
  reportAccessUrl: string;
  pdfDownloadUrl: string;
};

type NotificationResponse = {
  notificationId: string;
  assessmentId: string;
  tenantId: string;
  channel: string;
  recipients: string[];
  subject: string;
  body: string;
  reportAccessUrl: string;
  deliveryStatus: string;
  providerMessageId?: string | null;
  generatedAt: string;
};

type PayloadPreview = {
  tenantId: string;
  organizationId: string;
  userId: string;
  preferredLanguage: PreferredLanguage;
  sector: Sector;
  useCaseType: string;
  aiSystemCategory: string;
  geography: string;
  datasetProvided: boolean;
  systemName: string;
  systemVersion: string;
  provider: string;
  deploymentContext: string;
  artifacts: Array<{
    artifactType: ArtifactType;
    fileName: string;
    s3Bucket: string;
    s3Key: string;
    checksum: string | null;
    contentType: string;
    sizeBytes: number;
    uploadedAt: string;
    metadata: Record<string, string>;
  }>;
  healthcareAuditProfile?: unknown;
  intakeAnswers: Record<string, string>;
};

const copy = {
  es: {
    appEyebrow: "ALO Compliance",
    appTitle: "Portal de evaluacion de cumplimiento para IA",
    navHome: "Inicio",
    navLogin: "Login",
    navSignup: "Crear cuenta",
    langEs: "ES",
    langEn: "EN",
    landingEyebrow: "Evaluacion digital",
    landingTitle: "Evalua documentacion de sistemas de IA y detecta brechas regulatorias desde una sola vista.",
    landingLead:
      "La plataforma permite registrar evaluaciones, cargar el PDF principal y obtener una primera revision documental orientada a EU AI Act y GDPR para Healthcare y HR.",
    landingPrimaryCta: "Iniciar evaluacion",
    landingSecondaryCta: "Crear cuenta",
    metricAssessmentTitle: "Evaluacion guiada",
    metricAssessmentText: "Captura el contexto del sistema, el sector y los datos clave para perfilar la revision regulatoria.",
    metricDocumentTitle: "Revision documental",
    metricDocumentText: "Carga el PDF principal y dispara el analisis inicial de documentacion tecnica y evidencia disponible.",
    metricProfileTitle: "Cobertura inicial",
    metricProfileText: "El flujo prepara la evaluacion para casos de Healthcare y HR con señales de privacidad, riesgo y supervision humana.",
    sideWhatTitle: "Lo que puedes hacer en la plataforma",
    sideWhatItems: [
      "Crear una cuenta y acceder al portal desde la misma interfaz.",
      "Registrar una nueva evaluacion con contexto de negocio y regulacion.",
      "Cargar el PDF principal del sistema de IA para iniciar la revision.",
      "Obtener una respuesta inicial del flujo documental sin salir del portal.",
    ],
    backendTarget: "Estado del servicio",
    backendInfo:
      "El portal puede trabajar contra el backend de compliance configurado o usar respuestas de respaldo mientras se termina la integracion completa.",
    loginSideTitle: "Acceso al portal",
    loginSideText:
      "Ingresa para crear una evaluacion, cargar documentacion y revisar el resultado inicial del analisis documental.",
    needAccount: "Necesito crear cuenta",
    loginEyebrow: "Login",
    loginTitle: "Acceder a tu espacio de evaluacion",
    emailLabel: "Correo",
    emailPlaceholder: "compliance@empresa.com",
    passwordLabel: "Password",
    passwordPlaceholder: "********",
    loginSubmit: "Entrar al portal",
    loginCreateAccount: "Crear cuenta",
    signupSideLabel: "Cuenta nueva",
    signupSideTitle: "Registro rapido para iniciar",
    signupSideText:
      "Crea tu acceso para comenzar una evaluacion y centralizar la documentacion del sistema de IA.",
    signupEyebrow: "Crear cuenta",
    signupTitle: "Crear cuenta",
    fullNameLabel: "Nombre",
    fullNamePlaceholder: "Jose Guerrero",
    companyLabel: "Empresa",
    companyPlaceholder: "Alo Health",
    confirmPasswordLabel: "Confirmar password",
    signupSubmit: "Crear cuenta y continuar",
    alreadyHaveAccount: "Ya tengo cuenta",
    assessmentEyebrow: "Nueva evaluacion",
    assessmentTitle: "Registrar evaluacion y cargar documento principal",
    assessmentText:
      "Completa el contexto del sistema, adjunta el PDF principal y activa la revision inicial del cumplimiento documental.",
    baseSectionTitle: "Contexto de la evaluacion",
    baseSectionText: "Datos necesarios para clasificar el caso de uso y preparar la revision regulatoria.",
    systemSectionTitle: "Sistema de IA",
    systemSectionText: "Informacion operativa y de riesgo utilizada para contextualizar la evaluacion.",
    documentSectionTitle: "Documento principal del sistema",
    documentSectionText: "Carga el PDF obligatorio que describe el sistema, su uso y su documentacion tecnica disponible.",
    extraAnswersLabel: "intakeAnswers extra",
    extraAnswersHelp:
      "Datos adicionales en formato clave=valor. Se agregan al payload para enriquecer el contexto regulatorio y operativo.",
    healthcareProfileLabel: "healthcareAuditProfile opcional",
    healthcareProfileHelp:
      "Bloque JSON opcional para ampliar el perfil clinico o sectorial. Solo usalo si tienes informacion estructurada valida.",
    healthcareProfilePlaceholder: '{"purpose":{"summary":"Clinical triage"}}',
    uploadLabel: "Archivo PDF",
    uploadHelp: "El portal completa la metadata basica del archivo al momento de seleccionarlo.",
    noFile: "Sin archivo",
    checksumPlaceholder: "Opcional",
    metadataLabel: "artifact metadata",
    metadataPlaceholder: "owner=compliance-team\nreviewStage=intake",
    extraAnswersPlaceholder: "riskCommitteeAssigned=true\nhumanReviewOwner=clinical-lead",
    sending: "Enviando...",
    assessmentSubmit: "Enviar evaluacion y analizar documento",
    backToLogin: "Volver al login",
    activeSession: "Sesion activa",
    backendState: "Estado backend",
    documentResult: "Resultado inicial del analisis",
    pages: "Paginas",
    characters: "Caracteres",
    preview: "Preview",
    pending: "Pendiente",
    payloadPreview: "Resumen tecnico enviado",
    viewSentJson: "Ver detalle tecnico",
    tenantIdLabel: "Tenant ID",
    organizationIdLabel: "Organization ID",
    userIdLabel: "User ID",
    preferredLanguageLabel: "Idioma preferido *",
    sectorLabel: "Sector *",
    geographyLabel: "Geografia / pais operativo *",
    geographyPlaceholder: "Mexico",
    useCaseTypeLabel: "Tipo de caso de uso *",
    useCaseTypePlaceholder: "Soporte a decision clinica",
    aiSystemCategoryLabel: "Categoria del sistema de IA *",
    aiSystemCategoryPlaceholder: "IA medica de alto riesgo",
    systemNameLabel: "Nombre del sistema *",
    systemNamePlaceholder: "CertifAI Triage Review",
    systemVersionLabel: "Version del sistema *",
    systemVersionPlaceholder: "1.0.0",
    providerLabel: "Proveedor / owner del sistema",
    providerPlaceholder: "Alo Health",
    deploymentContextLabel: "Contexto de despliegue *",
    deploymentContextPlaceholder: "Private cloud hospital deployment",
    usesPersonalDataLabel: "Usa datos personales",
    usesSensitiveDataLabel: "Usa datos sensibles",
    humanOversightLabel: "Tiene supervision humana",
    datasetProvidedLabel: "Incluye dataset opcional",
    s3BucketLabel: "Bucket de carga",
    s3KeyLabel: "Ruta del archivo en storage",
    s3KeyPlaceholder: "uploads/main-document.pdf",
    checksumLabel: "Checksum del archivo",
    checksumHelp:
      "Huella opcional del PDF para trazabilidad e integridad. Si no la tienes, el flujo puede continuar sin este dato.",
    metadataHelp:
      "Metadata adicional del artifact en formato clave=valor. Sirve para ownership, stage, origen u otras marcas operativas.",
    notices: {
      invalidLogin: "Completa correo y password para continuar.",
      frontendLoginReady:
        "Sesion iniciada. Ya puedes registrar una evaluacion y cargar el PDF principal.",
      missingSignup: "Completa los datos de la cuenta antes de continuar.",
      passwordMismatch: "La confirmacion de password no coincide.",
      invalidCredentials: "Correo o password incorrectos.",
      accountExists: "Ya existe una cuenta con ese correo.",
      accountReady: "Cuenta creada. El siguiente paso es ingresar y comenzar la evaluacion.",
      missingFile: "Selecciona un PDF antes de enviar el assessment.",
      datasetUnsupported:
        "Esta version solo envia el PDF principal. Deja datasetProvided apagado hasta agregar la carga de dataset.",
      invalidHealthcareProfile:
        "El bloque opcional healthcareAuditProfile debe ser JSON valido.",
      sendingAssessment: "Registrando la evaluacion y enviando el documento al flujo de revision.",
      missingBackendFields: "La respuesta del backend no devolvio artifactId o regulatoryProfileId.",
      assessmentFailed: "No fue posible crear el assessment.",
      documentFailed: "No fue posible analizar el documento.",
      success: "Evaluacion recibida y analisis documental inicial ejecutado correctamente.",
      generic: "Fallo el flujo del assessment.",
    },
  },
  en: {
    appEyebrow: "ALO Compliance",
    appTitle: "AI compliance assessment portal",
    navHome: "Home",
    navLogin: "Login",
    navSignup: "Create account",
    langEs: "ES",
    langEn: "EN",
    landingEyebrow: "Digital assessment",
    landingTitle: "Evaluate AI system documentation and detect regulatory gaps from a single workspace.",
    landingLead:
      "The platform lets teams register assessments, upload the main PDF, and obtain an initial documentary review aligned with the EU AI Act and GDPR for Healthcare and HR.",
    landingPrimaryCta: "Start assessment",
    landingSecondaryCta: "Create account",
    metricAssessmentTitle: "Guided assessment",
    metricAssessmentText: "Captures system context, sector, and key inputs to profile the regulatory review.",
    metricDocumentTitle: "Document review",
    metricDocumentText: "Uploads the main PDF and triggers the initial analysis of technical documentation and available evidence.",
    metricProfileTitle: "Initial coverage",
    metricProfileText: "The flow prepares the review for Healthcare and HR with privacy, risk, and human oversight signals.",
    sideWhatTitle: "What you can do in the platform",
    sideWhatItems: [
      "Create an account and access the portal from the same interface.",
      "Register a new assessment with business and regulatory context.",
      "Upload the main AI-system PDF to start the review.",
      "Receive an initial documentary response without leaving the portal.",
    ],
    backendTarget: "Service status",
    backendInfo:
      "The portal can work against the configured compliance backend or use fallback responses while the full integration is being completed.",
    loginSideTitle: "Portal access",
    loginSideText:
      "Sign in to create an assessment, upload documentation, and review the initial documentary output.",
    needAccount: "I need an account",
    loginEyebrow: "Login",
    loginTitle: "Access your assessment workspace",
    emailLabel: "Email",
    emailPlaceholder: "compliance@company.com",
    passwordLabel: "Password",
    passwordPlaceholder: "********",
    loginSubmit: "Enter portal",
    loginCreateAccount: "Create account",
    signupSideLabel: "New account",
    signupSideTitle: "Fast onboarding to get started",
    signupSideText:
      "Create your access and start a new assessment to centralize AI-system documentation.",
    signupEyebrow: "Create account",
    signupTitle: "Create account",
    fullNameLabel: "Full name",
    fullNamePlaceholder: "Jose Guerrero",
    companyLabel: "Company",
    companyPlaceholder: "Alo Health",
    confirmPasswordLabel: "Confirm password",
    signupSubmit: "Create account and continue",
    alreadyHaveAccount: "I already have an account",
    assessmentEyebrow: "New assessment",
    assessmentTitle: "Register an assessment and upload the main document",
    assessmentText:
      "Complete the system context, attach the main PDF, and trigger the initial documentary compliance review.",
    baseSectionTitle: "Assessment context",
    baseSectionText: "Inputs required to classify the use case and prepare the regulatory review.",
    systemSectionTitle: "AI system",
    systemSectionText: "Operational and risk information used to contextualize the review.",
    documentSectionTitle: "Main system document",
    documentSectionText: "Upload the mandatory PDF describing the system, its use, and the technical documentation currently available.",
    extraAnswersLabel: "extra intakeAnswers",
    extraAnswersHelp:
      "Additional key=value inputs appended to the payload to enrich regulatory and operational context.",
    healthcareProfileLabel: "optional healthcareAuditProfile",
    healthcareProfileHelp:
      "Optional JSON block to extend the clinical or sector profile. Use it only when you have valid structured data.",
    healthcareProfilePlaceholder: '{"purpose":{"summary":"Clinical triage"}}',
    uploadLabel: "PDF file",
    uploadHelp: "The portal fills the basic file metadata when you select the document.",
    noFile: "No file selected",
    checksumPlaceholder: "Optional",
    metadataLabel: "artifact metadata",
    metadataPlaceholder: "owner=compliance-team\nreviewStage=intake",
    extraAnswersPlaceholder: "riskCommitteeAssigned=true\nhumanReviewOwner=clinical-lead",
    sending: "Sending...",
    assessmentSubmit: "Submit assessment and analyze document",
    backToLogin: "Back to login",
    activeSession: "Active session",
    backendState: "Backend state",
    documentResult: "Initial analysis result",
    pages: "Pages",
    characters: "Characters",
    preview: "Preview",
    pending: "Pending",
    payloadPreview: "Technical payload summary",
    viewSentJson: "View technical detail",
    tenantIdLabel: "Tenant ID",
    organizationIdLabel: "Organization ID",
    userIdLabel: "User ID",
    preferredLanguageLabel: "Preferred language *",
    sectorLabel: "Sector *",
    geographyLabel: "Operating geography / country *",
    geographyPlaceholder: "Mexico",
    useCaseTypeLabel: "Use case type *",
    useCaseTypePlaceholder: "Clinical decision support",
    aiSystemCategoryLabel: "AI system category *",
    aiSystemCategoryPlaceholder: "High-risk medical AI",
    systemNameLabel: "System name *",
    systemNamePlaceholder: "CertifAI Triage Review",
    systemVersionLabel: "System version *",
    systemVersionPlaceholder: "1.0.0",
    providerLabel: "System provider / owner",
    providerPlaceholder: "Alo Health",
    deploymentContextLabel: "Deployment context *",
    deploymentContextPlaceholder: "Private cloud hospital deployment",
    usesPersonalDataLabel: "Uses personal data",
    usesSensitiveDataLabel: "Uses sensitive data",
    humanOversightLabel: "Has human oversight",
    datasetProvidedLabel: "Includes optional dataset",
    s3BucketLabel: "Upload bucket",
    s3KeyLabel: "Storage file path",
    s3KeyPlaceholder: "uploads/main-document.pdf",
    checksumLabel: "File checksum",
    checksumHelp:
      "Optional PDF fingerprint for traceability and integrity. The flow can continue without it if unavailable.",
    metadataHelp:
      "Additional artifact metadata in key=value format. Useful for ownership, stage, source, or other operational markers.",
    notices: {
      invalidLogin: "Enter both email and password to continue.",
      frontendLoginReady:
        "Session started. You can now register an assessment and upload the main PDF.",
      missingSignup: "Complete the account details before continuing.",
      passwordMismatch: "Password confirmation does not match.",
      invalidCredentials: "Email or password is incorrect.",
      accountExists: "An account with that email already exists.",
      accountReady: "Account created. The next step is to sign in and start the assessment.",
      missingFile: "Select a PDF before submitting the assessment.",
      datasetUnsupported:
        "This version only sends the primary PDF. Keep datasetProvided disabled until dataset upload is added.",
      invalidHealthcareProfile:
        "The optional healthcareAuditProfile block must be valid JSON.",
      sendingAssessment: "Registering the assessment and sending the document into the review flow.",
      missingBackendFields: "The backend response did not return artifactId or regulatoryProfileId.",
      assessmentFailed: "The assessment could not be created.",
      documentFailed: "The document could not be analyzed.",
      success: "Assessment received and initial document analysis completed successfully.",
      generic: "The assessment flow failed.",
    },
  },
} as const;

const preferredLanguageOptions = [
  { value: "ES" as const, es: "Español", en: "Spanish" },
  { value: "EN" as const, es: "Ingles", en: "English" },
];

const sectorOptions = [
  { value: "HEALTHCARE" as const, label: "Healthcare" },
  { value: "HR" as const, label: "HR" },
];

const defaultLoginForm: LoginFormState = {
  email: "",
  password: "",
};

const defaultSignupForm: SignupFormState = {
  fullName: "",
  company: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const defaultAssessmentForm: AssessmentFormState = {
  tenantId: "tenant-alo",
  organizationId: "org-alo",
  userId: "",
  preferredLanguage: "ES",
  sector: "HEALTHCARE",
  useCaseType: "",
  aiSystemCategory: "",
  geography: "",
  datasetProvided: false,
  systemName: "",
  systemVersion: "",
  provider: "Alo",
  deploymentContext: "",
  usesPersonalData: true,
  usesSensitiveData: true,
  humanOversight: true,
  s3Bucket: "alo-intake-dev",
  s3Key: "",
  checksum: "",
  artifactMetadataText: "",
  extraIntakeAnswersText: "",
  healthcareAuditProfileJson: "",
};

const ACCOUNTS_STORAGE_KEY = "alo_front_accounts";
const ACTIVE_ACCOUNT_STORAGE_KEY = "alo_front_active_account";

function buildAccountContext(company: string) {
  const companySlug = slugify(company) || "alo";
  return {
    tenantId: `tenant-${companySlug}`,
    organizationId: companySlug === "alo" ? "org-alo" : companySlug,
  };
}

function readStoredAccounts() {
  if (typeof window === "undefined") {
    return [] as StoredAccount[];
  }

  try {
    const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (!raw) {
      return [] as StoredAccount[];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StoredAccount[]) : [];
  } catch {
    return [] as StoredAccount[];
  }
}

function writeStoredAccounts(accounts: StoredAccount[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

function readActiveAccount() {
  if (typeof window === "undefined") {
    return null as StoredAccount | null;
  }

  try {
    const raw = window.localStorage.getItem(ACTIVE_ACCOUNT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAccount) : null;
  } catch {
    return null as StoredAccount | null;
  }
}

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

function activateAccount(account: StoredAccount) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACTIVE_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
  writeCookie(NAME_COOKIE, account.fullName);
  writeCookie(EMAIL_COOKIE, account.email);
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseKeyValueText(value: string) {
  const parsed: Record<string, string> = {};

  value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const separatorIndex = line.includes("=") ? line.indexOf("=") : line.indexOf(":");
      if (separatorIndex <= 0) {
        return;
      }

      const key = line.slice(0, separatorIndex).trim();
      const itemValue = line.slice(separatorIndex + 1).trim();

      if (key && itemValue) {
        parsed[key] = itemValue;
      }
    });

  return parsed;
}

function formatDate(value: string | undefined, locale: Locale, pending: string) {
  if (!value) {
    return pending;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function resolveNoticeText(localeCopy: (typeof copy)[Locale], notice: Notice | null) {
  if (!notice) {
    return "";
  }
  if (notice.key) {
    return localeCopy.notices[notice.key];
  }
  return notice.text ?? "";
}

function renderInfoLabel(label: string, help: string) {
  return (
    <span title={help} style={{ cursor: "help" }}>
      {label}
    </span>
  );
}

export function CompliancePortal() {
  const [locale, setLocale] = useState<Locale>("es");
  const [activeView, setActiveView] = useState<View>("landing");
  const [loginForm, setLoginForm] = useState<LoginFormState>(defaultLoginForm);
  const [signupForm, setSignupForm] = useState<SignupFormState>(defaultSignupForm);
  const [assessmentForm, setAssessmentForm] = useState<AssessmentFormState>(defaultAssessmentForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [assessmentResponse, setAssessmentResponse] = useState<AssessmentResponse | null>(null);
  const [analysisResponse, setAnalysisResponse] = useState<DocumentAnalysisResponse | null>(null);
  const [publishedReport, setPublishedReport] = useState<PublishedReportResponse | null>(null);
  const [notificationResponse, setNotificationResponse] = useState<NotificationResponse | null>(null);
  const [payloadPreview, setPayloadPreview] = useState<PayloadPreview | null>(null);

  const t = copy[locale];
  const currentArtifact = assessmentResponse?.assessment?.artifacts?.[0];

  useEffect(() => {
    const activeAccount = readActiveAccount();
    if (!activeAccount) {
      return;
    }

    const { tenantId, organizationId } = buildAccountContext(activeAccount.company);
    setLoginForm({ email: activeAccount.email, password: "" });
    setAssessmentForm((current) => ({
      ...current,
      tenantId,
      organizationId,
      userId: activeAccount.email,
      provider: activeAccount.company,
    }));
  }, []);

  function updateLogin<K extends keyof LoginFormState>(key: K, value: LoginFormState[K]) {
    setLoginForm((current) => ({ ...current, [key]: value }));
  }

  function updateSignup<K extends keyof SignupFormState>(key: K, value: SignupFormState[K]) {
    setSignupForm((current) => ({ ...current, [key]: value }));
  }

  function updateAssessment<K extends keyof AssessmentFormState>(
    key: K,
    value: AssessmentFormState[K],
  ) {
    setAssessmentForm((current) => ({ ...current, [key]: value }));
  }

  function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password.trim();
    if (!email || !password) {
      setNotice({ tone: "error", key: "invalidLogin" });
      return;
    }

    const account = readStoredAccounts().find(
      (candidate) => candidate.email === email && candidate.password === password,
    );
    if (!account) {
      setNotice({ tone: "error", key: "invalidCredentials" });
      return;
    }

    const { tenantId, organizationId } = buildAccountContext(account.company);
    activateAccount(account);
    setLoginForm({ email: account.email, password: "" });
    setAssessmentForm((current) => ({
      ...current,
      userId: account.email,
      tenantId,
      organizationId,
      provider: account.company,
    }));
    setActiveView("assessment");
    setNotice({ tone: "success", key: "frontendLoginReady" });
  }

  function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fullName = signupForm.fullName.trim();
    const company = signupForm.company.trim();
    const email = signupForm.email.trim().toLowerCase();
    const password = signupForm.password.trim();

    if (!fullName || !company || !email || !password) {
      setNotice({ tone: "error", key: "missingSignup" });
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setNotice({ tone: "error", key: "passwordMismatch" });
      return;
    }

    const existingAccounts = readStoredAccounts();
    if (existingAccounts.some((account) => account.email === email)) {
      setNotice({ tone: "error", key: "accountExists" });
      return;
    }

    const account: StoredAccount = {
      fullName,
      company,
      email,
      password,
      createdAt: new Date().toISOString(),
    };
    writeStoredAccounts([...existingAccounts, account]);

    const { tenantId, organizationId } = buildAccountContext(company);
    setLoginForm({ email, password: "" });
    setAssessmentForm((current) => ({
      ...current,
      tenantId,
      organizationId,
      userId: email,
      provider: company,
    }));
    setActiveView("login");
    setNotice({ tone: "success", key: "accountReady" });
  }

  async function handleAssessmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setNotice({ tone: "error", key: "missingFile" });
      return;
    }

    if (assessmentForm.datasetProvided) {
      setNotice({ tone: "error", key: "datasetUnsupported" });
      return;
    }

    let healthcareAuditProfile: unknown;
    if (assessmentForm.healthcareAuditProfileJson.trim()) {
      try {
        healthcareAuditProfile = JSON.parse(assessmentForm.healthcareAuditProfileJson);
      } catch {
        setNotice({ tone: "error", key: "invalidHealthcareProfile" });
        return;
      }
    }

    const artifactMetadata = parseKeyValueText(assessmentForm.artifactMetadataText);
    const extraIntakeAnswers = parseKeyValueText(assessmentForm.extraIntakeAnswersText);
    const fileKey = assessmentForm.s3Key.trim() || `uploads/${Date.now()}-${selectedFile.name}`;
    const uploadedAt = new Date().toISOString();

    const assessmentPayload: PayloadPreview = {
      tenantId: assessmentForm.tenantId.trim(),
      organizationId: assessmentForm.organizationId.trim(),
      userId: assessmentForm.userId.trim() || loginForm.email.trim().toLowerCase(),
      preferredLanguage: assessmentForm.preferredLanguage,
      sector: assessmentForm.sector,
      useCaseType: assessmentForm.useCaseType.trim(),
      aiSystemCategory: assessmentForm.aiSystemCategory.trim(),
      geography: assessmentForm.geography.trim(),
      datasetProvided: assessmentForm.datasetProvided,
      systemName: assessmentForm.systemName.trim(),
      systemVersion: assessmentForm.systemVersion.trim(),
      provider: assessmentForm.provider.trim(),
      deploymentContext: assessmentForm.deploymentContext.trim(),
      artifacts: [
        {
          artifactType: "DOCUMENT_PDF",
          fileName: selectedFile.name,
          s3Bucket: assessmentForm.s3Bucket.trim(),
          s3Key: fileKey,
          checksum: assessmentForm.checksum.trim() || null,
          contentType: selectedFile.type || "application/pdf",
          sizeBytes: selectedFile.size,
          uploadedAt,
          metadata: artifactMetadata,
        },
      ],
      intakeAnswers: {
        usesPersonalData: String(assessmentForm.usesPersonalData),
        usesSensitiveData: String(assessmentForm.usesSensitiveData),
        humanOversight: String(assessmentForm.humanOversight),
        ...extraIntakeAnswers,
      },
    };

    if (healthcareAuditProfile) {
      assessmentPayload.healthcareAuditProfile = healthcareAuditProfile;
    }

    setSubmitting(true);
    setAssessmentResponse(null);
    setAnalysisResponse(null);
    setPublishedReport(null);
    setNotificationResponse(null);
    setPayloadPreview(assessmentPayload);
    setNotice({ tone: "info", key: "sendingAssessment" });

    try {
      const assessmentRequest = await fetch("/api/assessment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assessmentPayload),
      });

      const assessmentBody = (await assessmentRequest.json()) as AssessmentResponse & { error?: string };
      if (!assessmentRequest.ok) {
        throw new Error(assessmentBody.error ?? t.notices.assessmentFailed);
      }

      setAssessmentResponse(assessmentBody);

      const artifactId = assessmentBody.assessment?.artifacts?.[0]?.artifactId;
      const regulatoryProfileId =
        assessmentBody.regulatoryProfileId ?? assessmentBody.assessment?.regulatoryProfileId;

      if (!artifactId || !regulatoryProfileId) {
        throw new Error(t.notices.missingBackendFields);
      }

      const documentFormData = new FormData();
      documentFormData.append("assessmentId", assessmentBody.assessmentId);
      documentFormData.append("artifactId", artifactId);
      documentFormData.append("preferredLanguage", assessmentForm.preferredLanguage);
      documentFormData.append("sector", assessmentForm.sector);
      documentFormData.append("regulatoryProfileId", regulatoryProfileId);
      documentFormData.append("file", selectedFile);

      const analysisRequest = await fetch("/api/document-analysis", {
        method: "POST",
        body: documentFormData,
      });

      const analysisBody = (await analysisRequest.json()) as DocumentAnalysisResponse & {
        error?: string;
      };
      if (!analysisRequest.ok) {
        throw new Error(analysisBody.error ?? t.notices.documentFailed);
      }

      setAnalysisResponse(analysisBody);

      const reportRequest = await fetch("/api/report/finalize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assessment: assessmentBody.assessment,
          documentAnalysisResult: analysisBody,
          recipients: [assessmentPayload.userId],
        }),
      });

      const reportBody = (await reportRequest.json()) as PublishedReportResponse & { error?: string };
      if (!reportRequest.ok) {
        throw new Error(reportBody.error ?? "The final report could not be generated.");
      }
      setPublishedReport(reportBody);

      const notificationRequest = await fetch("/api/notification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          generatedAssessmentReport: reportBody.generatedAssessmentReport,
          tenantId: assessmentPayload.tenantId,
          recipients: [assessmentPayload.userId],
          reportAccessUrl: reportBody.reportAccessUrl,
        }),
      });

      const notificationBody = (await notificationRequest.json()) as NotificationResponse & { error?: string };
      if (!notificationRequest.ok) {
        throw new Error(notificationBody.error ?? "The notification email could not be generated.");
      }
      setNotificationResponse(notificationBody);
      setNotice({
        tone: "success",
        text:
          locale === "es"
            ? `Evaluacion completada. Reporte ${reportBody.generatedAssessmentReport.reportId} listo y correo ${notificationBody.deliveryStatus.toLowerCase()}.`
            : `Assessment completed. Report ${reportBody.generatedAssessmentReport.reportId} is ready and email status is ${notificationBody.deliveryStatus.toLowerCase()}.`,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : t.notices.generic,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.brandBlock}>
            <span className={styles.brandBadge}>ALO</span>
            <div>
              <p className={styles.eyebrow}>{t.appEyebrow}</p>
              <h1 className={styles.brandTitle}>{t.appTitle}</h1>
            </div>
          </div>

          <div className={styles.toolbar}>
            <nav className={styles.headerActions}>
              <button className={styles.ghostButton} type="button" onClick={() => setActiveView("landing")}>
                {t.navHome}
              </button>
              <button className={styles.ghostButton} type="button" onClick={() => setActiveView("login")}>
                {t.navLogin}
              </button>
              <button className={styles.primaryButton} type="button" onClick={() => setActiveView("signup")}>
                {t.navSignup}
              </button>
            </nav>

            <div className={styles.localeSwitcher} aria-label="Language switcher">
              <button
                className={`${styles.localeButton} ${locale === "es" ? styles.localeButtonActive : ""}`}
                type="button"
                onClick={() => setLocale("es")}
              >
                {t.langEs}
              </button>
              <button
                className={`${styles.localeButton} ${locale === "en" ? styles.localeButtonActive : ""}`}
                type="button"
                onClick={() => setLocale("en")}
              >
                {t.langEn}
              </button>
            </div>
          </div>
        </header>

        {notice ? (
          <div className={`${styles.notice} ${styles[`notice${notice.tone}`]}`}>{resolveNoticeText(t, notice)}</div>
        ) : null}

        {activeView === "landing" ? (
          <section className={styles.heroGrid}>
            <article className={styles.heroCard}>
              <p className={styles.eyebrow}>{t.landingEyebrow}</p>
              <h2>{t.landingTitle}</h2>
              <p className={styles.lead}>{t.landingLead}</p>

              <div className={styles.heroActions}>
                <button className={styles.primaryButton} type="button" onClick={() => setActiveView("login")}>
                  {t.landingPrimaryCta}
                </button>
                <button className={styles.ghostButton} type="button" onClick={() => setActiveView("signup")}>
                  {t.landingSecondaryCta}
                </button>
              </div>

              <div className={styles.metrics}>
                <div className={styles.metricCard}>
                  <strong>{t.metricAssessmentTitle}</strong>
                  <span>{t.metricAssessmentText}</span>
                </div>
                <div className={styles.metricCard}>
                  <strong>{t.metricDocumentTitle}</strong>
                  <span>{t.metricDocumentText}</span>
                </div>
                <div className={styles.metricCard}>
                  <strong>{t.metricProfileTitle}</strong>
                  <span>{t.metricProfileText}</span>
                </div>
              </div>
            </article>

            <aside className={styles.sideCard}>
              <p className={styles.sideLabel}>{t.sideWhatTitle}</p>
              <ul className={styles.sideList}>
                {t.sideWhatItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>

              <div className={styles.infoPanel}>
                <span>{t.backendTarget}</span>
                <strong>ALO Compliance Platform</strong>
                <p>{t.backendInfo}</p>
              </div>
            </aside>
          </section>
        ) : null}

        {activeView === "login" ? (
          <section className={styles.authGrid}>
            <article className={styles.sideCard}>
              <p className={styles.sideLabel}>{t.navLogin}</p>
              <h2>{t.loginSideTitle}</h2>
              <p className={styles.leadSmall}>{t.loginSideText}</p>
              <button className={styles.linkButton} type="button" onClick={() => setActiveView("signup")}>
                {t.needAccount}
              </button>
            </article>

            <form className={styles.formCard} onSubmit={handleLogin}>
              <div className={styles.cardHeader}>
                <p className={styles.eyebrow}>{t.loginEyebrow}</p>
                <h2>{t.loginTitle}</h2>
              </div>

              <div className={styles.formStack}>
                <label className={styles.field}>
                  <span>{t.emailLabel}</span>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(event) => updateLogin("email", event.target.value)}
                    placeholder={t.emailPlaceholder}
                  />
                </label>

                <label className={styles.field}>
                  <span>{t.passwordLabel}</span>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => updateLogin("password", event.target.value)}
                    placeholder={t.passwordPlaceholder}
                  />
                </label>
              </div>

              <div className={styles.formActions}>
                <button className={styles.primaryButton} type="submit">
                  {t.loginSubmit}
                </button>
                <button className={styles.ghostButton} type="button" onClick={() => setActiveView("signup")}>
                  {t.loginCreateAccount}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {activeView === "signup" ? (
          <section className={styles.authGrid}>
            <article className={styles.sideCard}>
              <p className={styles.sideLabel}>{t.signupSideLabel}</p>
              <h2>{t.signupSideTitle}</h2>
              <p className={styles.leadSmall}>{t.signupSideText}</p>
            </article>

            <form className={styles.formCard} onSubmit={handleSignup}>
              <div className={styles.cardHeader}>
                <p className={styles.eyebrow}>{t.signupEyebrow}</p>
                <h2>{t.signupTitle}</h2>
              </div>

              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span>{t.fullNameLabel}</span>
                  <input
                    type="text"
                    value={signupForm.fullName}
                    onChange={(event) => updateSignup("fullName", event.target.value)}
                    placeholder={t.fullNamePlaceholder}
                  />
                </label>

                <label className={styles.field}>
                  <span>{t.companyLabel}</span>
                  <input
                    type="text"
                    value={signupForm.company}
                    onChange={(event) => updateSignup("company", event.target.value)}
                    placeholder={t.companyPlaceholder}
                  />
                </label>

                <label className={styles.field}>
                  <span>{t.emailLabel}</span>
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(event) => updateSignup("email", event.target.value)}
                    placeholder={t.emailPlaceholder}
                  />
                </label>

                <label className={styles.field}>
                  <span>{t.passwordLabel}</span>
                  <input
                    type="password"
                    value={signupForm.password}
                    onChange={(event) => updateSignup("password", event.target.value)}
                    placeholder={t.passwordPlaceholder}
                  />
                </label>

                <label className={styles.field}>
                  <span>{t.confirmPasswordLabel}</span>
                  <input
                    type="password"
                    value={signupForm.confirmPassword}
                    onChange={(event) => updateSignup("confirmPassword", event.target.value)}
                    placeholder={t.passwordPlaceholder}
                  />
                </label>
              </div>

              <div className={styles.formActions}>
                <button className={styles.primaryButton} type="submit">
                  {t.signupSubmit}
                </button>
                <button className={styles.ghostButton} type="button" onClick={() => setActiveView("login")}>
                  {t.alreadyHaveAccount}
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {activeView === "assessment" ? (
          <section className={styles.assessmentGrid}>
            <form className={styles.formCard} onSubmit={handleAssessmentSubmit}>
              <div className={styles.cardHeader}>
                <p className={styles.eyebrow}>{t.assessmentEyebrow}</p>
                <h2>{t.assessmentTitle}</h2>
                <p className={styles.leadSmall}>{t.assessmentText}</p>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeading}>
                  <h3>{t.baseSectionTitle}</h3>
                  <span>{t.baseSectionText}</span>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>{t.tenantIdLabel}</span>
                    <input
                      type="text"
                      value={assessmentForm.tenantId}
                      readOnly
                    />
                  </label>

                  <label className={styles.field}>
                    <span>{t.organizationIdLabel}</span>
                    <input
                      type="text"
                      value={assessmentForm.organizationId}
                      readOnly
                    />
                  </label>

                  <label className={styles.field}>
                    <span>{t.userIdLabel}</span>
                    <input
                      type="email"
                      value={assessmentForm.userId}
                      readOnly
                    />
                  </label>

                  <label className={styles.field}>
                    <span>{t.preferredLanguageLabel}</span>
                    <select
                      value={assessmentForm.preferredLanguage}
                      onChange={(event) =>
                        updateAssessment("preferredLanguage", event.target.value as PreferredLanguage)
                      }
                    >
                      {preferredLanguageOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {locale === "es" ? option.es : option.en}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>{t.sectorLabel}</span>
                    <select
                      value={assessmentForm.sector}
                      onChange={(event) => updateAssessment("sector", event.target.value as Sector)}
                    >
                      {sectorOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className={styles.field}>
                    <span>{t.geographyLabel}</span>
                    <input
                      type="text"
                      value={assessmentForm.geography}
                      onChange={(event) => updateAssessment("geography", event.target.value)}
                      placeholder={t.geographyPlaceholder}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>{t.useCaseTypeLabel}</span>
                    <input
                      type="text"
                      value={assessmentForm.useCaseType}
                      onChange={(event) => updateAssessment("useCaseType", event.target.value)}
                      placeholder={t.useCaseTypePlaceholder}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>{t.aiSystemCategoryLabel}</span>
                    <input
                      type="text"
                      value={assessmentForm.aiSystemCategory}
                      onChange={(event) => updateAssessment("aiSystemCategory", event.target.value)}
                      placeholder={t.aiSystemCategoryPlaceholder}
                    />
                  </label>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeading}>
                  <h3>{t.systemSectionTitle}</h3>
                  <span>{t.systemSectionText}</span>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>{t.systemNameLabel}</span>
                    <input
                      type="text"
                      value={assessmentForm.systemName}
                      onChange={(event) => updateAssessment("systemName", event.target.value)}
                      placeholder={t.systemNamePlaceholder}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>{t.systemVersionLabel}</span>
                    <input
                      type="text"
                      value={assessmentForm.systemVersion}
                      onChange={(event) => updateAssessment("systemVersion", event.target.value)}
                      placeholder={t.systemVersionPlaceholder}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>{t.providerLabel}</span>
                    <input
                      type="text"
                      value={assessmentForm.provider}
                      readOnly
                      placeholder={t.providerPlaceholder}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>{t.deploymentContextLabel}</span>
                    <input
                      type="text"
                      value={assessmentForm.deploymentContext}
                      onChange={(event) => updateAssessment("deploymentContext", event.target.value)}
                      placeholder={t.deploymentContextPlaceholder}
                    />
                  </label>
                </div>

                <div className={styles.checkRow}>
                  <label className={styles.toggle}>
                    <input
                      checked={assessmentForm.usesPersonalData}
                      onChange={(event) => updateAssessment("usesPersonalData", event.target.checked)}
                      type="checkbox"
                    />
                    <span>{t.usesPersonalDataLabel}</span>
                  </label>

                  <label className={styles.toggle}>
                    <input
                      checked={assessmentForm.usesSensitiveData}
                      onChange={(event) => updateAssessment("usesSensitiveData", event.target.checked)}
                      type="checkbox"
                    />
                    <span>{t.usesSensitiveDataLabel}</span>
                  </label>

                  <label className={styles.toggle}>
                    <input
                      checked={assessmentForm.humanOversight}
                      onChange={(event) => updateAssessment("humanOversight", event.target.checked)}
                      type="checkbox"
                    />
                    <span>{t.humanOversightLabel}</span>
                  </label>

                  <label className={styles.toggle}>
                    <input
                      checked={assessmentForm.datasetProvided}
                      onChange={(event) => updateAssessment("datasetProvided", event.target.checked)}
                      type="checkbox"
                    />
                    <span>{t.datasetProvidedLabel}</span>
                  </label>
                </div>

                <div className={styles.formStack}>
                  <label className={styles.field}>
                    {renderInfoLabel(`${t.extraAnswersLabel} *`, t.extraAnswersHelp)}
                    <textarea
                      rows={4}
                      value={assessmentForm.extraIntakeAnswersText}
                      onChange={(event) => updateAssessment("extraIntakeAnswersText", event.target.value)}
                      placeholder={t.extraAnswersPlaceholder}
                    />
                  </label>

                  <label className={styles.field}>
                    {renderInfoLabel(`${t.healthcareProfileLabel} *`, t.healthcareProfileHelp)}
                    <textarea
                      rows={5}
                      value={assessmentForm.healthcareAuditProfileJson}
                      onChange={(event) => updateAssessment("healthcareAuditProfileJson", event.target.value)}
                      placeholder={t.healthcareProfilePlaceholder}
                    />
                  </label>
                </div>
              </div>

              <div className={styles.section}>
                <div className={styles.sectionHeading}>
                  <h3>{t.documentSectionTitle}</h3>
                  <span>{t.documentSectionText}</span>
                </div>

                <div className={styles.uploadCard}>
                  <div>
                    <p className={styles.uploadLabel}>{t.uploadLabel}</p>
                    <span className={styles.uploadHelp}>{t.uploadHelp}</span>
                  </div>
                  <input
                    accept="application/pdf"
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;
                      setSelectedFile(file);
                      if (file) {
                        setAssessmentForm((current) => ({
                          ...current,
                          s3Key: current.s3Key || `uploads/${file.name}`,
                        }));
                      }
                    }}
                    type="file"
                  />
                </div>

                <div className={styles.fileMeta}>
                  <div>
                    <span>artifactType</span>
                    <strong>DOCUMENT_PDF</strong>
                  </div>
                  <div>
                    <span>fileName</span>
                    <strong>{selectedFile?.name ?? t.noFile}</strong>
                  </div>
                  <div>
                    <span>contentType</span>
                    <strong>{selectedFile?.type || "application/pdf"}</strong>
                  </div>
                  <div>
                    <span>sizeBytes</span>
                    <strong>{selectedFile ? selectedFile.size.toLocaleString(locale) : "0"}</strong>
                  </div>
                </div>

                <div className={styles.formGrid}>
                  <label className={styles.field}>
                    <span>{t.s3BucketLabel}</span>
                    <input
                      type="text"
                      value={assessmentForm.s3Bucket}
                      readOnly
                    />
                  </label>

                  <label className={styles.field}>
                    <span>{t.s3KeyLabel}</span>
                    <input
                      type="text"
                      value={assessmentForm.s3Key}
                      onChange={(event) => updateAssessment("s3Key", event.target.value)}
                      placeholder={t.s3KeyPlaceholder}
                    />
                  </label>

                  <label className={styles.field}>
                    {renderInfoLabel(`${t.checksumLabel} *`, t.checksumHelp)}
                    <input
                      type="text"
                      value={assessmentForm.checksum}
                      onChange={(event) => updateAssessment("checksum", event.target.value)}
                      placeholder={t.checksumPlaceholder}
                    />
                  </label>
                </div>

                <label className={styles.field}>
                  {renderInfoLabel(`${t.metadataLabel} *`, t.metadataHelp)}
                  <textarea
                    rows={4}
                    value={assessmentForm.artifactMetadataText}
                    onChange={(event) => updateAssessment("artifactMetadataText", event.target.value)}
                    placeholder={t.metadataPlaceholder}
                  />
                </label>
              </div>

              <div className={styles.formActions}>
                <button className={styles.primaryButton} disabled={submitting} type="submit">
                  {submitting ? t.sending : t.assessmentSubmit}
                </button>
                <button className={styles.ghostButton} type="button" onClick={() => setActiveView("login")}>
                  {t.backToLogin}
                </button>
              </div>
            </form>

            <aside className={styles.resultsColumn}>
              <article className={styles.sideCard}>
                <p className={styles.sideLabel}>{t.activeSession}</p>
                <div className={styles.metaList}>
                  <div>
                    <span>userId</span>
                    <strong>{assessmentForm.userId || loginForm.email || t.pending}</strong>
                  </div>
                  <div>
                    <span>organizationId</span>
                    <strong>{assessmentForm.organizationId}</strong>
                  </div>
                  <div>
                    <span>Sector</span>
                    <strong>{assessmentForm.sector}</strong>
                  </div>
                </div>
              </article>

              <article className={styles.sideCard}>
                <p className={styles.sideLabel}>{t.backendState}</p>
                <div className={styles.metaList}>
                  <div>
                    <span>assessmentId</span>
                    <strong>{assessmentResponse?.assessmentId ?? t.pending}</strong>
                  </div>
                  <div>
                    <span>artifactId</span>
                    <strong>{currentArtifact?.artifactId ?? t.pending}</strong>
                  </div>
                  <div>
                    <span>regulatoryProfileId</span>
                    <strong>{assessmentResponse?.regulatoryProfileId ?? t.pending}</strong>
                  </div>
                  <div>
                    <span>analysisAt</span>
                    <strong>{formatDate(analysisResponse?.analyzedAt, locale, t.pending)}</strong>
                  </div>
                </div>
              </article>

              {analysisResponse ? (
                <article className={styles.sideCard}>
                  <p className={styles.sideLabel}>{t.documentResult}</p>
                  <div className={styles.metaList}>
                    <div>
                      <span>{t.pages}</span>
                      <strong>{analysisResponse.pageCount}</strong>
                    </div>
                    <div>
                      <span>{t.characters}</span>
                      <strong>{analysisResponse.extractedCharacterCount.toLocaleString(locale)}</strong>
                    </div>
                  </div>

                  <label className={styles.previewBlock}>
                    <span>{t.preview}</span>
                    <textarea readOnly rows={7} value={analysisResponse.extractedTextPreview} />
                  </label>

                  <div className={styles.findings}>
                    {(analysisResponse.findings ?? []).map((finding, index) => (
                      <article className={styles.findingCard} key={finding.findingId ?? `${index}`}>
                        <div className={styles.findingMeta}>
                          <strong>{finding.title ?? "Finding"}</strong>
                          <span>
                            {(finding.severity ?? "N/A").toUpperCase()} /{" "}
                            {(finding.status ?? "N/A").toUpperCase()}
                          </span>
                        </div>
                        <p>{finding.rationale ?? ""}</p>
                      </article>
                    ))}
                  </div>
                </article>
              ) : null}

              {publishedReport ? (
                <article className={styles.sideCard}>
                  <p className={styles.sideLabel}>{locale === "es" ? "Reporte final" : "Final report"}</p>
                  <div className={styles.metaList}>
                    <div>
                      <span>reportId</span>
                      <strong>{publishedReport.generatedAssessmentReport.reportId}</strong>
                    </div>
                    <div>
                      <span>generatedAt</span>
                      <strong>
                        {formatDate(
                          publishedReport.generatedAssessmentReport.generatedAt,
                          locale,
                          t.pending,
                        )}
                      </strong>
                    </div>
                    <div>
                      <span>{locale === "es" ? "Correo" : "Email"}</span>
                      <strong>{notificationResponse?.deliveryStatus ?? t.pending}</strong>
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    <a className={styles.primaryButton} href={publishedReport.reportAccessUrl} rel="noreferrer" target="_blank">
                      {locale === "es" ? "Ver reporte web" : "Open web report"}
                    </a>
                    <a className={styles.ghostButton} href={publishedReport.pdfDownloadUrl} rel="noreferrer" target="_blank">
                      {locale === "es" ? "Descargar PDF" : "Download PDF"}
                    </a>
                  </div>

                  <div className={styles.findings}>
                    {publishedReport.generatedAssessmentReport.webReport.sections.map((section) => (
                      <article className={styles.findingCard} key={section.title}>
                        <div className={styles.findingMeta}>
                          <strong>{section.title}</strong>
                          <span>{section.items.length}</span>
                        </div>
                        <p>{section.summary}</p>
                        <ul className={styles.sideList}>
                          {section.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>

                  {notificationResponse ? (
                    <details className={styles.details}>
                      <summary>{locale === "es" ? "Detalle del correo" : "Email detail"}</summary>
                      <pre>{JSON.stringify(notificationResponse, null, 2)}</pre>
                    </details>
                  ) : null}
                </article>
              ) : null}

              {payloadPreview ? (
                <article className={styles.sideCard}>
                  <p className={styles.sideLabel}>{t.payloadPreview}</p>
                  <details className={styles.details}>
                    <summary>{t.viewSentJson}</summary>
                    <pre>{JSON.stringify(payloadPreview, null, 2)}</pre>
                  </details>
                </article>
              ) : null}
            </aside>
          </section>
        ) : null}
      </section>
    </main>
  );
}
