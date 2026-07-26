import { Injectable } from '@nestjs/common';
import { AuditIssue } from '../types/audit.types';

export interface TLSInfo {
  version: string;
  cipherSuite: string;
  certificate: {
    issuer: {
      commonName: string;
    };
    validFrom: string;
    validTo: string;
    daysRemaining: number;
  };
}

@Injectable()
export class TlsValidatorService {
  checkTLS(tlsInfo: TLSInfo | null | undefined): AuditIssue[] {
    const issues: AuditIssue[] = [];

    if (!tlsInfo) {
      issues.push({
        id: 'SEC-001',
        ruleId: 'https-enabled',
        engine: 'security',
        severity: 'critical',
        status: 'fail',
        score: 0,
        weight: 10,
        title: 'HTTPS is not enabled or connection is not secure',
        description: 'Server does not support HTTPS or connection could not be established securely.',
        impact: 'Without HTTPS, all data transferred is unencrypted and vulnerable to interception.',
        recommendation: 'Enable HTTPS on your server and obtain a valid SSL/TLS certificate.',
        evidence: [{
          type: 'http-response',
          actual: 'No TLS connection',
          expected: 'Valid TLS connection',
          source: 'CDP Security.tlsInfo',
        }],
        effort: 'hours',
        category: 'security',
      });
      return issues;
    }

    // SEC-012: TLS Version
    const tlsVersionString = tlsInfo.version.replace('TLS ', '');
    // Handle cases where version might be just '1.2' or 'TLS 1.2'
    const tlsVersion = parseFloat(tlsVersionString);
    const tlsPass = !isNaN(tlsVersion) && tlsVersion >= 1.2;
    
    issues.push({
      id: 'SEC-012',
      ruleId: 'tls-version',
      engine: 'security',
      severity: 'critical',
      status: tlsPass ? 'pass' : 'fail',
      score: tlsPass ? 1 : 0,
      weight: 10,
      title: tlsPass ? `TLS ${tlsInfo.version} is secure` : `TLS ${tlsInfo.version} is outdated`,
      description: tlsPass
        ? `Server supports TLS ${tlsInfo.version} with cipher ${tlsInfo.cipherSuite}`
        : `Server uses TLS ${tlsInfo.version}. TLS 1.0 and 1.1 are deprecated (RFC 8996).`,
      impact: 'Outdated TLS versions are vulnerable to protocol downgrade attacks (POODLE, BEAST).',
      recommendation: 'Disable TLS 1.0 and 1.1. Enable TLS 1.2 and 1.3 only.',
      evidence: [{
        type: 'http-response',
        actual: tlsInfo.version,
        expected: 'TLS 1.2 or higher',
        source: 'CDP Security.tlsInfo',
      }],
      effort: 'hours',
      category: 'security',
    });

    // SEC-013: Certificate
    if (tlsInfo.certificate) {
      const daysRemaining = tlsInfo.certificate.daysRemaining;
      const certPass = daysRemaining > 30;
      
      issues.push({
        id: 'SEC-013',
        ruleId: 'ssl-cert-valid',
        engine: 'security',
        severity: 'critical',
        status: certPass ? 'pass' : (daysRemaining > 0 ? 'warning' : 'fail'),
        score: certPass ? 1 : (daysRemaining > 0 ? 0.5 : 0),
        weight: 10,
        title: certPass 
          ? `SSL certificate valid for ${daysRemaining} days`
          : daysRemaining > 0
            ? `SSL certificate expires in ${daysRemaining} days`
            : 'SSL certificate is expired!',
        description: `Issuer: ${tlsInfo.certificate.issuer?.commonName || 'Unknown'}. ` +
          `Valid: ${tlsInfo.certificate.validFrom} → ${tlsInfo.certificate.validTo}. ` +
          `${daysRemaining} days remaining.`,
        impact: daysRemaining <= 0 
          ? 'Expired certificate will cause browser security warnings, driving users away.'
          : daysRemaining < 30 
            ? 'Certificate expiring soon — risks service disruption if not renewed.'
            : '',
        recommendation: daysRemaining < 30 
          ? 'Renew the SSL certificate immediately. Set up auto-renewal via Let\'s Encrypt or your CA.'
          : undefined,
        evidence: [{
          type: 'http-response',
          actual: `Expires in ${daysRemaining} days (${tlsInfo.certificate.validTo})`,
          expected: '> 30 days remaining',
          source: 'CDP Security.certificate',
        }],
        effort: 'hours',
        category: 'security',
      });
    } else {
      issues.push({
        id: 'SEC-013',
        ruleId: 'ssl-cert-valid',
        engine: 'security',
        severity: 'critical',
        status: 'fail',
        score: 0,
        weight: 10,
        title: 'SSL certificate information is missing',
        description: 'Could not retrieve certificate information from the server.',
        impact: 'Without a valid certificate, browser security warnings will appear.',
        recommendation: 'Ensure your server is serving a valid SSL/TLS certificate.',
        evidence: [{
          type: 'http-response',
          actual: 'No certificate data',
          expected: 'Valid certificate data',
          source: 'CDP Security.certificate',
        }],
        effort: 'hours',
        category: 'security',
      });
    }

    return issues;
  }
}
