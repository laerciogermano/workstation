import { extract } from './lib/extract.js';
import { tapElement, scroll } from './lib/operate.js';
import { execSync } from 'child_process';
import fs from 'fs';

const serial = 'emulator-5554';

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function run() {
  console.log('Iniciando jornada...');

  // 1. Go Home
  execSync(`adb -s ${serial} shell input keyevent 3`);
  await sleep(2000);

  // 2. Open Google Search directly via Intent
  console.log('Pesquisando "metafisica" no Google...');
  execSync(`adb -s ${serial} shell am start -a android.intent.action.VIEW -d "https://www.google.com/search?q=metafisica"`);
  await sleep(6000); // wait for page to load

  // 4. Find the first article (Wikipedia)
  console.log('Procurando artigo da Wikipedia...');
  let maxScrolls = 5;
  let clicked = false;
  
  for (let i = 0; i < maxScrolls; i++) {
    const results = await extract({ serial });
    
    const wikiEl = results.find(e => e.type === 'text' && e.text.toLowerCase().includes('wikipedia'));
    if (wikiEl) {
      console.log('Encontrado Wikipedia, clicando...');
      tapElement({ serial, x: wikiEl.x, y: wikiEl.y + 50 });
      clicked = true;
      break;
    }
    
    console.log('Rolando para procurar Wikipedia...');
    execSync(`adb -s ${serial} shell input swipe 300 800 300 200`);
    await sleep(2000);
  }

  if (!clicked) {
    console.log('Não foi possível encontrar o artigo.');
    return;
  }

  await sleep(6000); // wait for page to load

  // 5. Extract first level text
  console.log('Extraindo texto do primeiro nível...');
  let fullText = '';
  let seenTexts = new Set();
  let stop = false;
  
  for (let i = 0; i < 15; i++) { // max 15 scrolls
    if (stop) break;
    
    const pageEls = await extract({ serial });
    
    pageEls.sort((a, b) => {
      if (Math.abs(a.y - b.y) < 20) return a.x - b.x;
      return a.y - b.y;
    });

    let frameText = '';
    for (const el of pageEls) {
      if (el.type === 'text') {
        const t = el.text.trim();
        
        // Stop conditions
        if (t === 'Índice' || t === 'Etimología' || t === 'Historia' || t === 'Ontología' || t === 'Contents' || t === 'History') {
          console.log(`Seção detectada: ${t}. Parando extração.`);
          stop = true;
          break;
        }
        
        if (el.y < 200) continue; 
        if (el.y > 880) continue; 
        
        if (!seenTexts.has(t)) {
          seenTexts.add(t);
          frameText += t + ' ';
        }
      }
    }
    
    if (frameText.trim().length > 0) {
      fullText += frameText.trim() + '\n';
    }
    
    if (!stop) {
      execSync(`adb -s ${serial} shell input swipe 300 800 300 200`);
      await sleep(2000);
    }
  }
  
  const outputPath = './outputs/metafisica_raw.txt';
  if (!fs.existsSync('./outputs')) {
    fs.mkdirSync('./outputs');
  }
  
  fs.writeFileSync(outputPath, fullText, 'utf-8');
  console.log(`Texto salvo em ${outputPath}`);
  
  fs.writeFileSync('./outputs/metafisica_elements.json', JSON.stringify(Array.from(seenTexts), null, 2), 'utf-8');
}

run().catch(console.error);
