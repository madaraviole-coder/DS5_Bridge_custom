const fs = require('fs');

const testFile = 'g:/Documents/GitHub/DS5_Bridge_custom/companion/src/renderer/app-behavior.test.ts';
const content = fs.readFileSync(testFile, 'utf8');
const lines = content.split('\n');

const appSourceAssertions = [];
lines.forEach((l, idx) => {
  if (l.includes('appSource') || l.includes('extractFunction')) {
    appSourceAssertions.push({ line: idx + 1, text: l.trim() });
  }
});

console.log('Total appSource / extractFunction checks in app-behavior.test.ts:', appSourceAssertions.length);
appSourceAssertions.forEach(a => console.log(`${a.line}: ${a.text}`));
