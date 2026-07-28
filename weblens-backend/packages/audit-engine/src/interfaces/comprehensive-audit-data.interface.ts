export interface PerfDetails {
  loadTimeMs: number;
  timing: any;
  heavyResources: number;
  budget?: {
    totalSize?: number;
    htmlSize?: number;
    jsSize?: number;
    cssSize?: number;
    imageSize?: number;
    totalTransferSize?: number;
    totalRequestCount: number;
  };
  coreWebVitals?: {
    lcp?: number;
    cls?: number;
    inp?: number;
    ttfb?: number;
    tbt?: number;
    totalBlockingTime?: number;
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
  errors: { type: string; text: string; location: any }[];
}

export interface UiUxDetails {
  viewportMeta: boolean;
  buttonCount: number;
  formCount: number;
  hasNavigation: boolean;
}

export interface ComprehensiveAuditData {
  perfScore: number;
  perfDetails: PerfDetails;
  seoScore: number;
  seoDetails: SeoDetails;
  accScore: number;
  accDetails: AccDetails;
  securityScore: number;
  securityDetails: SecurityDetails;
  techStack: TechStack;
  networkDetails: NetworkDetails;
  structureDetails: StructureDetails;
  jsErrorsDetails: JsErrorsDetails;
  uiUxDetails: UiUxDetails;
}
