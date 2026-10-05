import { launch, tap, tapElement, scroll, screenshot, key } from "./lib/operate.js";
import { extract, findByText } from "./lib/extract.js";
import { adb, sleep } from "./lib/adb.js";
import { provisionEmulator } from "./lib/provision.js";
import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

async function main() {
  const config = JSON.parse(readFileSync(resolve("device.config.json"), "utf8"));
  
  console.log("--- Provisionando Emulador ---");
  const { serial } = await provisionEmulator(config);
  console.log(`Dispositivo pronto: ${serial}`);

  console.log("--- Iniciando busca por 'metafisica' ---");

  // 1. Abrir Google no Chrome
  console.log("Abrindo Google...");
  adb(serial, ["shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "https://www.google.com"]);
  await sleep(10000); // Mais tempo para carregar

  // 2. Pesquisar "metafisica"
  console.log("Pesquisando 'metafisica' via URL direta (mais estável)...");
  adb(serial, ["shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", "https://www.google.com/search?q=metafisica"]);
  await sleep(10000);

  // 3. Abrir o primeiro artigo
  console.log("Procurando o primeiro artigo...");
  let searchResults = await extract({ serial });
  
  // Procuramos por "Metafísica" nos resultados
  let article = searchResults.find(e => /metaf[ií]sica/i.test(e.text) && e.y > 200);
  if (!article) article = searchResults.find(e => /wikipedia/i.test(e.text) && e.y > 200);

  if (article) {
    console.log(`Abrindo: ${article.text} em ${article.x}, ${article.y}`);
    tapElement({ serial, x: article.x, y: article.y });
  } else {
    console.log("Tentando primeiro link detectado...");
    const firstLink = searchResults.filter(e => e.y > 300).sort((a,b) => a.y - b.y)[0];
    if (firstLink) tapElement({ serial, x: firstLink.x, y: firstLink.y });
  }
  await sleep(10000);

  // 4. Escrolar até o fim
  console.log("Escrolando até o fim da página...");
  for (let i = 0; i < 5; i++) {
    scroll({ serial, direction: "down", distance: 1000 });
    await sleep(1000);
  }

  // 5. Extrair o texto do primeiro nível
  console.log("Extraindo texto final...");
  const finalElements = await extract({ serial });
  const rawText = finalElements.map(e => e.text).join("\n");
  
  const outputPath = resolve("outputs/metafisica_raw.txt");
  const elementsPath = resolve("outputs/metafisica_elements.json");
  
  writeFileSync(outputPath, rawText);
  writeFileSync(elementsPath, JSON.stringify(finalElements, null, 2));

  console.log(`\nTarefa concluída.`);
  console.log(`Texto bruto salvo em: ${outputPath}`);
  console.log(`Elementos JSON salvos em: ${elementsPath}`);
}

main().catch(console.error);
