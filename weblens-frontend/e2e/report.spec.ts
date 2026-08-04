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

  test('report renders 12 sections', async ({ page }) => {
    await page.goto('/report/fixture-1');

    // Wait for the report cover to be visible
    await expect(page.locator('text=BÁO CÁO KIỂM TRA WEBSITE')).toBeVisible({ timeout: 10000 });

    const expectedHeadings = [
      '2. Tóm tắt',
      '3. Thông tin website',
      '4. Hiệu năng',
      '5. SEO',
      '6. Accessibility',
      '7. Bảo mật',
      '8. Công nghệ',
      '9. Danh sách vấn đề',
      '10. Kế hoạch ưu tiên',
      '11. Kết luận',
      '12. Phụ lục'
    ];

    for (const heading of expectedHeadings) {
      await expect(page.locator(`text=${heading}`)).toBeVisible();
    }
    
    await expect(page.getByText('Ảnh SERP (Google)')).toBeVisible();
    await expect(page.getByText('SERP — Desktop')).toBeVisible();
  });

  test('empty screenshots hide SERP block', async ({ page }) => {
    await page.route('**/audits/*/result', async (route) => {
      const fixturePath = path.resolve(__dirname, 'fixtures', 'audit-result.json');
      const fixtureData = require(fixturePath);
      // Strip screenshots
      fixtureData.screenshots = [];
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

    await page.goto('/report/fixture-1');
    await expect(page.locator('text=BÁO CÁO KIỂM TRA WEBSITE')).toBeVisible({ timeout: 10000 });
    
    await expect(page.locator('text=3. Thông tin website')).toBeVisible();
    await expect(page.getByText('Ảnh SERP (Google)')).toHaveCount(0);
  });

  test('page breaks', async ({ page }) => {
    await page.goto('/report/fixture-1');
    await expect(page.locator('text=BÁO CÁO KIỂM TRA WEBSITE')).toBeVisible();

    const sectionsWithBreak = [2, 4, 5, 6, 7, 9, 10];
    const sectionsWithoutBreak = [3, 8];

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

    const section4 = page.locator(`[data-report-section="4"]`);
    const breakBefore = await section4.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.breakBefore || style.pageBreakBefore;
    });

    expect(breakBefore).toMatch(/page|always/);
  });
});