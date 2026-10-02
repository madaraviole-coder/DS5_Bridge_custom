const fs = require('fs');

const appFile = 'g:/Documents/GitHub/DS5_Bridge_custom/companion/src/renderer/App.tsx';
const content = fs.readFileSync(appFile, 'utf8');
const lines = content.split('\n');

console.log('--- ControlTab occurrences ---');
lines.forEach((line, idx) => {
  if (line.includes('ControlTab') || line.includes("'overview'") || line.includes("'deadzones'")) {
    console.log(`${idx + 1}: ${line.trim()}`);
  }
});
