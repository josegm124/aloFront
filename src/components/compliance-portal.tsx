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
  text: string;
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
    appEyebrow: "Compliance frontend",
    appTitle: "Portal de evaluacion documental",
    navHome: "Inicio",
    navLogin: "Login",
    navSignup: "Crear cuenta",
    langEs: "ES",
    langEn: "EN",
    landingEyebrow: "Mismo look, nueva mision",
    landingTitle: "Una landing sobria para conectar intake, profile resolution y document compliance.",
    landingLead:
      "La interfaz conserva la paleta tierra, el contraste verde oscuro y el acabado translúcido del proyecto actual, pero ahora enfocada al backend de compliance de ALO.",
    landingPrimaryCta: "Iniciar flujo",
    landingSecondaryCta: "Crear cuenta",
    metricAssessmentTitle: "/api/v1/assessments",
    metricAssessmentText: "Alta del assessment con artifact metadata e intake answers.",
    metricDocumentTitle: "/api/v1/document-compliance/analyze",
    metricDocumentText: "Subida del PDF usando el artifactId generado por intake.",
    metricProfileTitle: "Profile hints",
    metricProfileText: "Los flags de datos personales, datos sensibles y supervisión humana ya van listos.",
    sideWhatTitle: "Que resuelve esta vista",
    sideWhatItems: [
      "Landing principal con CTA claros y branding del proyecto actual.",
      "Login simple con paso directo hacia el assessment.",
      "Registro minimo y redireccion inmediata al login.",
      "Formulario real del backend con envio encadenado assessment + PDF.",
    ],
    backendTarget: "Backend target",
    backendInfo:
      "Si defines ALOCHAT_API_BASE_URL en el frontend, las rutas internas de Next actuan como proxy. Sin esa variable, la UI responde con mocks utiles para seguir diseñando.",
    loginSideTitle: "Login listo para conectar",
    loginSideText:
      "En este MVP el alta y login funcionan con almacenamiento local del navegador. El backend de autenticacion aun no existe en esta rama.",
    needAccount: "Necesito crear cuenta",
    loginEyebrow: "Login",
    loginTitle: "Entrar al portal",
    emailLabel: "Correo",
    emailPlaceholder: "compliance@empresa.com",
    passwordLabel: "Password",
    passwordPlaceholder: "********",
    loginSubmit: "Ir al assessment",
    loginCreateAccount: "Crear cuenta",
    signupSideLabel: "Cuenta nueva",
    signupSideTitle: "Alta simple, sin sobrecargar el paso",
    signupSideText:
      "El registro solo captura lo necesario para poblar el login y precargar datos del assessment.",
    signupEyebrow: "Crear cuenta",
    signupTitle: "Preparar acceso",
    fullNameLabel: "Nombre",
    fullNamePlaceholder: "Jose Guerrero",
    companyLabel: "Empresa",
    companyPlaceholder: "Alo Health",
    confirmPasswordLabel: "Confirmar password",
    signupSubmit: "Crear y volver al login",
    alreadyHaveAccount: "Ya tengo cuenta",
    assessmentEyebrow: "Assessment intake",
    assessmentTitle: "Alta y analisis del documento",
    assessmentText:
      "El formulario cubre CreateAssessmentRequest y usa la respuesta para disparar DocumentAnalysisRequest.",
    baseSectionTitle: "Contexto base",
    baseSectionText: "Campos obligatorios del assessment.",
    systemSectionTitle: "Sistema e intake",
    systemSectionText: "Metadatos que el intake persiste y usa el profile resolver.",
    documentSectionTitle: "Documento principal",
    documentSectionText: "artifactType queda fijo en DOCUMENT_PDF para esta primera version.",
    extraAnswersLabel: "intakeAnswers extra",
    healthcareProfileLabel: "healthcareAuditProfile opcional",
    healthcareProfilePlaceholder: '{"purpose":{"summary":"Clinical triage"}}',
    uploadLabel: "Archivo PDF",
    uploadHelp: "La metadata del artifact se autocompleta desde el archivo seleccionado.",
    noFile: "Sin archivo",
    checksumPlaceholder: "Opcional",
    metadataLabel: "artifact metadata",
    sending: "Enviando...",
    assessmentSubmit: "Crear assessment y analizar PDF",
    backToLogin: "Volver al login",
    activeSession: "Sesion activa",
    backendState: "Estado backend",
    documentResult: "Resultado documental",
    pages: "Paginas",
    characters: "Caracteres",
    preview: "Preview",
    pending: "Pendiente",
    payloadPreview: "Payload preview",
    viewSentJson: "Ver JSON enviado",
    notices: {
      invalidLogin: "Completa correo y password para continuar.",
      frontendLoginReady:
        "Sesion local iniciada. Ya puedes crear el assessment y subir el PDF.",
      missingSignup: "Completa los datos de la cuenta antes de continuar.",
      passwordMismatch: "La confirmacion de password no coincide.",
      invalidCredentials: "Correo o password incorrectos.",
      accountExists: "Ya existe una cuenta con ese correo.",
      accountReady: "Cuenta creada localmente. El siguiente paso es iniciar sesion para cargar el documento.",
      missingFile: "Selecciona un PDF antes de enviar el assessment.",
      datasetUnsupported:
        "Esta version solo envia el PDF principal. Deja datasetProvided apagado hasta agregar la carga de dataset.",
      invalidHealthcareProfile:
        "El bloque opcional healthcareAuditProfile debe ser JSON valido.",
      sendingAssessment: "Creando assessment y enviando el documento al flujo de compliance.",
      missingBackendFields: "La respuesta del backend no devolvio artifactId o regulatoryProfileId.",
      assessmentFailed: "No fue posible crear el assessment.",
      documentFailed: "No fue posible analizar el documento.",
      success: "Assessment aceptado y analisis documental ejecutado correctamente.",
      generic: "Fallo el flujo del assessment.",
    },
  },
  en: {
    appEyebrow: "Compliance frontend",
    appTitle: "Document assessment portal",
    navHome: "Home",
    navLogin: "Login",
    navSignup: "Create account",
    langEs: "ES",
    langEn: "EN",
    landingEyebrow: "Same visual language, new mission",
    landingTitle: "A focused landing page that connects intake, profile resolution, and document compliance.",
    landingLead:
      "The interface keeps the earth-tone palette, dark green contrast, and translucent finish from the current project, now aimed at the ALO compliance backend.",
    landingPrimaryCta: "Start flow",
    landingSecondaryCta: "Create account",
    metricAssessmentTitle: "/api/v1/assessments",
    metricAssessmentText: "Creates the assessment with artifact metadata and intake answers.",
    metricDocumentTitle: "/api/v1/document-compliance/analyze",
    metricDocumentText: "Uploads the PDF using the artifactId returned by intake.",
    metricProfileTitle: "Profile hints",
    metricProfileText: "Personal data, sensitive data, and human oversight flags are already included.",
    sideWhatTitle: "What this page covers",
    sideWhatItems: [
      "Main landing page with clear CTA and the current project branding.",
      "Simple login with a direct handoff to the assessment flow.",
      "Minimal sign-up and immediate redirect to login.",
      "Real backend form wired as assessment creation plus PDF analysis.",
    ],
    backendTarget: "Backend target",
    backendInfo:
      "If you define ALOCHAT_API_BASE_URL in the frontend, the internal Next routes act as a proxy. Without that variable, the UI returns useful mocks so design work can continue.",
    loginSideTitle: "Login ready to connect",
    loginSideText:
      "In this MVP, sign-up and login work with browser local storage. The real authentication backend does not exist in this branch yet.",
    needAccount: "I need an account",
    loginEyebrow: "Login",
    loginTitle: "Enter the portal",
    emailLabel: "Email",
    emailPlaceholder: "compliance@company.com",
    passwordLabel: "Password",
    passwordPlaceholder: "********",
    loginSubmit: "Go to assessment",
    loginCreateAccount: "Create account",
    signupSideLabel: "New account",
    signupSideTitle: "Simple onboarding without extra noise",
    signupSideText:
      "Sign-up only captures what is needed to prefill login and preload the assessment form.",
    signupEyebrow: "Create account",
    signupTitle: "Prepare access",
    fullNameLabel: "Full name",
    fullNamePlaceholder: "Jose Guerrero",
    companyLabel: "Company",
    companyPlaceholder: "Alo Health",
    confirmPasswordLabel: "Confirm password",
    signupSubmit: "Create account and return to login",
    alreadyHaveAccount: "I already have an account",
    assessmentEyebrow: "Assessment intake",
    assessmentTitle: "Create the request and analyze the document",
    assessmentText:
      "This form covers CreateAssessmentRequest and uses that response to trigger DocumentAnalysisRequest.",
    baseSectionTitle: "Base context",
    baseSectionText: "Required assessment fields.",
    systemSectionTitle: "System and intake",
    systemSectionText: "Metadata persisted by intake and later used by the profile resolver.",
    documentSectionTitle: "Primary document",
    documentSectionText: "artifactType stays fixed as DOCUMENT_PDF in this first version.",
    extraAnswersLabel: "extra intakeAnswers",
    healthcareProfileLabel: "optional healthcareAuditProfile",
    healthcareProfilePlaceholder: '{"purpose":{"summary":"Clinical triage"}}',
    uploadLabel: "PDF file",
    uploadHelp: "Artifact metadata is auto-filled from the selected file.",
    noFile: "No file selected",
    checksumPlaceholder: "Optional",
    metadataLabel: "artifact metadata",
    sending: "Sending...",
    assessmentSubmit: "Create assessment and analyze PDF",
    backToLogin: "Back to login",
    activeSession: "Active session",
    backendState: "Backend state",
    documentResult: "Document result",
    pages: "Pages",
    characters: "Characters",
    preview: "Preview",
    pending: "Pending",
    payloadPreview: "Payload preview",
    viewSentJson: "View sent JSON",
    notices: {
      invalidLogin: "Enter both email and password to continue.",
      frontendLoginReady:
        "Local session started. You can now create the assessment and upload the PDF.",
      missingSignup: "Complete the account details before continuing.",
      passwordMismatch: "Password confirmation does not match.",
      invalidCredentials: "Email or password is incorrect.",
      accountExists: "An account with that email already exists.",
      accountReady: "Account created locally. The next step is to sign in and upload the document.",
      missingFile: "Select a PDF before submitting the assessment.",
      datasetUnsupported:
        "This version only sends the primary PDF. Keep datasetProvided disabled until dataset upload is added.",
      invalidHealthcareProfile:
        "The optional healthcareAuditProfile block must be valid JSON.",
      sendingAssessment: "Creating the assessment and sending the document into the compliance flow.",
      missingBackendFields: "The backend response did not return artifactId or regulatoryProfileId.",
      assessmentFailed: "The assessment could not be created.",
      documentFailed: "The document could not be analyzed.",
      success: "Assessment accepted and document analysis completed successfully.",
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
  useCaseType: "Clinical decision support",
  aiSystemCategory: "High risk medical AI",
  geography: "Mexico",
  datasetProvided: false,
  systemName: "Alo Compliance Review",
  systemVersion: "1.0.0",
  provider: "Alo",
  deploymentContext: "Private cloud",
  usesPersonalData: true,
  usesSensitiveData: true,
  humanOversight: true,
  s3Bucket: "alo-intake-dev",
  s3Key: "",
  checksum: "",
  artifactMetadataText: "channel=landing\nowner=compliance-team",
  extraIntakeAnswersText: "organizationReadiness=medium\nriskCommitteeAssigned=true",
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
      setNotice({ tone: "error", text: t.notices.invalidLogin });
      return;
    }

    const account = readStoredAccounts().find(
      (candidate) => candidate.email === email && candidate.password === password,
    );
    if (!account) {
      setNotice({ tone: "error", text: t.notices.invalidCredentials });
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
    setNotice({ tone: "success", text: t.notices.frontendLoginReady });
  }

  function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const fullName = signupForm.fullName.trim();
    const company = signupForm.company.trim();
    const email = signupForm.email.trim().toLowerCase();
    const password = signupForm.password.trim();

    if (!fullName || !company || !email || !password) {
      setNotice({ tone: "error", text: t.notices.missingSignup });
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setNotice({ tone: "error", text: t.notices.passwordMismatch });
      return;
    }

    const existingAccounts = readStoredAccounts();
    if (existingAccounts.some((account) => account.email === email)) {
      setNotice({ tone: "error", text: t.notices.accountExists });
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
    setNotice({ tone: "success", text: t.notices.accountReady });
  }

  async function handleAssessmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setNotice({ tone: "error", text: t.notices.missingFile });
      return;
    }

    if (assessmentForm.datasetProvided) {
      setNotice({ tone: "error", text: t.notices.datasetUnsupported });
      return;
    }

    let healthcareAuditProfile: unknown;
    if (assessmentForm.healthcareAuditProfileJson.trim()) {
      try {
        healthcareAuditProfile = JSON.parse(assessmentForm.healthcareAuditProfileJson);
      } catch {
        setNotice({ tone: "error", text: t.notices.invalidHealthcareProfile });
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
    setPayloadPreview(assessmentPayload);
    setNotice({ tone: "info", text: t.notices.sendingAssessment });

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
      setNotice({ tone: "success", text: t.notices.success });
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
          <div className={`${styles.notice} ${styles[`notice${notice.tone}`]}`}>{notice.text}</div>
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
                <strong>`aloChat` / `feature/romeBS`</strong>
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
                    <span>tenantId</span>
                    <input
                      type="text"
                      value={assessmentForm.tenantId}
                      onChange={(event) => updateAssessment("tenantId", event.target.value)}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>organizationId</span>
                    <input
                      type="text"
                      value={assessmentForm.organizationId}
                      onChange={(event) => updateAssessment("organizationId", event.target.value)}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>userId</span>
                    <input
                      type="text"
                      value={assessmentForm.userId}
                      onChange={(event) => updateAssessment("userId", event.target.value)}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>preferredLanguage</span>
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
                    <span>sector</span>
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
                    <span>geography</span>
                    <input
                      type="text"
                      value={assessmentForm.geography}
                      onChange={(event) => updateAssessment("geography", event.target.value)}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>useCaseType</span>
                    <input
                      type="text"
                      value={assessmentForm.useCaseType}
                      onChange={(event) => updateAssessment("useCaseType", event.target.value)}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>aiSystemCategory</span>
                    <input
                      type="text"
                      value={assessmentForm.aiSystemCategory}
                      onChange={(event) => updateAssessment("aiSystemCategory", event.target.value)}
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
                    <span>systemName</span>
                    <input
                      type="text"
                      value={assessmentForm.systemName}
                      onChange={(event) => updateAssessment("systemName", event.target.value)}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>systemVersion</span>
                    <input
                      type="text"
                      value={assessmentForm.systemVersion}
                      onChange={(event) => updateAssessment("systemVersion", event.target.value)}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>provider</span>
                    <input
                      type="text"
                      value={assessmentForm.provider}
                      onChange={(event) => updateAssessment("provider", event.target.value)}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>deploymentContext</span>
                    <input
                      type="text"
                      value={assessmentForm.deploymentContext}
                      onChange={(event) => updateAssessment("deploymentContext", event.target.value)}
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
                    <span>usesPersonalData</span>
                  </label>

                  <label className={styles.toggle}>
                    <input
                      checked={assessmentForm.usesSensitiveData}
                      onChange={(event) => updateAssessment("usesSensitiveData", event.target.checked)}
                      type="checkbox"
                    />
                    <span>usesSensitiveData</span>
                  </label>

                  <label className={styles.toggle}>
                    <input
                      checked={assessmentForm.humanOversight}
                      onChange={(event) => updateAssessment("humanOversight", event.target.checked)}
                      type="checkbox"
                    />
                    <span>humanOversight</span>
                  </label>

                  <label className={styles.toggle}>
                    <input
                      checked={assessmentForm.datasetProvided}
                      onChange={(event) => updateAssessment("datasetProvided", event.target.checked)}
                      type="checkbox"
                    />
                    <span>datasetProvided</span>
                  </label>
                </div>

                <div className={styles.formStack}>
                  <label className={styles.field}>
                    <span>{t.extraAnswersLabel}</span>
                    <textarea
                      rows={4}
                      value={assessmentForm.extraIntakeAnswersText}
                      onChange={(event) => updateAssessment("extraIntakeAnswersText", event.target.value)}
                      placeholder={"key=value\nanotherKey=value"}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>{t.healthcareProfileLabel}</span>
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
                    <span>s3Bucket</span>
                    <input
                      type="text"
                      value={assessmentForm.s3Bucket}
                      onChange={(event) => updateAssessment("s3Bucket", event.target.value)}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>s3Key</span>
                    <input
                      type="text"
                      value={assessmentForm.s3Key}
                      onChange={(event) => updateAssessment("s3Key", event.target.value)}
                    />
                  </label>

                  <label className={styles.field}>
                    <span>checksum</span>
                    <input
                      type="text"
                      value={assessmentForm.checksum}
                      onChange={(event) => updateAssessment("checksum", event.target.value)}
                      placeholder={t.checksumPlaceholder}
                    />
                  </label>
                </div>

                <label className={styles.field}>
                  <span>{t.metadataLabel}</span>
                  <textarea
                    rows={4}
                    value={assessmentForm.artifactMetadataText}
                    onChange={(event) => updateAssessment("artifactMetadataText", event.target.value)}
                    placeholder={"key=value\nteam=compliance"}
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
