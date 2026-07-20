import { test, expect } from '@playwright/test';

test.describe('User Journey', () => {
  test('register -> login -> audit -> view result flow', async ({ page }) => {
    page.on('request', request => {
      const u = request.url();
      if (u.includes('localhost:4000')) console.log('API Request:', request.method(), u);
    });

    await page.route('**/*', async (route, request) => {
      const url = request.url();
      if (url.includes('/auth/register')) {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'User registered successfully',
            userId: 'test-user-id'
          })
        });
      } else if (url.includes('/auth/login')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            access_token: 'fake-jwt-token'
          })
        });
      } else if (url.includes('/audits/test-audit-id') || url.includes('/audits/test-audit-id/result')) {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                result: {
                  seoScore: 90,
                  perfScore: 80,
                  accScore: 85,
                  securityScore: 100,
                  techStack: { framework: 'Next.js' },
                  networkDetails: { requests: 10 },
                  structureDetails: { nodes: 100 },
                  jsErrorsDetails: [],
                  aiSummary: "Looks good!"
                },
                audit: {
                  id: 'test-audit-id',
                  url: 'https://example.com',
                  status: 'completed',
                  createdAt: new Date().toISOString()
                }
              }
            })
        });
      } else if (url.match(/\/audits\b/)) {
        if (request.method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                audit: {
                  id: 'test-audit-id',
                  status: 'pending',
                  url: 'https://example.com'
                }
              }
            })
          });
        } else if (request.method() === 'GET') {
          const urlParams = new URL(url).searchParams;
          if (urlParams.get('url')) {
               await route.fulfill({
                  status: 200,
                  contentType: 'application/json',
                  body: JSON.stringify({
                    data: []
                  })
               });
          } else {
               await route.fulfill({
                  status: 200,
                  contentType: 'application/json',
                  body: JSON.stringify({
                    data: [
                      {
                        id: 'test-audit-id',
                        url: 'https://example.com',
                        status: 'completed',
                        createdAt: new Date().toISOString(),
                        scores: { seo: 90, performance: 80, accessibility: 85, security: 100 }
                      }
                    ]
                  })
              });
          }
        } else {
          await route.continue();
        }
      } else if (url.includes('/user/profile') || url.includes('/users/profile') || url.includes('/auth/me') || url.includes('profile')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: 'test-user-id',
              email: 'testuser@example.com'
            }
          })
        });
      } else if (url.includes('socket.io')) {
        await route.fulfill({
            status: 200,
            contentType: 'text/plain',
            body: '0{"sid":"mock-sid","upgrades":["websocket"],"pingInterval":25000,"pingTimeout":5000}'
        });
      } else {
        await route.continue();
      }
    });


    // 2. Register
    await page.goto('/register');
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to login
    await expect(page).toHaveURL(/.*\/login/);

    // 3. Login
    await page.fill('input[type="email"]', 'testuser@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL(/.*\/dashboard/);

    await expect(page.locator('input[placeholder="example.com"]')).toBeVisible({ timeout: 10000 });
    
    // 4. Start Audit
    await page.fill('input[placeholder="example.com"]', 'https://example.com');
    await page.click('button[type="submit"]', { force: true });

    await expect(page.locator('text=example.com')).toBeVisible();
    
    for (let i = 0; i < 3; i++) {
        await page.evaluate(() => {
            window.dispatchEvent(new CustomEvent('test-trigger-poll'));
        });
        await page.waitForTimeout(500);
    }
    
    await expect(page.locator('text=Performance').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=90').first()).toBeVisible();
  });
});
