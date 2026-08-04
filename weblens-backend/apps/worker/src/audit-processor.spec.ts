import { flattenScreenshots } from './audit-processor';

describe('flattenScreenshots', () => {
  it('preserves flat array with mapped fields', () => {
    const raw = [
      {
        viewport: 'desktop',
        path: 'd.png',
        width: 1920,
        height: 1080,
        fileSize: 100,
      },
      { viewport: 'mobile', path: 'm.png' }, // missing optional fields
    ];
    const res = flattenScreenshots(raw);
    expect(res).toEqual([
      {
        viewport: 'desktop',
        path: 'd.png',
        width: 1920,
        height: 1080,
        fileSize: 100,
      },
      { viewport: 'mobile', path: 'm.png', width: 0, height: 0, fileSize: 0 },
    ]);
  });

  it('returns empty array for old nested object shape', () => {
    const raw = {
      viewport: { desktop: { path: 'd.png' } },
      fullPage: { desktop: { path: 'd.png' } },
    };
    expect(flattenScreenshots(raw)).toEqual([]);
  });

  it('returns empty array for null/undefined input', () => {
    expect(flattenScreenshots(null)).toEqual([]);
    expect(flattenScreenshots(undefined)).toEqual([]);
  });

  it('filters out entries missing viewport or path', () => {
    const raw = [
      { viewport: 'desktop', path: 'd.png' },
      { viewport: 'mobile' }, // missing path
      { path: 'm.png' }, // missing viewport
      {}, // missing both
    ];
    expect(flattenScreenshots(raw)).toEqual([
      { viewport: 'desktop', path: 'd.png', width: 0, height: 0, fileSize: 0 },
    ]);
  });
});
