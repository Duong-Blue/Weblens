import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('Audit Report PDF Export', () => {
  test.beforeEach(async ({ page }) => {
    // Route stub via page.route to mock API response
    await page.route('**/audits/*/result', async (route) => {
      const fixturePath = path.resolve(__dirname, 'fixtures', 'audit-result.json');
      const fixtureData = require(fixturePath);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          audit: {
            id: 'fixture-1',
            status: 'completed',
            url: 'https://example.com'
          },
          result: fixtureData
        })
      });
    });
  });

  test('report renders 13 sections', async ({ page }) => {
    await page.goto('/report/fixture-1');

    // Wait for the report cover to be visible
    await expect(page.locator('text=BÁO CÁO KIỂM TRA WEBSITE')).toBeVisible({ timeout: 10000 });

    const expectedHeadings = [
      '2. Crawler & Discovery',
      '3. Tóm tắt',
      '4. Thông tin website',
      '5. Hiệu năng',
      '6. SEO',
      '7. Accessibility',
      '8. Bảo mật',
      '9. Công nghệ',
      '10. Danh sách vấn đề',
      '11. Kế hoạch ưu tiên',
      '12. Kết luận',
      '13. Phụ lục'
    ];

    for (const heading of expectedHeadings) {
      await expect(page.locator(`text=${heading}`)).toBeVisible();
    }
  });

  test('page breaks', async ({ page }) => {
    await page.goto('/report/fixture-1');
    await expect(page.locator('text=BÁO CÁO KIỂM TRA WEBSITE')).toBeVisible();

    const sectionsWithBreak = [3, 5, 6, 7, 8, 10, 11, 12];
    const sectionsWithoutBreak = [4, 9];

    for (const sectionNumber of sectionsWithBreak) {
      const section = page.locator(`[data-report-section="${sectionNumber}"]`);
      await expect(section).toHaveClass(/report-page-break/);
    }

    for (const sectionNumber of sectionsWithoutBreak) {
      const section = page.locator(`[data-report-section="${sectionNumber}"]`);
      await expect(section).not.toHaveClass(/report-page-break/);
    }
  });

  test('print css styling via print emulation', async ({ page }) => {
    await page.goto('/report/fixture-1');
    await expect(page.locator('text=BÁO CÁO KIỂM TRA WEBSITE')).toBeVisible();

    // Emulate print media
    await page.emulateMedia({ media: 'print' });

    const section4 = page.locator(`[data-report-section="5"]`);
    const breakBefore = await section4.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.breakBefore || style.pageBreakBefore;
    });

    expect(breakBefore).toMatch(/page|always/);
  });
});