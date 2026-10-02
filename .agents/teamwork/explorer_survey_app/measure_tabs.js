const fs = require('fs');

const appFile = 'g:/Documents/GitHub/DS5_Bridge_custom/companion/src/renderer/App.tsx';
const lines = fs.readFileSync(appFile, 'utf8').split('\n');

for (let i = 3200; i < 3500; i++) {
  const line = lines[i];
  if (line.includes('onSnapshot') || line.includes('getStatus') || line.includes('setSnapshot')) {
    console.log(`${i + 1}: ${line.trim()}`);
  }
}
