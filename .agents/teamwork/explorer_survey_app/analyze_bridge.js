const fs = require('fs');

const appFile = 'g:/Documents/GitHub/DS5_Bridge_custom/companion/src/renderer/App.tsx';
const lines = fs.readFileSync(appFile, 'utf8').split('\n');

const bridgeCalls = [];
lines.forEach((l, idx) => {
  if (l.includes('window.bridge.')) {
    bridgeCalls.push({ line: idx + 1, text: l.trim() });
  }
});

console.log('Total window.bridge calls:', bridgeCalls.length);
const methodCounts = {};
bridgeCalls.forEach(c => {
  const matches = c.text.matchAll(/window\.bridge\.([a-zA-Z0-9_]+)/g);
  for (const m of matches) {
    methodCounts[m[1]] = (methodCounts[m[1]] || 0) + 1;
  }
});
console.log('Method counts:', methodCounts);
