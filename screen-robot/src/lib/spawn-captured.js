/**
 * spawn assíncrono com stdout/stderr (OCR CLI).
 * timeoutMs>0 ou signal abort → SIGKILL no filho.
 */
import { spawn } from "node:child_process";

/**
 * @param {string} command
 * @param {string[]} args
 * @param {{ encoding?: string, env?: NodeJS.ProcessEnv, maxBuffer?: number, timeoutMs?: number, signal?: AbortSignal }} [opts]
 * @returns {Promise<{ status: number | null, stdout: string, stderr: string, signal: string | null }>}
 */
export function spawnCaptured(command, args, opts = {}) {
  const encoding = opts.encoding ?? "utf8";
  const maxBuffer = opts.maxBuffer ?? 32 * 1024 * 1024;
  const timeoutMs = Number(opts.timeoutMs);

  return new Promise((resolve, reject) => {
    let settled = false;
    const child = spawn(command, args, {
      env: opts.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      opts.signal?.removeEventListener("abort", onAbort);
      fn(value);
    };

    const killChild = () => {
      try {
        if (child.pid) child.kill("SIGKILL");
      } catch {
        /* já saiu */
      }
    };

    const failTimeout = (why) => {
      killChild();
      const err = new Error(`${why}: ${command}`);
      err.code = "OCR_TIMEOUT";
      finish(reject, err);
    };

    const onAbort = () => failTimeout("spawn aborted");

    let timer = null;
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding(encoding);
    child.stderr.setEncoding(encoding);
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      if (stdout.length > maxBuffer) {
        killChild();
        finish(reject, new Error(`stdout maxBuffer exceeded: ${command}`));
      }
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
      if (stderr.length > maxBuffer) {
        killChild();
        finish(reject, new Error(`stderr maxBuffer exceeded: ${command}`));
      }
    });
    child.on("error", (e) => finish(reject, e));
    child.on("close", (status, signal) => {
      finish(resolve, { status, stdout, stderr, signal });
    });

    if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
      timer = setTimeout(() => failTimeout(`spawn timeout >${timeoutMs}ms`), timeoutMs);
    }

    if (opts.signal) {
      if (opts.signal.aborted) onAbort();
      else opts.signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}
