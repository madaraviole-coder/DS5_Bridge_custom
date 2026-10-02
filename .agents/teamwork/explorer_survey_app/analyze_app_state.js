const fs = require('fs');

const appFile = 'g:/Documents/GitHub/DS5_Bridge_custom/companion/src/renderer/App.tsx';
const lines = fs.readFileSync(appFile, 'utf8').split('\n');

const states = [];
for (let i = 3078; i < 7560; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  if (trimmed.startsWith('const [') && trimmed.includes('useState')) {
    states.push({ line: i + 1, text: trimmed });
  }
}

console.log('Total states:', states.length);
states.slice(0, 32).forEach(s => console.log(`${s.line}: ${s.text}`));
