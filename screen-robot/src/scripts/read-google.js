#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { extract } from "../lib/extract.js";

async function main() {
  const cfg = JSON.parse(readFileSync(new URL("../device.config.json", import.meta.url), "utf8"));
  const serial = cfg?.device || cfg?.provision?.serial || "emulator-5554";
  mkdirSync("./outputs", { recursive: true });

  console.log("running extract on", serial);
  const elements = await extract({ serial });
  const lines = elements.map((e) => String(e.text || "").trim()).filter(Boolean);
  const raw = lines.join("\n");
  writeFileSync(join("./outputs", "metafisica_raw.txt"), raw, "utf8");
  writeFileSync(join("./outputs", "metafisica_elements.json"), JSON.stringify(elements, null, 2), "utf8");
  console.log("wrote outputs/metafisica_raw.txt and outputs/metafisica_elements.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

