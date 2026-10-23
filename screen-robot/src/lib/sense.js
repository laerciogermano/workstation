/**
 * Fonte de texto na tela: `ocr` ou `dump` — isolados, sem fallback cruzado.
 *
 * Escolha: `opts.sense` | `SCREEN_ROBOT_SENSE` | default `dump`
 * CLI: `--sense ocr` | `--sense dump`
 */

/**
 * @param {{ sense?: string }} [opts]
 * @returns {"ocr"|"dump"}
 */
export function resolveSense(opts = {}) {
  const raw = String(opts.sense ?? process.env.SCREEN_ROBOT_SENSE ?? "dump")
    .trim()
    .toLowerCase();
  if (raw === "ocr") return "ocr";
  if (raw === "dump" || raw === "uidump") return "dump";
  throw new Error(
    `sense inválido: "${raw}" (use ocr|dump; env SCREEN_ROBOT_SENSE)`,
  );
}

/**
 * Lê `--sense ocr|dump` do argv e grava em SCREEN_ROBOT_SENSE.
 * @param {string[]} argv
 * @returns {{ sense: "ocr"|"dump", argv: string[] }} argv sem o par --sense
 */
export function takeSenseArg(argv) {
  const out = [];
  /** @type {"ocr"|"dump"|null} */
  let sense = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--sense") {
      sense = resolveSense({ sense: argv[++i] });
      continue;
    }
    const m = String(argv[i]).match(/^--sense=(.+)$/);
    if (m) {
      sense = resolveSense({ sense: m[1] });
      continue;
    }
    out.push(argv[i]);
  }
  if (sense) process.env.SCREEN_ROBOT_SENSE = sense;
  return { sense: resolveSense({ sense: sense || undefined }), argv: out };
}
