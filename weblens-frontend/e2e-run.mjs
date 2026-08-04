import { execSync } from 'child_process';
try {
  execSync('npx playwright test e2e/report.spec.ts --project=chromium', {stdio: 'inherit', env: {...process.env, DEBUG: 'pw:api'}});
} catch (e) {
  console.log('Failed');
}
