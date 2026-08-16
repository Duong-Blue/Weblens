import { URL } from 'url';

export function isSameOrigin(url1: string, url2: string): boolean {
  try {
    const u1 = new URL(url1);
    const u2 = new URL(url2);
    return u1.origin === u2.origin;
  } catch {
    return false;
  }
}

export function isSameSite(url1: string, url2: string): boolean {
  try {
    const u1 = new URL(url1);
    const u2 = new URL(url2);
    const getRegistrableDomain = (hostname: string) => {
        const parts = hostname.split('.');
        if (parts.length <= 2) return hostname;
        return parts.slice(-2).join('.');
    };
    return getRegistrableDomain(u1.hostname) === getRegistrableDomain(u2.hostname);
  } catch {
    return false;
  }
}
