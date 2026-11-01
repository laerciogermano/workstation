const statusEl = document.getElementById('status');
let busy = false;

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
    setStatus(`${nome} — ${n} itens (${tag}). Voltando…`, 'ok');
    setTimeout(() => {
      location.href = './';
    }, 1200);
  } catch (err) {
    console.error(err);
    setStatus(`Falha: ${err.message}`, 'err');
  } finally {
    setTimeout(() => {
      busy = false;
    }, 2000);
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
