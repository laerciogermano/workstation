/**
 * Timeout de uma Promise (OCR por engine no merge).
 * ms<=0 = sem timeout. onTimeout: abortar spawn do engine.
 */
export function withTimeout(promise, ms, label, onTimeout) {
  const limit = Number(ms);
  if (!Number.isFinite(limit) || limit <= 0) return promise;
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      if (typeof onTimeout === "function") onTimeout();
      const err = new Error(`OCR_TIMEOUT: ${label} >${limit}ms`);
      err.code = "OCR_TIMEOUT";
      reject(err);
    }, limit);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}
