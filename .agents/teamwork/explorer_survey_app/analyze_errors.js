const fs = require('fs');

const appFile = 'g:/Documents/GitHub/DS5_Bridge_custom/companion/src/renderer/App.tsx';
const lines = fs.readFileSync(appFile, 'utf8').split('\n');

const errorMatches = [];
lines.forEach((l, idx) => {
  if (l.includes('catch') || l.includes('Error') || l.includes('connected') || l.includes('reconnect') || l.includes('ErrorBoundary')) {
    errorMatches.push({ line: idx + 1, text: l.trim() });
  }
});

console.log('Error / connection matches count:', errorMatches.length);
errorMatches.slice(0, 40).forEach(m => console.log(`${m.line}: ${m.text}`));
