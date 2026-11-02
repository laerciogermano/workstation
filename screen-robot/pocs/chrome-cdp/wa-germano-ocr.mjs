/**
 * Abre/conecta WhatsApp no germano (:9230) com debug e imprime OCR.
 *   node wa-germano-ocr.mjs
 */
import { connect } from './human-cdp/src/index.mjs';
import { execFileSync } from 'node:child_process';

const page = await connect({
  cdpUrl: 'http://127.0.0.1:9230',
  urlIncludes: 'web.whatsapp.com',
  debug: true,
});

await page.bringToFront();
try {
  execFileSync('osascript', ['-e', 'tell application "Google Chrome" to activate']);
} catch {
  /* ignore */
}

const deadline = Date.now() + 60000;
let state = 'unknown';
let last = null;
while (Date.now() < deadline) {
  last = await page.evaluate(`(() => {
    const t = (document.body?.innerText || '').replace(/\\s+/g, ' ');
    const side = document.querySelector('#pane-side');
    const chatList =
      document.querySelector('[data-testid="chat-list"]') ||
      document.querySelector('[aria-label="Lista de conversas"]') ||
      document.querySelector('[aria-label="Chat list"]') ||
      side;
    const qr =
      !!document.querySelector('canvas') &&
      /QR|Escaneie|telefone|Link with phone/i.test(t);
    return {
      title: document.title,
      href: location.href,
      hasSide: !!side,
      hasChatList: !!chatList,
      qr,
      textLen: t.length,
      sample: t.slice(0, 400),
    };
  })()`);
  if (last.hasChatList || last.hasSide) {
    state = 'chats';
    break;
  }
  if (last.qr) state = 'qr';
  await new Promise((r) => setTimeout(r, 1000));
}

if (state === 'chats') await new Promise((r) => setTimeout(r, 2000));

const png =
  '/Users/laerciogermano/Documents/works/screen-robot/screenshots/germano-whatsapp-ocr.png';
const result = await page.ocr({
  engine: 'macos-vision',
  path: png,
  keepFile: true,
});

console.log(
  JSON.stringify(
    {
      state,
      probe: last,
      debug: true,
      engine: result.engine,
      imagePath: result.imagePath,
      wordsCount: result.words.length,
      text: result.text,
      words: result.words,
    },
    null,
    2,
  ),
);
