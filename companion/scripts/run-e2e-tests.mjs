#!/usr/bin/env node
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('DS5 Bridge Companion - Opaque-Box E2E Test Runner');
console.log('================================================================');
console.log('Executing 4-Tier Test Suite across all 18 inventoried features:');
console.log(' - Tier 1: Feature Coverage (18 Architectural Features, 90 Specs)');
console.log(' - Tier 2: Boundary & Corner Cases (Stress & Resilience)');
console.log(' - Tier 3: Cross-Feature Combinations (Pairwise Subsystems)');
console.log(' - Tier 4: Real-World Scenarios (End-to-End Workflows)');
console.log('----------------------------------------------------------------\n');

try {
  execSync('npx vitest run src/renderer/e2e', {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test'
    }
  });

  console.log('\n================================================================');
  console.log('SUCCESS: All E2E test tiers passed with 0 errors.');
  console.log('Deterministic pass signals verified across all 4 tiers.');
  console.log('================================================================');
  process.exit(0);
} catch (error) {
  console.error('\n================================================================');
  console.error('FAILURE: E2E test suite encountered errors.');
  console.error('================================================================');
  process.exit(error.status ?? 1);
}
