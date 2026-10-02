const fs = require('fs');

const appFile = 'g:/Documents/GitHub/DS5_Bridge_custom/companion/src/renderer/App.tsx';
const lines = fs.readFileSync(appFile, 'utf8').split('\n');

console.log('App.tsx line count:', lines.length);

const sections = [
  { name: 'Imports & Types', start: 1, end: 1291 },
  { name: 'Standalone Components (pre-App)', start: 1292, end: 2846 },
  { name: 'Chord & Remapping Math / Helpers', start: 2847, end: 3078 },
  { name: 'App Hook States & Refs', start: 3079, end: 3506 },
  { name: 'App Effects & Snapshot Ingestion', start: 3507, end: 4548 },
  { name: 'App Domain Handlers & Callbacks', start: 4549, end: 7559 },
  { name: 'Sidebar Navigation JSX', start: 7200, end: 7559 },
  { name: 'Tab: Overview', start: 7560, end: 8057 },
  { name: 'Tab: Devices', start: 8058, end: 8082 },
  { name: 'Tab: Deadzones', start: 8083, end: 8216 },
  { name: 'Tab: Haptics', start: 8217, end: 8679 },
  { name: 'Tab: Audio', start: 8680, end: 9027 },
  { name: 'Tab: Triggers', start: 9028, end: 9219 },
  { name: 'Tab: Lighting', start: 9220, end: 9431 },
  { name: 'Tab: Remapping', start: 9432, end: 10524 },
  { name: 'Tab: Chords', start: 10525, end: 10983 },
  { name: 'Tab: System', start: 10984, end: 11400 },
  { name: 'Dialogs, Modals & Toast Overlays', start: 11401, end: 12508 }
];

sections.forEach(s => {
  console.log(`${s.name.padEnd(35)}: Lines ${s.start.toString().padStart(5)} - ${s.end.toString().padStart(5)} (${(s.end - s.start + 1).toString().padStart(5)} LOC)`);
});
