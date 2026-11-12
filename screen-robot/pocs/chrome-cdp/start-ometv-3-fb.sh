#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/human-cdp"
node --input-type=module <<'EOF'
import { startCdp, statusCdp } from './src/index.mjs';
const st = await startCdp('ometv-3', { url: 'https://www.facebook.com/' });
console.log(JSON.stringify({
  id: 'ometv-3',
  status: st.status,
  port: st.port,
  cdpUrl: st.cdpUrl,
  url: 'https://www.facebook.com/',
}, null, 2));
EOF
echo
echo "CDP ometv-3 em http://127.0.0.1:9234 — deixe este terminal aberto."
