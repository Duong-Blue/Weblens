export interface AuditScreenshot {
  viewport: string;
  path: string;
  width: number;
  height: number;
  fullPage: boolean;
  fileSize: number;
}

export interface ReferenceLink {
  title: string;
  url: string;
  category: 'wcag' | 'security' | 'performance' | 'seo' | 'best-practice';
}

export interface PerfDetails {
  loadTimeMs: number;
  timing: Record<string, unknown>;
  heavyResources: number;
  budget?: {
    totalSize?: number;
    htmlSize?: number;
    jsSize?: number;
    cssSize?: number;
    imageSize?: number;
    totalRequestCount: number;
  };
  coreWebVitals?: {
    lcp?: number;
    cls?: number;
    fid?: number;
  };
}

export interface SeoDetails {
  title: string;
  hasTitle: boolean;
  description: string | undefined;
  hasMetaDescription: boolean;
  hasH1: boolean;
  h1Count: number;
  linksCount: number;
  social?: {
    openGraph: {
      title?: string;
      description?: string;
      image?: string;
    };
    twitter: {
      card?: string;
      title?: string;
      description?: string;
    };
    hasJsonLd: boolean;
  };
}

export interface WcagCriterion {
  criteria: string;
  passed: boolean;
  message: string;
}

export interface AccDetails {
  imagesWithoutAlt: number;
  totalImages: number;
  missingAriaLabels: number;
  wcag: WcagCriterion[];
}

export interface SecurityDetails {
  isHttps: boolean;
  mixedContent: boolean;
  headers: {
    contentSecurityPolicy: boolean;
    strictTransportSecurity: boolean;
    xFrameOptions: boolean;
    xContentTypeOptions: boolean;
  };
  forms: {
    insecureAction: number;
    insecurePasswordInput: number;
    missingAutocompletePassword: number;
  };
  cookies: {
    total: number;
    missingSecure: number;
    missingHttpOnly: number;
    missingSameSite: number;
  };
  cors: {
    wildcardOrigin: boolean;
  };
  vulnerabilities: { name: string; severity: string; description: string }[];
}

export interface TechItem {
  name: string;
  category: string;
  confidence: number;
  version?: string;
  evidence: any;
  isDeprecated: boolean;
  endOfLife?: string;
}

export interface TechStack {
  frameworks?: TechItem[];
  cms?: TechItem[];
  hosting?: TechItem[];
  analytics?: TechItem[];
  [key: string]: TechItem[] | undefined;
}

export interface NetworkDetails {
  totalRequests: number;
  failedRequests: number;
  summaryByType: Record<string, number>;
}

export interface StructureDetails {
  internalLinks: number;
  externalLinks: number;
  headingHierarchy: {
    h1: number;
    h2: number;
    h3: number;
  };
}

export interface JsErrorsDetails {
  errorCount: number;
  warningCount: number;
  errors: { type: string; text: string; location: Record<string, unknown> }[];
}

export interface UiUxDetails {
  viewportMeta: boolean;
  buttonCount: number;
  formCount: number;
  hasNavigation: boolean;
}

export interface AuditResult {
  id: string;
  auditId: string;
  audit: Record<string, unknown>; // Keep loosely typed if needed, or remove if unused, but per instructions don't change fields. We'll use any as Audit entity was removed.

  // Evidence
  screenshots?: AuditScreenshot[];
  referenceLinks?: ReferenceLink[];

  // 1. Performance
  perfScore: number;
  perfDetails: PerfDetails | null;

  // 2. SEO
  seoScore: number;
  seoDetails: SeoDetails | null;

  // 3. Accessibility
  accScore: number;
  accDetails: AccDetails | null;

  // 4. Security
  securityScore: number;
  securityDetails: SecurityDetails | null;

  // 5. Technology Stack
  techStack: TechStack | null;

  // 6. Network & Resources
  networkDetails: NetworkDetails | null;

  // 7. Website Structure
  structureDetails: StructureDetails | null;

  // 8. JavaScript & Errors
  jsErrorsDetails: JsErrorsDetails | null;

  // 9. UI/UX (AI Analysis)
  uiUxDetails: UiUxDetails | null;

  // 10. AI Insights & Recommendations
  aiSummary: string | null;
  aiCategoryAnalysis?: Record<string, { analysis: string; fixRecommendations: string[] }>;
  summary: string | null; // Keep for backward compatibility if needed temporarily

  error?: string;
}
