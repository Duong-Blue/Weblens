export interface LighthouseData {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export interface NetworkRequest {
  url: string;
  method: string;
  resourceType: string;
  status: number;
  statusText: string;
  
  startTime?: number;
  responseTime?: number;
  endTime?: number;
  duration?: number;
  
  transferSize?: number;
  encodedBodySize?: number;
  decodedBodySize?: number;
  
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  
  protocol?: string;
  remoteAddress?: string;
  
  priority?: 'VeryLow' | 'Low' | 'Medium' | 'High' | 'VeryHigh';
  renderBlocking?: boolean;
  
  fromCache?: boolean;
  fromServiceWorker?: boolean;
  fromPrefetchCache?: boolean;
  
  dnsLookupMs?: number;
  tcpConnectionMs?: number;
  tlsNegotiationMs?: number;
  timeToFirstByteMs?: number;
  
  mimeType?: string;
  contentEncoding?: string;
  
  error?: string;
  blockedReason?: string;
  
  initiator?: string;
  initiatorUrl?: string;
}

export interface ResourceBreakdown {
  documents: NetworkRequest[];
  scripts: NetworkRequest[];
  stylesheets: NetworkRequest[];
  images: NetworkRequest[];
  fonts: NetworkRequest[];
  xhr: NetworkRequest[];
  fetch: NetworkRequest[];
  media: NetworkRequest[];
  websocket: NetworkRequest[];
  other: NetworkRequest[];
  
  totalCount: number;
  totalTransferSize: number;
  totalDecodedSize: number;
  totalDuration: number;
  failedCount: number;
  blockedCount: number;
  cacheHitCount: number;
  cacheHitRate: number;
  serviceWorkerCount: number;
  http2Count: number;
  http3Count: number;
  http1Count: number;
  
  byDomain: Record<string, {
    count: number;
    totalSize: number;
    duration: number;
  }>;
  
  thirdPartyCount: number;
  thirdPartySize: number;
  firstPartyCount: number;
  firstPartySize: number;
}

export interface SitemapInfo {
  found: boolean;
  urlCount?: number;
  urls?: string[];
}

export interface RobotsInfo {
  found: boolean;
  disallowed?: string[];
  sitemaps?: string[];
}

export interface ConsoleMessageEntry {
  type: 'log' | 'info' | 'warning' | 'error' | 'debug' | 'assert' | 'trace' | 'dir';
  text: string;
  location: {
    url: string;
    line: number;
    column: number;
  };
  args?: any[];
  timestamp: number;
  stackTrace?: string;
}

export interface ConsoleAnalysis {
  errors: ConsoleMessageEntry[];
  warnings: ConsoleMessageEntry[];
  info: ConsoleMessageEntry[];
  logs: ConsoleMessageEntry[];
  
  totalErrors: number;
  totalWarnings: number;
  totalMessages: number;
  
  jsExceptions: ConsoleMessageEntry[];
  promiseRejections: ConsoleMessageEntry[];
  deprecationWarnings: ConsoleMessageEntry[];
  corsErrors: ConsoleMessageEntry[];
  cspViolations: ConsoleMessageEntry[];
  mixedContentWarnings: ConsoleMessageEntry[];
}

export interface DOMStatistics {
  totalNodes: number;
  elementNodes: number;
  textNodes: number;
  commentNodes: number;
  documentNodes: number;
  
  maxDepth: number;
  averageDepth: number;
  
  tagCounts: Record<string, number>;
  customElementCount: number;
  
  totalIds: number;
  uniqueIdsCount: number;
  duplicateIds: string[];
  totalClasses: number;
  uniqueClasses: number;
  averageClassesPerElement: number;
  
  totalAttributes: number;
  inlineStyleCount: number;
  dataAttributeCount: number;
  ariaAttributeCount: number;
  eventHandlerCount: number;
  
  totalScripts: number;
  inlineScripts: number;
  externalScripts: number;
  moduleScripts: number;
  totalStylesheets: number;
  inlineStyles: number;
  externalStylesheets: number;
  importedStylesheets: number;
  
  headingCount: Record<string, number>;
  landmarkCount: number;
  iframeCount: number;
  canvasCount: number;
  videoCount: number;
  audioCount: number;
  svgCount: number;
  formCount: number;
  buttonCount: number;
  inputCount: number;
  linkCount: number;
  imageCount: number;
  tableCount: number;
  
  hiddenElements: number;
  ariaHiddenElements: number;
}

export interface HeadingHierarchy {
  headings: Array<{
    level: number;
    text: string;
    tagName: string;
    orderIndex: number;
    hasId: boolean;
    id?: string;
  }>;
  isValid: boolean;
  issues: string[];
  outline: string[];
}

export interface LinkAnalysis {
  total: number;
  internal: number;
  external: number;
  broken: Array<{
    url: string;
    text: string;
    status: number;
    error?: string;
  }>;
  nofollow: number;
  sponsored: number;
  ugc: number;
  noopener: number;
  noreferrer: number;
  javascript: number;
  mailto: number;
  tel: number;
  anchor: number;
  empty: number;
  sameTab: number;
  newTab: number;
  
  descriptiveTexts: string[];
  genericTexts: string[];
  
  averagePerPage: number;
  internalExternalRatio: number;
}

export interface ImageInfo {
  src: string;
  alt: string;
  hasAlt: boolean;
  width: number;
  height: number;
  naturalWidth?: number;
  naturalHeight?: number;
  fileSize?: number;
  format?: string;
  loading: 'eager' | 'lazy' | 'auto' | undefined;
  fetchPriority: 'high' | 'low' | 'auto' | undefined;
  decoding: 'async' | 'sync' | 'auto' | undefined;
  isAboveFold: boolean;
  isDecorative: boolean;
  isExternal: boolean;
  isBroken: boolean;
  hasDimensionAttrs: boolean;
  aspectRatio: number;
  isResponsive: boolean;
  sources?: string[];
}

export interface FormInfo {
  action: string;
  method: 'get' | 'post' | 'dialog';
  isSecure: boolean;
  hasCsrfToken: boolean;
  hasCaptcha: boolean;
  hasFileUpload: boolean;
  
  inputs: Array<{
    type: string;
    name: string;
    id: string;
    placeholder: string;
    required: boolean;
    disabled: boolean;
    readonly: boolean;
    autocomplete: string;
    hasLabel: boolean;
    labelText?: string;
    ariaLabel?: string;
    ariaLabelledby?: string;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  }>;
  
  buttons: Array<{
    type: 'submit' | 'button' | 'reset';
    text: string;
    name: string;
    value: string;
  }>;
  
  totalInputs: number;
  totalButtons: number;
}

export interface ScreenshotItem {
  viewport: string;
  path: string;
  width: number;
  height: number;
  fileSize: number;
  format: 'png' | 'jpeg' | 'webp';
  timestamp: number;
  takenAtMs: number;
}

export interface CrawlResult {
  url?: string;
  normalizedUrl?: string;
  crawlStartTime?: number;
  crawlEndTime?: number;
  duration?: number;
  success?: boolean;
  error?: string;
  crawlerVersion?: string;

  htmlContent: string;
  parsedTitle?: string;
  parsedMetaTags?: Record<string, string>;

  networkRequests: NetworkRequest[];
  resourceBreakdown?: ResourceBreakdown;
  mainResponse?: {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    timing: {
      startTime: number;
      responseTime: number;
      endTime: number;
      duration: number;
    };
  };
  redirectChain?: Array<{
    url: string;
    status: number;
  }>;

  consoleMessages: ConsoleMessageEntry[];
  consoleAnalysis?: ConsoleAnalysis;
  jsErrors?: Array<{
    message: string;
    stack?: string;
    timestamp: number;
  }>;

  performanceTiming: any;
  resourceTiming?: Array<{
    name: string;
    entryType: string;
    startTime: number;
    duration: number;
    initiatorType: string;
    transferSize: number;
    encodedBodySize: number;
    decodedBodySize: number;
    domainLookupStart: number;
    domainLookupEnd: number;
    connectStart: number;
    connectEnd: number;
    secureConnectionStart: number;
    requestStart: number;
    responseStart: number;
    responseEnd: number;
  }>;
  cwv: { lcp?: number; inp?: number; cls?: number; fcp?: number; ttfb?: number };
  longTasks?: Array<{
    duration: number;
    startTime: number;
    name?: string;
  }>;
  totalBlockingTime?: number;

  mainHeaders: Record<string, string>;
  cookies?: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None' | undefined;
    session: boolean;
  }>;

  screenshots?: ScreenshotItem[];

  domStats?: DOMStatistics;
  headingHierarchy?: HeadingHierarchy;
  linkAnalysis?: LinkAnalysis;
  imageCollection?: ImageInfo[];
  formCollection?: FormInfo[];

  cssContent?: string;
  cssResources?: Array<{
    url: string;
    content: string;
    size: number;
    isInline: boolean;
    isExternal: boolean;
    mediaQuery?: string;
  }>;
  fontFaces?: Array<{
    family: string;
    src: string[];
    format: string;
    weight: string;
    style: string;
    display: string;
    unicodeRange?: string;
  }>;
  cssCoverage?: {
    usedBytes: number;
    totalBytes: number;
    usedPercent: number;
    unusedBytes: number;
    byStylesheet: Array<{
      url: string;
      usedBytes: number;
      totalBytes: number;
    }>;
  };

  accessibilityTree?: any;
  ariaRoles?: string[];
  landmarkElements?: string[];

  technologyHints?: Array<{
    category: string;
    name: string;
    pattern: string;
    confidence: number;
  }>;

  tlsInfo?: {
    version: string;
    cipherSuite: string;
    certificate: {
      issuer: { commonName: string; organization: string };
      subject: { commonName: string; organization: string };
      validFrom: string;
      validTo: string;
      daysRemaining: number;
      isWildcard: boolean;
      isEv: boolean;
      isSelfSigned: boolean;
    };
    tls13Supported: boolean;
    ocspMustStaple: boolean;
  };
  mixedContent?: Array<{
    url: string;
    type: 'active' | 'passive';
    resourceType: string;
  }>;
  cspInfo?: {
    exists: boolean;
    directives: Record<string, string[]>;
    isValid: boolean;
    errors: string[];
    hasUnsafeInline: boolean;
    hasUnsafeEval: boolean;
    hasStrictDynamic: boolean;
    hasReportUri: boolean;
    reportTo?: string;
  };

  lighthouseData?: LighthouseData;
  sitemapInfo: { found: boolean; urlCount?: number; urls?: string[] };
  robotsInfo: { found: boolean; disallowed?: string[]; sitemaps?: string[] };
  
  dnsInfo?: {
    resolvedIp: string;
    hostname: string;
    cname?: string;
    mxRecords?: string[];
    nsRecords?: string[];
    txtRecords?: string[];
    asn?: string;
    asnOrg?: string;
    cloudflare?: boolean;
  };
  securityContact?: string;

  jsonLdBlocks?: Array<{
    raw: string;
    parsed: any;
    type: string;
    valid: boolean;
    errors: string[];
  }>;
  microdataItems?: Array<{
    type: string;
    properties: Record<string, any>;
    selector: string;
  }>;
}
