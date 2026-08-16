import { isSameOrigin, isSameSite } from './url-utils';

describe('url-utils', () => {
  it('identifies same origin correctly', () => {
    expect(isSameOrigin('https://example.com/a', 'https://example.com/b')).toBe(true);
    expect(isSameOrigin('https://example.com/a', 'http://example.com/b')).toBe(false);
    expect(isSameOrigin('https://example.com/a', 'https://other.com/b')).toBe(false);
  });

  it('identifies same site correctly', () => {
    expect(isSameSite('https://sub.example.com/a', 'https://example.com/b')).toBe(true);
    expect(isSameSite('https://example.com/a', 'https://other.com/b')).toBe(false);
  });
});
