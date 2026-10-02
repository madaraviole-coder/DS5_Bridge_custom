const fs = require('fs');

const appFile = 'g:/Documents/GitHub/DS5_Bridge_custom/companion/src/renderer/App.tsx';
const content = fs.readFileSync(appFile, 'utf8');
const lines = content.split('\n');

function inspectRange(name, startLine, endLine) {
  const slice = lines.slice(startLine - 1, endLine);
  const text = slice.join('\n');
  
  // Find variables/props used
  const bridgeCalls = Array.from(new Set(text.match(/window\.bridge\.[A-Za-z0-9_]+/g) || []));
  const stateSetters = Array.from(new Set(text.match(/set[A-Z][A-Za-z0-9_]+/g) || []));
  
  console.log(`\n======================================================`);
  console.log(`DOMAIN TAB: ${name} (Lines ${startLine} - ${endLine}, ${endLine - startLine + 1} LOC)`);
  console.log(`Bridge calls directly in JSX:`, bridgeCalls);
  console.log(`State setters directly in JSX:`, stateSetters);
}

inspectRange('Overview', 7560, 8057);
inspectRange('Devices', 8058, 8082);
inspectRange('Deadzones', 8083, 8216);
inspectRange('Haptics', 8217, 8679);
inspectRange('Audio', 8680, 9027);
inspectRange('Triggers', 9028, 9219);
inspectRange('Lighting', 9220, 9431);
inspectRange('Remapping', 9432, 10524);
inspectRange('Chords', 10525, 10983);
inspectRange('System', 10984, 11400);
