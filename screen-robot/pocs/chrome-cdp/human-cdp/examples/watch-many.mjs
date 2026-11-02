#!/usr/bin/env node
import { connect, sleep } from '../src/index.mjs';
import { execFileSync } from 'node:child_process';

try {
  execFileSync('osascript', ['-e', 'tell application "Google Chrome" to activate'], {
    stdio: 'ignore',
  });
} catch {
  /* ignore */
}

const page = await connect({
  cdpUrl: process.env.CDP_URL || 'http://127.0.0.1:9230',
  urlIncludes: '8766',
  url: 'http://127.0.0.1:8766/',
  focused: true,
});

const step = async (cmd, fn) => {
  console.log('\n>>>', cmd);
  await fn();
  await sleep(Number(process.env.STEP_MS || 1600));
};

await page.bringToFront();
await sleep(800);

await step("await page.goto('http://127.0.0.1:8766/')", () =>
  page.goto('http://127.0.0.1:8766/'),
);
await step("await page.click('#btn-reset')", () => page.click('#btn-reset'));
await step("await page.click('#btn-primary')", () => page.click('#btn-primary'));
await step("await page.click('#btn-primary')", () => page.click('#btn-primary'));
await step("await page.click('#btn-secondary')", () => page.click('#btn-secondary'));
await step("await page.click('#link-demo')", () => page.click('#link-demo'));
await step("await page.drag('#drag-handle', { dx: 140 })", () =>
  page.drag('#drag-handle', { dx: 140 }),
);
await step("await page.type('#input-nome', 'teste 1', { clear: true })", () =>
  page.type('#input-nome', 'teste 1', { clear: true }),
);
await step("await page.select('#select-opcao', 'b')", () =>
  page.select('#select-opcao', 'b'),
);
await step("await page.click('#btn-primary')", () => page.click('#btn-primary'));

console.log(
  '\n--- r1',
  await page.evaluate(`document.getElementById('score-verdict')?.textContent?.trim()`),
);

await sleep(1000);
await step("await page.click('#btn-reset')", () => page.click('#btn-reset'));
await step("await page.hover('#btn-secondary')", () => page.hover('#btn-secondary'));
await step("await page.click('#btn-secondary')", () => page.click('#btn-secondary'));
await step("await page.click('#btn-primary')", () => page.click('#btn-primary'));
await step("await page.drag('#drag-handle', { dx: 180 })", () =>
  page.drag('#drag-handle', { dx: 180 }),
);
await step("await page.type('#input-nome', 'teste 2', { clear: true })", () =>
  page.type('#input-nome', 'teste 2', { clear: true }),
);
await step("await page.click('#btn-primary')", () => page.click('#btn-primary'));
await step("await page.click('#btn-secondary')", () => page.click('#btn-secondary'));

console.log(
  '\n--- r2',
  await page.evaluate(`document.getElementById('score-verdict')?.textContent?.trim()`),
);

await sleep(1000);
await step("await page.click('#btn-reset')", () => page.click('#btn-reset'));
await step("await page.click('#btn-primary')", () => page.click('#btn-primary'));
await step("await page.click('#btn-primary')", () => page.click('#btn-primary'));
await step("await page.click('#btn-primary')", () => page.click('#btn-primary'));
await step("await page.drag('#drag-handle', { dx: 120 })", () =>
  page.drag('#drag-handle', { dx: 120 }),
);
await step("await page.type('#input-nome', 'varios testes', { clear: true })", () =>
  page.type('#input-nome', 'varios testes', { clear: true }),
);
await step("await page.click('#btn-secondary')", () => page.click('#btn-secondary'));

const v = await page.evaluate(`({
  verdict: document.getElementById('score-verdict')?.textContent?.trim(),
  meta: document.getElementById('score-meta')?.textContent?.trim(),
})`);
console.log('\n======== FINAL', v.verdict);
console.log(v.meta);
await sleep(2000);
page.close();
