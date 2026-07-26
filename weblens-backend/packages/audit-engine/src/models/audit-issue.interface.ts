export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type IssueStatus = 'pass' | 'fail' | 'warning' | 'manual-review' | 'not-applicable';
export type EngineType = 
  | 'seo' | 'performance' | 'accessibility' | 'security' 
  | 'content' | 'network' | 'best-practices' | 'technology'
  | 'visual' | 'responsive' | 'social' | 'structured-data'
  | 'html' | 'css';

export type EvidenceType =
  | 'html-element'
  | 'html-attribute'
  | 'meta-tag'
  | 'http-header'
  | 'http-response'
  | 'network-request'
  | 'console-error'
  | 'console-warning'
  | 'console-log'
  | 'performance-metric'
  | 'screenshot'
  | 'css-rule'
  | 'javascript-error'
  | 'cookie'
  | 'dns-record'
  | 'tls-certificate'
  | 'json-ld-block'
  | 'file-content'
  | 'api-measurement';

export interface Evidence {
  type: EvidenceType;
  
  // Location
  selector?: string;
  xpath?: string;
  lineNumber?: number;
  column?: number;
  url?: string;
  
  // Value
  actual: string;
  expected: string;
  
  // Content
  htmlSnippet?: string;
  textContent?: string;
  value?: string;
  diff?: string;
  
  // Binary
  screenshotPath?: string;
  imageDataUrl?: string;
  
  // Metadata
  source: string;
  timestamp?: number;
  confidence: number;
}

export interface AuditIssue {
  // Identity
  id: string;
  ruleId: string;
  engine: EngineType;
  
  // Status & Scoring
  severity: Severity;
  status: IssueStatus;
  score: number;
  weight: number;
  
  // Content
  title: string;
  description: string;
  impact: string;
  recommendation?: string;
  
  // Classification
  category: string;
  subcategory?: string;
  wcagRef?: string;
  owaspRef?: string;
  
  // Evidence
  evidence: Evidence[];
  
  // Metadata
  effort?: 'minutes' | 'hours' | 'days' | 'weeks';
  automatedFix?: boolean;
  
  // Timestamps
  detectedAt?: string;
  resolvedAt?: string;
  
  // Extensibility
  pluginId?: string;
  tags?: string[];
}
