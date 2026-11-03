const statusEl = document.getElementById('status');
const fileCaptureEl = document.getElementById('qr-capture');
const filePickEl = document.getElementById('qr-file');
const btnFotoEl = document.getElementById('btn-tirar-foto');
const btnGaleriaEl = document.getElementById('btn-escolher-imagem');

let busy = false;
let cameraRunning = false;

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = 'status' + (kind ? ` ${kind}` : '');
}

async function sendUrl(url) {
  console.log('[qr]', url);
  const res = await fetch('api/nota', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  console.log('[itens]', data.itens);
  return data;
}

async function onScanSuccess(decodedText) {
  if (busy) return;
  const url = String(decodedText || '').trim();
  if (!url) return;

  busy = true;
  setStatus('Extraindo itens…');

  try {
    const data = await sendUrl(url);
    const nome = data.empresa?.nome || 'Nota';
    const n = data.itens?.length ?? 0;
    const tag = data.created ? 'cadastrada' : 'já existia';
    setStatus(`${nome} · ${n} itens · ${tag}`, 'ok');
    setTimeout(() => {
      location.href = './';
    }, 900);
  } catch (err) {
    console.error(err);
    setStatus(err.message || 'Falha', 'err');
  } finally {
    setTimeout(() => {
      busy = false;
    }, 2000);
  }
}

const scanner = new Html5Qrcode('reader');

async function startCamera() {
  try {
    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess,
    );
    cameraRunning = true;
  } catch (err) {
    cameraRunning = false;
    console.error(err);
    setStatus('Câmera indisponível. Use HTTPS ou tire uma foto.', 'err');
  }
}

async function stopCamera() {
  if (!cameraRunning) return;
  try {
    await scanner.stop();
  } catch (err) {
    console.warn(err);
  }
  cameraRunning = false;
  try {
    await scanner.clear();
  } catch {
    /* ignore */
  }
}

async function decodeFromFile(file) {
  if (!file || busy) return;
  busy = true;
  setStatus('Lendo QR da imagem…');
  try {
    await stopCamera();
    const text = await scanner.scanFile(file, true);
    busy = false;
    await onScanSuccess(text);
  } catch (err) {
    console.error(err);
    setStatus('QR não encontrado na imagem. Tente outra foto.', 'err');
    busy = false;
    await startCamera();
  } finally {
    if (fileCaptureEl) fileCaptureEl.value = '';
    if (filePickEl) filePickEl.value = '';
  }
}

btnFotoEl?.addEventListener('click', () => fileCaptureEl?.click());
btnGaleriaEl?.addEventListener('click', () => filePickEl?.click());
fileCaptureEl?.addEventListener('change', () => {
  const file = fileCaptureEl.files?.[0];
  if (file) decodeFromFile(file);
});
filePickEl?.addEventListener('change', () => {
  const file = filePickEl.files?.[0];
  if (file) decodeFromFile(file);
});

startCamera();
