import { spawn } from 'node:child_process';

const SKIP = process.env.SKIP_DOCKER === '1';

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let err = '';
    child.stderr.on('data', (d) => {
      err += d;
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} → ${code}: ${err}`));
    });
  });
}

/** docker start no host local (AVD). */
export async function dockerStart(containerName) {
  if (SKIP) {
    console.log(`[docker] SKIP start ${containerName}`);
    return;
  }
  await run('docker', ['start', containerName]);
}

/** docker stop — preserva /android-home. */
export async function dockerStop(containerName) {
  if (SKIP) {
    console.log(`[docker] SKIP stop ${containerName}`);
    return;
  }
  await run('docker', ['stop', containerName]);
}
