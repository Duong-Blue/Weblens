# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: user-journey.spec.ts >> User Journey >> register -> login -> audit -> view result flow
- Location: tests\user-journey.spec.ts:4:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Performance').first()
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('text=Performance').first()

```

```yaml
- alert
- banner:
  - heading "WebLens" [level=1]
  - text: testuser@example.com
  - button "Logout"
- main:
  - heading "Start New Audit" [level=2]
  - textbox "example.com"
  - button "Audit Now" [disabled]
```

# Test source

```ts
  55  |       } else if (url.match(/\/audits\b/)) {
  56  |         if (request.method() === 'POST') {
  57  |           await route.fulfill({
  58  |             status: 201,
  59  |             contentType: 'application/json',
  60  |             body: JSON.stringify({
  61  |               data: {
  62  |                 audit: {
  63  |                   id: 'test-audit-id',
  64  |                   status: 'pending',
  65  |                   url: 'https://example.com'
  66  |                 }
  67  |               }
  68  |             })
  69  |           });
  70  |         } else if (request.method() === 'GET') {
  71  |           const urlParams = new URL(url).searchParams;
  72  |           if (urlParams.get('url')) {
  73  |                await route.fulfill({
  74  |                   status: 200,
  75  |                   contentType: 'application/json',
  76  |                   body: JSON.stringify({
  77  |                     data: []
  78  |                   })
  79  |                });
  80  |           } else {
  81  |                await route.fulfill({
  82  |                   status: 200,
  83  |                   contentType: 'application/json',
  84  |                   body: JSON.stringify({
  85  |                     data: [
  86  |                       {
  87  |                         id: 'test-audit-id',
  88  |                         url: 'https://example.com',
  89  |                         status: 'completed',
  90  |                         createdAt: new Date().toISOString(),
  91  |                         scores: { seo: 90, performance: 80, accessibility: 85, security: 100 }
  92  |                       }
  93  |                     ]
  94  |                   })
  95  |               });
  96  |           }
  97  |         } else {
  98  |           await route.continue();
  99  |         }
  100 |       } else if (url.includes('/user/profile') || url.includes('/users/profile') || url.includes('/auth/me') || url.includes('profile')) {
  101 |         await route.fulfill({
  102 |           status: 200,
  103 |           contentType: 'application/json',
  104 |           body: JSON.stringify({
  105 |             data: {
  106 |               id: 'test-user-id',
  107 |               email: 'testuser@example.com'
  108 |             }
  109 |           })
  110 |         });
  111 |       } else if (url.includes('socket.io')) {
  112 |         await route.fulfill({
  113 |             status: 200,
  114 |             contentType: 'text/plain',
  115 |             body: '0{"sid":"mock-sid","upgrades":["websocket"],"pingInterval":25000,"pingTimeout":5000}'
  116 |         });
  117 |       } else {
  118 |         await route.continue();
  119 |       }
  120 |     });
  121 | 
  122 | 
  123 |     // 2. Register
  124 |     await page.goto('/register');
  125 |     await page.fill('input[type="email"]', 'testuser@example.com');
  126 |     await page.fill('input[type="password"]', 'password123');
  127 |     await page.click('button[type="submit"]');
  128 | 
  129 |     // Wait for redirect to login
  130 |     await expect(page).toHaveURL(/.*\/login/);
  131 | 
  132 |     // 3. Login
  133 |     await page.fill('input[type="email"]', 'testuser@example.com');
  134 |     await page.fill('input[type="password"]', 'password123');
  135 |     await page.click('button[type="submit"]');
  136 | 
  137 |     // Wait for redirect to dashboard
  138 |     await expect(page).toHaveURL(/.*\/dashboard/);
  139 | 
  140 |     await expect(page.locator('input[placeholder="example.com"]')).toBeVisible({ timeout: 10000 });
  141 |     
  142 |     // 4. Start Audit
  143 |     await page.fill('input[placeholder="example.com"]', 'https://example.com');
  144 |     await page.click('button[type="submit"]', { force: true });
  145 | 
  146 |     await expect(page.locator('text=example.com')).toBeVisible();
  147 |     
  148 |     for (let i = 0; i < 3; i++) {
  149 |         await page.evaluate(() => {
  150 |             window.dispatchEvent(new CustomEvent('test-trigger-poll'));
  151 |         });
  152 |         await page.waitForTimeout(500);
  153 |     }
  154 |     
> 155 |     await expect(page.locator('text=Performance').first()).toBeVisible({ timeout: 15000 });
      |                                                            ^ Error: expect(locator).toBeVisible() failed
  156 |     await expect(page.locator('text=90').first()).toBeVisible();
  157 |   });
  158 | });
  159 | 
```