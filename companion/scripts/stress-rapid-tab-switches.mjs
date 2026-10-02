import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const sequence = [
  'Overview',
  'Haptics',
  'Audio',
  'Adaptive Triggers',
  'Lighting',
  'System',
  'Audio Haptics'
];

const tabMeta = {
  'Overview': { id: 'overview', group: null, panelId: 'control-panel-overview' },
  'Haptics': { id: 'haptics', group: 'controller', panelId: 'control-panel-haptics' },
  'Audio': { id: 'audio', group: 'controller', panelId: 'control-panel-audio' },
  'Adaptive Triggers': { id: 'triggers', group: 'controller', panelId: 'control-panel-triggers' },
  'Lighting': { id: 'lighting', group: 'controller', panelId: 'control-panel-lighting' },
  'System': { id: 'system', group: null, panelId: 'control-panel-system' },
  'Audio Haptics': { id: 'audio-haptics', group: 'labs', panelId: 'control-panel-haptics' }
};

const app = await electron.launch({
  args: ['.'],
  cwd: root,
  env: {
    ...process.env,
    DS5_BRIDGE_ALLOW_PARALLEL_AUTOMATION_INSTANCE: '1'
  }
});

const pageErrors = [];
const consoleErrors = [];

try {
  const page = await app.firstWindow();

  page.on('pageerror', (error) => {
    pageErrors.push(error.toString());
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('.hero-card', { timeout: 10000 });
  await page.waitForTimeout(250);

  // Dismiss tutorial if present
  const startupTutorial = page.getByRole('dialog', { name: 'Feature tile tutorial' });
  if (await startupTutorial.count()) {
    await page.getByLabel('Toggle example effect').click();
    await page.getByRole('button', { name: /Next/ }).click();
    await page.getByRole('button', { name: 'Continue' }).click({ timeout: 7000 });
    await page.waitForTimeout(200);
  }

  const controlsNav = page.getByRole('tablist', { name: 'Controls' });

  // Direct tab click helper
  async function clickTab(tabName) {
    if (tabName === 'System') {
      await page.locator('#control-tab-system').click();
      return;
    }
    const meta = tabMeta[tabName];
    const button = page.locator(`#control-tab-${meta.id}`);

    // If button is inside an accordion that is not visible, click group trigger first
    if (!(await button.isVisible())) {
      const groupTrigger = page.locator(`#control-group-${meta.group}`);
      if (await groupTrigger.isVisible()) {
        await groupTrigger.click();
        await page.waitForTimeout(50);
      }
    }
    await button.click();
  }

  // State verification oracle
  async function verifyDomState(expectedTab) {
    const meta = tabMeta[expectedTab];
    return await page.evaluate((expected) => {
      const issues = [];

      // 1. Check active tab button
      const activeTabs = [...document.querySelectorAll('button[role="tab"].active, button[role="tab"][aria-selected="true"]')];
      const targetButton = document.querySelector(`#control-tab-${expected.id}`);

      if (!targetButton) {
        issues.push(`Target tab button #control-tab-${expected.id} not found in DOM`);
      } else {
        const isSelected = targetButton.getAttribute('aria-selected') === 'true';
        const hasActiveClass = targetButton.classList.contains('active');
        if (!isSelected) issues.push(`Button #control-tab-${expected.id} does not have aria-selected="true"`);
        if (!hasActiveClass) issues.push(`Button #control-tab-${expected.id} does not have .active class`);
      }

      // Check no other tab button has active/selected
      for (const btn of activeTabs) {
        if (btn.id !== `control-tab-${expected.id}`) {
          issues.push(`Extraneous active/selected tab button: #${btn.id}`);
        }
      }

      // 2. Check group expansion and contains-active
      const groups = [...document.querySelectorAll('.control-tab-group')];
      for (const group of groups) {
        const trigger = group.querySelector('.control-tab-group-trigger');
        const triggerId = trigger?.id ?? '';
        const groupId = triggerId.replace('control-group-', '');
        const isTargetGroup = expected.group === groupId;
        const containsActive = group.classList.contains('contains-active');
        const isExpanded = group.classList.contains('expanded');
        const ariaExpanded = trigger?.getAttribute('aria-expanded') === 'true';

        if (isTargetGroup) {
          if (!containsActive) issues.push(`Group ${groupId} should have .contains-active`);
          if (!isExpanded) issues.push(`Group ${groupId} should have .expanded`);
          if (!ariaExpanded) issues.push(`Group ${groupId} trigger should have aria-expanded="true"`);
        } else {
          if (containsActive) issues.push(`Group ${groupId} should NOT have .contains-active`);
        }
      }

      // 3. Check active page panel
      const activePages = [...document.querySelectorAll('.control-page.active')];
      if (activePages.length !== 1) {
        issues.push(`Expected exactly 1 .control-page.active, found ${activePages.length} (${activePages.map(p => p.id).join(', ')})`);
      } else if (activePages[0].id !== expected.panelId) {
        issues.push(`Active page id is ${activePages[0].id}, expected ${expected.panelId}`);
      }

      // 4. Check for ErrorBoundary fallbacks
      const fallbackElements = document.querySelectorAll('.error-boundary-fallback, .tab-error-fallback, .root-error-fallback');
      if (fallbackElements.length > 0) {
        issues.push(`ErrorBoundary fallback detected in DOM! Count: ${fallbackElements.length}`);
      }

      // 5. Special check for Audio Haptics vs standard Haptics when on control-panel-haptics
      if (expected.id === 'audio-haptics') {
        const heading = document.querySelector('#control-panel-haptics h2');
        if (heading?.textContent?.trim() !== 'Audio Haptics') {
          issues.push(`Heading in #control-panel-haptics is "${heading?.textContent}", expected "Audio Haptics"`);
        }
        const audioHapticsGrid = document.querySelector('#control-panel-haptics .audio-haptics-grid');
        if (!audioHapticsGrid) {
          issues.push('Expected .audio-haptics-grid inside #control-panel-haptics');
        }
      } else if (expected.id === 'haptics') {
        const heading = document.querySelector('#control-panel-haptics h2');
        if (heading?.textContent?.trim() !== 'Haptics') {
          issues.push(`Heading in #control-panel-haptics is "${heading?.textContent}", expected "Haptics"`);
        }
      }

      return issues;
    }, meta);
  }

  const stressResults = {
    phase1_standard: [],
    phase2_bursts: [],
    phase3_thrash: [],
    phase4_accordion: [],
    totalSwitches: 0,
    failures: []
  };

  console.log('--- Phase 1: Baseline Single-Pass Navigation (150ms delay) ---');
  for (const tab of sequence) {
    await clickTab(tab);
    await page.waitForTimeout(150);
    stressResults.totalSwitches++;
    const issues = await verifyDomState(tab);
    if (issues.length > 0) {
      const err = `Phase 1 [${tab}]: ${issues.join('; ')}`;
      stressResults.failures.push(err);
      console.error('FAIL:', err);
    } else {
      stressResults.phase1_standard.push({ tab, status: 'PASS' });
      console.log(`PASS: Tab ${tab} settled correctly`);
    }
  }

  console.log('\n--- Phase 2: High-Frequency Rapid Bursts ---');
  const delays = [20, 5, 0];
  for (const delay of delays) {
    console.log(`Burst with ${delay}ms delay...`);
    for (const tab of sequence) {
      await clickTab(tab);
      stressResults.totalSwitches++;
      if (delay > 0) await page.waitForTimeout(delay);
    }
    // After burst, wait 200ms and verify final tab (Audio Haptics)
    await page.waitForTimeout(200);
    const issues = await verifyDomState('Audio Haptics');
    if (issues.length > 0) {
      const err = `Phase 2 [${delay}ms burst]: ${issues.join('; ')}`;
      stressResults.failures.push(err);
      console.error('FAIL:', err);
    } else {
      stressResults.phase2_bursts.push({ delay: `${delay}ms`, finalTab: 'Audio Haptics', status: 'PASS' });
      console.log(`PASS: Burst (${delay}ms) settled cleanly on Audio Haptics`);
    }
  }

  console.log('\n--- Phase 3: Multi-Cycle Rapid Thrashing (20 cycles, 140 switches) ---');
  const cycleCount = 20;
  let cycleIssues = 0;
  for (let c = 1; c <= cycleCount; c++) {
    for (const tab of sequence) {
      await clickTab(tab);
      stressResults.totalSwitches++;
      await page.waitForTimeout(15);
    }
    // Verify settling at end of each cycle
    await page.waitForTimeout(100);
    const issues = await verifyDomState('Audio Haptics');
    if (issues.length > 0) {
      cycleIssues++;
      stressResults.failures.push(`Cycle ${c}: ${issues.join('; ')}`);
    }
  }
  console.log(`Completed ${cycleCount} rapid cycles (${cycleCount * sequence.length} switches). Cycle failures: ${cycleIssues}`);
  stressResults.phase3_thrash.push({ cycles: cycleCount, totalSwitches: cycleCount * sequence.length, cycleIssues, status: cycleIssues === 0 ? 'PASS' : 'FAIL' });

  console.log('\n--- Phase 4: Adversarial Accordion Collapsing Interleaving ---');
  // 1. Navigate to Haptics
  await clickTab('Haptics');
  await page.waitForTimeout(100);
  let p4Issues = await verifyDomState('Haptics');
  if (p4Issues.length) stressResults.failures.push(`Phase 4.1: ${p4Issues.join('; ')}`);

  // 2. Collapse Controller group while Haptics is active
  await page.locator('#control-group-controller').click();
  await page.waitForTimeout(100);
  const collapseCheck = await page.evaluate(() => {
    const group = document.querySelector('.control-tab-group');
    const trigger = group?.querySelector('.control-tab-group-trigger');
    const isExpanded = group?.classList.contains('expanded');
    const containsActive = group?.classList.contains('contains-active');
    const ariaExpanded = trigger?.getAttribute('aria-expanded');
    return { isExpanded, containsActive, ariaExpanded };
  });

  if (collapseCheck.isExpanded || collapseCheck.ariaExpanded === 'true') {
    stressResults.failures.push('Phase 4.2: Group should be collapsed after clicking trigger');
  }
  if (!collapseCheck.containsActive) {
    stressResults.failures.push('Phase 4.2: Collapsed group with active child must retain .contains-active');
  }
  console.log('Accordion collapse check while active child retained:', collapseCheck);

  // 3. Switch to Overview, then re-expand Controller and click Adaptive Triggers
  await clickTab('Overview');
  await page.waitForTimeout(100);
  await clickTab('Adaptive Triggers');
  await page.waitForTimeout(100);
  p4Issues = await verifyDomState('Adaptive Triggers');
  if (p4Issues.length) {
    stressResults.failures.push(`Phase 4.3: ${p4Issues.join('; ')}`);
    console.error('FAIL Phase 4.3:', p4Issues);
  } else {
    console.log('PASS: Re-expanded and switched to Adaptive Triggers successfully');
    stressResults.phase4_accordion.push({ status: 'PASS' });
  }

  console.log('\n--- Phase 5: Overflow & Layout Verification Post-Stress ---');
  const postStressOverflow = await page.evaluate(() => {
    const activePage = document.querySelector('.control-page.active');
    const sidebar = document.querySelector('.hero-card');
    return {
      activePageId: activePage?.id,
      pageHorizontalOverflow: activePage ? Math.max(0, activePage.scrollWidth - activePage.clientWidth) : null,
      sidebarOverflow: sidebar ? Math.max(0, sidebar.scrollHeight - sidebar.clientHeight) : null
    };
  });
  console.log('Post-stress overflow evaluation:', postStressOverflow);
  if (postStressOverflow.pageHorizontalOverflow > 1) {
    stressResults.failures.push(`Post-stress page horizontal overflow: ${postStressOverflow.pageHorizontalOverflow}px`);
  }
  if (postStressOverflow.sidebarOverflow > 1) {
    stressResults.failures.push(`Post-stress sidebar overflow: ${postStressOverflow.sidebarOverflow}px`);
  }

  // Check console and page errors
  if (pageErrors.length > 0) {
    console.error('Page errors encountered during stress test:', pageErrors);
    stressResults.failures.push(`Page errors: ${pageErrors.join('; ')}`);
  }
  if (consoleErrors.length > 0) {
    console.error('Console errors encountered during stress test:', consoleErrors);
    stressResults.failures.push(`Console errors: ${consoleErrors.join('; ')}`);
  }

  console.log('\n================ STRESS TEST SUMMARY ================');
  console.log(`Total tab switches executed: ${stressResults.totalSwitches}`);
  console.log(`Total failures: ${stressResults.failures.length}`);
  console.log(`Page errors: ${pageErrors.length}`);
  console.log(`Console errors: ${consoleErrors.length}`);

  if (stressResults.failures.length > 0) {
    console.error('Failures detail:', stressResults.failures);
    process.exitCode = 1;
  } else {
    console.log('ALL PHASES PASSED WITH ZERO FAILURES AND ZERO ERRORS.');
  }

} finally {
  await app.close();
}
