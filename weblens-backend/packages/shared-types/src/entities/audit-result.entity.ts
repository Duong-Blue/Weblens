import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { Audit } from './audit.entity';

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

export interface TechStack {
  frameworks: string[];
  cms: string[];
  hosting: string[];
  analytics: string[];
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

@Entity()
export class AuditResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  auditId: string;

  @OneToOne(() => Audit)
  @JoinColumn({ name: 'auditId' })
  audit: Audit;

  // 1. Performance
  @Column({ default: 0 })
  perfScore: number;

  @Column('json', { nullable: true })
  perfDetails: PerfDetails | null;

  // 2. SEO
  @Column({ default: 0 })
  seoScore: number;

  @Column('json', { nullable: true })
  seoDetails: SeoDetails | null;

  // 3. Accessibility
  @Column({ default: 0 })
  accScore: number;

  @Column('json', { nullable: true })
  accDetails: AccDetails | null;

  // 4. Security
  @Column({ default: 0 })
  securityScore: number;

  @Column('json', { nullable: true })
  securityDetails: SecurityDetails | null;

  // 5. Technology Stack
  @Column('json', { nullable: true })
  techStack: TechStack | null;

  // 6. Network & Resources
  @Column('json', { nullable: true })
  networkDetails: NetworkDetails | null;

  // 7. Website Structure
  @Column('json', { nullable: true })
  structureDetails: StructureDetails | null;

  // 8. JavaScript & Errors
  @Column('json', { nullable: true })
  jsErrorsDetails: JsErrorsDetails | null;

  // 9. UI/UX (AI Analysis)
  @Column('json', { nullable: true })
  uiUxDetails: UiUxDetails | null;

  // 10. AI Insights & Recommendations
  @Column('text', { nullable: true })
  aiSummary: string | null;

  @Column('text', { nullable: true })
  summary: string | null; // Keep for backward compatibility if needed temporarily
}
