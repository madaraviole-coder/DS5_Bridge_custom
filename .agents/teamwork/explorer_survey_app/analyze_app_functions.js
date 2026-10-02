const fs = require('fs');

const appFile = 'g:/Documents/GitHub/DS5_Bridge_custom/companion/src/renderer/App.tsx';
const lines = fs.readFileSync(appFile, 'utf8').split('\n');

const functionsInsideApp = [];

for (let i = 3078; i < 7560; i++) {
  const line = lines[i];
  if (/^\s*(async\s+)?function\s+([A-Za-z0-9_]+)/.test(line)) {
    const match = line.match(/^\s*(async\s+)?function\s+([A-Za-z0-9_]+)/);
    functionsInsideApp.push({ line: i + 1, name: match[2], text: line.trim() });
  } else if (/^\s*const\s+([A-Za-z0-9_]+)\s*=\s*(async\s*)?\([^)]*\)\s*=>/.test(line)) {
    const match = line.match(/^\s*const\s+([A-Za-z0-9_]+)\s*=\s*(async\s*)?\([^)]*\)\s*=>/);
    functionsInsideApp.push({ line: i + 1, name: match[1], text: line.trim() });
  }
}

console.log('Total functions inside App():', functionsInsideApp.length);
functionsInsideApp.forEach(f => console.log(`${f.line}: ${f.name}`));
