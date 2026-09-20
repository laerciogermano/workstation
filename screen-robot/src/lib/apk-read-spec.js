/**
 * SC-08 — ler package/versão da spec do app (config).
 */
export function readAppSpec(app) {
  const pkg = app?.package;
  if (!pkg || typeof pkg !== "string") {
    const err = new Error("APK_CONFIG_INVALID: falta package");
    err.code = "APK_CONFIG_INVALID";
    throw err;
  }
  return {
    package: pkg,
    version: app.version || undefined,
    source: app.source || undefined,
    artifact: app.artifact || undefined,
  };
}
