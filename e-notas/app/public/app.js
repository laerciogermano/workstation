const statusEl = document.getElementById('status');
let busy = false;

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = 'status' + (kind ? ` ${kind}` : '');
}

async function sendUrl(url) {
  console.log('[qr]', url);
  const res = await fetch('/api/nota', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }
}

async function onScanSuccess(decodedText) {
  if (busy) return;
  const url = String(decodedText || '').trim();
  if (!url) return;

  busy = true;
  setStatus(`Enviado: ${url}`, 'ok');

  try {
    await sendUrl(url);
  } catch (err) {
    console.error(err);
    setStatus(`Falha ao enviar: ${err.message}`, 'err');
  } finally {
    setTimeout(() => {
      busy = false;
    }, 1500);
  }
}

const scanner = new Html5Qrcode('reader');

scanner
  .start(
    { facingMode: 'environment' },
    { fps: 10, qrbox: { width: 250, height: 250 } },
    onScanSuccess,
  )
  .catch((err) => {
    console.error(err);
    setStatus(
      'Não foi possível abrir a câmera. Use HTTPS ou permita o acesso.',
      'err',
    );
  });
