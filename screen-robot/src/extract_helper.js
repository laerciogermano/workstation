import { extract } from './lib/extract.js';
import { launch, tap, scroll } from './lib/operate.js';
import deviceConfig from './device.config.json' with { type: "json" };

async function main() {
  const serial = deviceConfig.device;
  
  console.log("Abrindo Gmail...");
  await launch({ serial, package: deviceConfig.apps.gmail.package });
  
  // Esperar o app carregar
  await new Promise(r => setTimeout(r, 5000));
  
  console.log("Lendo tela...");
  const data = await extract({ serial });
  
  // Apenas extrai os textos para análise
  const texts = data.words.map(w => w.text).join(' ');
  console.log("Textos encontrados:");
  console.log(texts);
  
  // Detalhar todos os itens
  console.log("\nDetalhes dos elementos:");
  data.words.forEach(w => console.log(`"${w.text}" em x:${w.bounds.x}, y:${w.bounds.y}`));
}

main().catch(console.error);
