#!/usr/bin/env node
/** Smoke: abre bot-lab e clica no primário via human-cdp. */
import { connect } from '../src/index.mjs';

const session = await connect({
  cdpUrl: process.env.CDP_URL || 'http://127.0.0.1:9230',
  url: 'http://127.0.0.1:8766/',
  urlIncludes: '8766',
});

await session.click('#btn-primary');
const v = await session.evaluate(
  `document.getElementById('score-verdict')?.textContent?.trim()`,
);
console.log('veredicto parcial:', v);
session.close();
