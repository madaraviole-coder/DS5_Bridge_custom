const fs = require('fs');

const appFile = 'g:/Documents/GitHub/DS5_Bridge_custom/companion/src/renderer/App.tsx';
const lines = fs.readFileSync(appFile, 'utf8').split('\n');

const tabs = [
  { name: 'Overview', start: 7560, end: 8057 },
  { name: 'Devices', start: 8058, end: 8082 },
  { name: 'Deadzones', start: 8083, end: 8216 },
  { name: 'Haptics', start: 8217, end: 8679 },
  { name: 'Audio', start: 8680, end: 9027 },
  { name: 'Triggers', start: 9028, end: 9219 },
  { name: 'Lighting', start: 9220, end: 9431 },
  { name: 'Remapping', start: 9432, end: 10524 },
  { name: 'Chords', start: 10525, end: 10983 },
  { name: 'System', start: 10984, end: 11400 },
  { name: 'Dialogs & Modals', start: 11401, end: 12508 }
];

tabs.forEach(t => {
  const tabLines = lines.slice(t.start - 1, t.end);
  const text = tabLines.join('\n');
  
  // Count buttons, selects, inputs, switches
  const buttons = (text.match(/<button/g) || []).length;
  const customSelects = (text.match(/<CustomSelect/g) || []).length;
  const inputs = (text.match(/<input/g) || []).length;
  const sections = (text.match(/<section/g) || []).length;
  const switches = (text.match(/role="switch"|role='switch'/g) || []).length;

  console.log(`=== Tab: ${t.name} (Lines ${t.start}-${t.end}, Total: ${t.end - t.start + 1} LOC) ===`);
  console.log(`  Sections: ${sections}, Buttons: ${buttons}, CustomSelects: ${customSelects}, Inputs: ${inputs}, Switches: ${switches}`);
});
