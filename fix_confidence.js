const fs = require('fs');
const files = [
  'weblens-backend/packages/audit-engine/src/engines/accessibility/wcag-mapper.service.ts',
  'weblens-backend/packages/audit-engine/src/engines/security/header-checker.service.ts',
  'weblens-backend/packages/audit-engine/src/engines/security/tls-validator.service.ts'
];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/source: ([^\n,]+)(,?)/g, (match, p1, p2) => {
    return `source: ${p1}, confidence: 1.0${p2}`;
  });
  fs.writeFileSync(file, content);
}
