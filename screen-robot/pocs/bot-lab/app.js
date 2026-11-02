/**
 * bot-lab — checks de ambiente (estilo Intoli / bot.sannysoft.com)
 * + heurísticas de comportamento (mouse / teclado / isTrusted).
 */

const state = {
  pointerSamples: [],
  clicks: [],
  keys: [],
  lastClickTrusted: null,
  hadMouseMoveBeforeClick: false,
  movedSinceLoad: false,
  /** distância só de pointermove isTrusted durante drag */
  dragDistanceTrusted: 0,
  /** distância de eventos sintéticos (JS dispatch) durante drag */
  dragDistanceSynthetic: 0,
  lastDragTrusted: null,
  /** ações (click/key/drag) com document.hasFocus() + visible */
  actionsFocused: 0,
  /** ações com janela/aba sem foco ou hidden */
  actionsUnfocused: 0,
  lastActionFocus: null,
  /**
   * Janela perdeu foco (app atrás). CDP Input re-foca o document na hora do
   * clique — se agir enquanto tainted, trava até reset (veredito robô).
   */
  backgroundTainted: false,
  backgroundLocked: false,
  _focusedSince: null,
  scrollEvents: 0,
  hoverWithoutMove: 0,
  formInteractions: 0,
};

const BEHAVIOR = [
  { id: "pointer-path", label: "Trajetória do ponteiro (não-teleporte)" },
  { id: "pre-click-move", label: "Movimento antes do clique" },
  { id: "click-trusted", label: "Click isTrusted" },
  { id: "click-timing", label: "Ritmo de cliques humano" },
  { id: "key-timing", label: "Ritmo de digitação" },
  { id: "drag", label: "Drag com trajetória" },
  { id: "page-focus", label: "Tela/aba com foco" },
];

function focusSnapshot() {
  const hasFocus = document.hasFocus();
  const visibilityState = document.visibilityState;
  const hidden = document.hidden;
  const liveFocused = hasFocus && visibilityState === "visible" && !hidden;
  // CDP foca o document no Input.* — se houve blur recente, continua "sem foco"
  const focused = liveFocused && !state.backgroundTainted;
  return {
    hasFocus,
    visibilityState,
    hidden,
    liveFocused,
    backgroundTainted: state.backgroundTainted,
    focused,
  };
}

function markBackgroundBlur() {
  state.backgroundTainted = true;
  state._focusedSince = null;
}

function syncBackgroundFromLive() {
  const live =
    document.hasFocus() &&
    document.visibilityState === "visible" &&
    !document.hidden;
  if (!live) {
    markBackgroundBlur();
    return;
  }
  if (state.backgroundLocked) return;
  if (!state.backgroundTainted) return;
  // foco estável sem pointer/tecla — usuário voltou à aba (não limpar no meio de trajetória CDP)
  if (
    state._focusedSince &&
    performance.now() - state._focusedSince >= 450 &&
    !state.movedSinceLoad &&
    state.clicks.length === 0 &&
    state.keys.length === 0
  ) {
    state.backgroundTainted = false;
  }
}

function noteActionFocus() {
  syncBackgroundFromLive();
  const snap = focusSnapshot();
  state.lastActionFocus = snap;
  if (!snap.focused) {
    state.actionsUnfocused++;
    state.backgroundTainted = true;
    state.backgroundLocked = true; // ação sem foco → robô até reset
    state._focusedSince = null;
  } else {
    state.actionsFocused++;
  }
  return snap;
}

function el(id) {
  return document.getElementById(id);
}

function setRowClass(td, status) {
  td.classList.remove("pass", "fail", "warn-cell");
  if (status === "pass") td.classList.add("pass");
  else if (status === "fail") td.classList.add("fail");
  else if (status === "warn") td.classList.add("warn-cell");
}

function getWebGLInfo() {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return { vendor: null, renderer: null };
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    if (!dbg) return { vendor: "no-debug-ext", renderer: "no-debug-ext" };
    return {
      vendor: gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL),
      renderer: gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL),
    };
  } catch {
    return { vendor: "error", renderer: "error" };
  }
}

function drawCanvasFingerprint() {
  const c = el("c1");
  if (!c) return null;
  const ctx = c.getContext("2d");
  ctx.textBaseline = "top";
  ctx.font = "14px Arial";
  ctx.fillStyle = "#f60";
  ctx.fillRect(0, 0, 120, 30);
  ctx.fillStyle = "#069";
  ctx.fillText("bot-lab canvas", 2, 8);
  ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
  ctx.fillText("bot-lab canvas", 4, 10);
  return c.toDataURL().slice(0, 64) + "…";
}

async function permissionsAnomaly() {
  // Intoli/sannysoft: Notification.permission vs permissions.query inconsistente em headless
  try {
    if (!navigator.permissions?.query) return { status: "warn", detail: "permissions API ausente" };
    const res = await navigator.permissions.query({ name: "notifications" });
    const n = typeof Notification !== "undefined" ? Notification.permission : "n/a";
    if (n === "denied" && res.state === "prompt") {
      return { status: "fail", detail: `Notification=${n} query=${res.state}` };
    }
    return { status: "pass", detail: `Notification=${n} query=${res.state}` };
  } catch (e) {
    return { status: "warn", detail: String(e.message || e) };
  }
}

function webdriverAdvanced() {
  // rastros clássicos de automação / CDP helpers
  const markers = [];
  const docKeys = Object.getOwnPropertyNames(document);
  const winKeys = Object.getOwnPropertyNames(window);
  const look = (keys, re, where) => {
    for (const k of keys) {
      if (re.test(k)) markers.push(`${where}.${k}`);
    }
  };
  look(docKeys, /^\$cdc_|^\$chrome_asyncScriptInfo$|^__webdriver|^__selenium|^__driver/, "document");
  look(winKeys, /^cdc_|^__webdriver|^__selenium|^__driver|^domAutomation/, "window");
  if (document.documentElement?.getAttribute("webdriver") != null) {
    markers.push("html[webdriver]");
  }
  if ("__nightmare" in window) markers.push("window.__nightmare");
  if ("callPhantom" in window || "_phantom" in window) markers.push("phantom");
  return markers;
}

async function runEnvChecks() {
  const ua = navigator.userAgent || "";
  const webgl = getWebGLInfo();
  const plugins = navigator.plugins;
  const pluginLen = plugins ? plugins.length : 0;
  const isPluginArray =
    typeof PluginArray !== "undefined" && plugins instanceof PluginArray;
  const langs = navigator.languages;
  // sannysoft/Intoli: presença de window.chrome (páginas normais no Chrome)
  const chromeOk = typeof window.chrome === "object" && window.chrome !== null;
  const wd = navigator.webdriver;
  const adv = webdriverAdvanced();
  const perm = await permissionsAnomaly();
  const broken = el("broken-img");
  const brokenDims =
    broken && broken.complete
      ? `${broken.naturalWidth}x${broken.naturalHeight}`
      : "pending";

  const checks = [
    {
      name: "User Agent (Old)",
      status: /HeadlessChrome/i.test(ua) ? "fail" : "pass",
      detail: ua.slice(0, 120) + (ua.length > 120 ? "…" : ""),
    },
    {
      name: "WebDriver (New)",
      status: wd ? "fail" : "pass",
      detail: wd ? "present (failed)" : "missing (passed)",
    },
    {
      name: "WebDriver Advanced",
      status: adv.length ? "fail" : "pass",
      detail: adv.length ? adv.join(", ") : "passed",
    },
    {
      name: "Chrome (New)",
      status: chromeOk ? "pass" : "fail",
      detail: chromeOk ? "present (passed)" : "missing (failed)",
    },
    {
      name: "Permissions (New)",
      status: perm.status,
      detail: perm.detail,
    },
    {
      name: "Plugins Length (Old)",
      status: pluginLen > 0 ? "pass" : "fail",
      detail: String(pluginLen),
    },
    {
      name: "Plugins is of type PluginArray",
      status: isPluginArray ? "pass" : "fail",
      detail: String(isPluginArray),
    },
    {
      name: "Languages (Old)",
      status: langs && langs.length > 0 ? "pass" : "fail",
      detail: JSON.stringify(langs || null),
    },
    {
      name: "WebGL Vendor",
      status: webgl.vendor && webgl.vendor !== "error" ? "pass" : "warn",
      detail: String(webgl.vendor),
    },
    {
      name: "WebGL Renderer",
      status: webgl.renderer && !/swiftshader|llvmpipe|softpipe/i.test(webgl.renderer)
        ? "pass"
        : /swiftshader|llvmpipe|softpipe/i.test(String(webgl.renderer))
          ? "fail"
          : "warn",
      detail: String(webgl.renderer),
    },
    {
      name: "Broken Image Dimensions",
      status:
        brokenDims === "0x0" || brokenDims === "pending"
          ? brokenDims === "0x0"
            ? "pass"
            : "warn"
          : "fail",
      detail: brokenDims === "0x0" ? "0x0 (passed)" : brokenDims,
    },
  ];

  const tbody = el("env-table").querySelector("tbody");
  tbody.innerHTML = "";
  for (const c of checks) {
    const tr = document.createElement("tr");
    const tdN = document.createElement("td");
    const tdR = document.createElement("td");
    tdN.textContent = c.name;
    tdR.textContent = c.detail;
    setRowClass(tdR, c.status);
    tr.append(tdN, tdR);
    tbody.append(tr);
  }

  el("env-details").textContent = JSON.stringify(
    {
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      userAgent: navigator.userAgent,
      appName: navigator.appName,
      vendor: navigator.vendor,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
      },
      outer: { w: window.outerWidth, h: window.outerHeight },
      inner: { w: window.innerWidth, h: window.innerHeight },
      canvasSample: drawCanvasFingerprint(),
      webgl,
      chromeKeys: window.chrome ? Object.keys(window.chrome) : null,
    },
    null,
    2,
  );

  return checks;
}

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function pathLooksHuman(samples) {
  if (samples.length < 8) return { status: "warn", detail: `poucos pontos (${samples.length})` };
  let teleports = 0;
  let total = 0;
  for (let i = 1; i < samples.length; i++) {
    const d = dist(samples[i - 1], samples[i]);
    const dt = Math.max(1, samples[i].t - samples[i - 1].t);
    total += d;
    // salto grande em < 8ms = teleporte típico de CDP jump
    if (d > 80 && dt < 8) teleports++;
    if (d > 400 && dt < 30) teleports++;
  }
  if (total < 40) return { status: "fail", detail: `caminho curto (${total.toFixed(0)}px)` };
  if (teleports >= 3) return { status: "fail", detail: `${teleports} teleportes` };
  return { status: "pass", detail: `${samples.length} pts · ${total.toFixed(0)}px` };
}

function timingHuman(events, { min = 3, softMin = 40, softMax = 2500 } = {}) {
  if (events.length < min) return { status: "warn", detail: `n=${events.length}` };
  const gaps = [];
  for (let i = 1; i < events.length; i++) gaps.push(events[i].t - events[i - 1].t);
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const tooFast = gaps.filter((g) => g < softMin).length;
  const allSame =
    gaps.length >= 3 && gaps.every((g) => Math.abs(g - gaps[0]) < 4);
  if (tooFast >= Math.ceil(gaps.length * 0.6)) {
    return { status: "fail", detail: `rápido demais avg=${avg.toFixed(0)}ms` };
  }
  if (allSame) return { status: "fail", detail: `intervalos constantes ~${gaps[0]}ms` };
  if (avg > softMax) return { status: "warn", detail: `avg=${avg.toFixed(0)}ms` };
  return { status: "pass", detail: `avg=${avg.toFixed(0)}ms` };
}

function evaluateBehavior() {
  const results = [];

  const path = pathLooksHuman(state.pointerSamples);
  results.push({ id: "pointer-path", ...path });

  results.push({
    id: "pre-click-move",
    status:
      state.clicks.length === 0
        ? "warn"
        : state.hadMouseMoveBeforeClick
          ? "pass"
          : "fail",
    detail:
      state.clicks.length === 0
        ? "sem cliques"
        : state.hadMouseMoveBeforeClick
          ? "houve mousemove"
          : "clique sem mousemove prévio",
  });

  results.push({
    id: "click-trusted",
    status:
      state.lastClickTrusted == null
        ? "warn"
        : state.lastClickTrusted
          ? "pass"
          : "fail",
    detail:
      state.lastClickTrusted == null
        ? "—"
        : state.lastClickTrusted
          ? "true"
          : "false (sintético)",
  });

  results.push({
    id: "click-timing",
    ...timingHuman(state.clicks, { min: 3, softMin: 50 }),
  });

  results.push({
    id: "key-timing",
    ...timingHuman(state.keys, { min: 4, softMin: 30 }),
  });

  // drag: só passa com movimento trusted; sintético (JS) = fail
  const dragTrusted = state.dragDistanceTrusted;
  const dragSynth = state.dragDistanceSynthetic;
  let dragStatus = "warn";
  let dragDetail = "não arrastou";
  if (dragSynth > 30 && dragTrusted <= 30) {
    dragStatus = "fail";
    dragDetail = `sintético ${dragSynth.toFixed(0)}px (isTrusted=false)`;
  } else if (dragTrusted > 30) {
    dragStatus = "pass";
    dragDetail = `trusted ${dragTrusted.toFixed(0)}px`;
    if (dragSynth > 0) dragDetail += ` (+synth ${dragSynth.toFixed(0)}px)`;
  } else if (dragTrusted > 0 || dragSynth > 0) {
    dragStatus = "fail";
    dragDetail = `curto trusted=${dragTrusted.toFixed(0)} synth=${dragSynth.toFixed(0)}`;
  }
  results.push({ id: "drag", status: dragStatus, detail: dragDetail });

  // foco da tela/aba no momento das ações (CDP em background → fail → robô)
  const af = state.actionsFocused;
  const au = state.actionsUnfocused;
  const totalFocusActions = af + au;
  let focusStatus = "warn";
  let focusDetail = "sem ações";
  if (totalFocusActions > 0) {
    const last = state.lastActionFocus;
    const lastTxt = last
      ? `hasFocus=${last.hasFocus} vis=${last.visibilityState} tainted=${!!last.backgroundTainted}`
      : "";
    if (au > 0 && af === 0) {
      focusStatus = "fail";
      focusDetail = `todas sem foco (${au}) · ${lastTxt}`;
    } else if (au > 0) {
      focusStatus = "fail";
      focusDetail = `mistas foco=${af} sem=${au} · ${lastTxt}`;
    } else {
      focusStatus = "pass";
      focusDetail = `com foco (${af}) · ${lastTxt}`;
    }
  } else {
    const live = focusSnapshot();
    focusDetail = `agora hasFocus=${live.hasFocus} vis=${live.visibilityState} tainted=${live.backgroundTainted}`;
  }
  results.push({ id: "page-focus", status: focusStatus, detail: focusDetail });

  return results;
}

function renderBehavior(results) {
  const ul = el("behavior-list");
  ul.innerHTML = "";
  for (const def of BEHAVIOR) {
    const r = results.find((x) => x.id === def.id) || {
      status: "warn",
      detail: "—",
    };
    const li = document.createElement("li");
    const name = document.createElement("span");
    name.textContent = def.label;
    const st = document.createElement("span");
    st.className = "status";
    st.textContent = `${r.status} · ${r.detail}`;
    if (r.status === "pass") st.classList.add("pass");
    if (r.status === "fail") st.classList.add("fail");
    if (r.status === "warn") st.classList.add("warn-cell");
    li.append(name, st);
    ul.append(li);
  }

  el("m-points").textContent = String(state.pointerSamples.length);
  el("m-clicks").textContent = String(state.clicks.length);
  el("m-keys").textContent = String(state.keys.length);
  el("m-trusted").textContent =
    state.lastClickTrusted == null ? "—" : String(state.lastClickTrusted);
  const focusEl = el("m-focus");
  if (focusEl) {
    const live = focusSnapshot();
    focusEl.textContent = live.focused ? "sim" : "não";
  }
}

function scoreOf(items) {
  let pass = 0;
  let fail = 0;
  let warn = 0;
  for (const i of items) {
    if (i.status === "pass") pass++;
    else if (i.status === "fail") fail++;
    else warn++;
  }
  return { pass, fail, warn };
}

function renderVerdict(envChecks, behavior) {
  const e = scoreOf(envChecks);
  const b = scoreOf(behavior);
  const verdict = el("score-verdict");
  const meta = el("score-meta");

  // humano: evidência positiva mínima (pass≥3) e zero fails de comportamento
  // robô: qualquer ação sem foco da tela/aba; ≥2 fails; ou 1 fail com pouca evidência
  // inconclusivo: resto (muitos warns / pouca interação)
  const focusFail = behavior.some(
    (x) => x.id === "page-focus" && x.status === "fail",
  );
  let label = "inconclusivo";
  let cls = "warn";
  if (
    focusFail ||
    state.actionsUnfocused > 0 ||
    e.fail >= 2 ||
    b.fail >= 2 ||
    (b.fail >= 1 && b.pass < 3)
  ) {
    label = "robô / suspeito";
    cls = "fail";
  } else if (b.fail === 0 && b.pass >= 3) {
    label = "humano";
    cls = "ok";
  }

  verdict.textContent = label;
  verdict.className = `score-verdict ${cls}`;
  meta.textContent = `ambiente ${e.pass}✓ ${e.fail}✗ ${e.warn}? · comportamento ${b.pass}✓ ${b.fail}✗ ${b.warn}?`;
}

function refresh() {
  const behavior = evaluateBehavior();
  renderBehavior(behavior);
  if (window.__envChecks) renderVerdict(window.__envChecks, behavior);
}

function logUi(msg) {
  el("ui-log").textContent = msg;
}

function moveFigMouse(x, y, { press = false } = {}) {
  const m = el("fig-mouse");
  if (!m) return;
  m.classList.add("is-on");
  m.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  m.classList.toggle("is-press", !!press);
}

function pulseFigMouseClick() {
  const m = el("fig-mouse");
  if (!m) return;
  m.classList.remove("is-click");
  void m.offsetWidth;
  m.classList.add("is-click");
}

function wireBehavior() {
  let lastSampleT = 0;
  let figPressed = false;

  const figOnMove = (e) => {
    if (!e.isTrusted) {
      refresh();
      return;
    }
    // cursor virtual (CDP Input mouseMoved / mouse real)
    moveFigMouse(e.clientX, e.clientY, { press: figPressed });
    state.movedSinceLoad = true;
    const now = performance.now();
    if (now - lastSampleT < 16) return;
    lastSampleT = now;
    state.pointerSamples.push({ x: e.clientX, y: e.clientY, t: now });
    if (state.pointerSamples.length > 400) state.pointerSamples.shift();
    refresh();
  };

  // pointer + mouse: CDP costuma emitir mouse*; pointer cobre o resto
  window.addEventListener("pointermove", figOnMove, { passive: true });
  window.addEventListener("mousemove", figOnMove, { passive: true });

  const figOnDown = (e) => {
    if (!e.isTrusted) return;
    figPressed = true;
    moveFigMouse(e.clientX, e.clientY, { press: true });
  };
  const figOnUp = (e) => {
    if (!e.isTrusted) return;
    figPressed = false;
    moveFigMouse(e.clientX, e.clientY, { press: false });
    pulseFigMouseClick();
  };
  window.addEventListener("pointerdown", figOnDown, true);
  window.addEventListener("mousedown", figOnDown, true);
  window.addEventListener("pointerup", figOnUp, true);
  window.addEventListener("mouseup", figOnUp, true);

  window.addEventListener(
    "click",
    (e) => {
      noteActionFocus();
      state.lastClickTrusted = e.isTrusted;
      if (state.movedSinceLoad) state.hadMouseMoveBeforeClick = true;
      state.clicks.push({ t: performance.now(), trusted: e.isTrusted });
      if (state.clicks.length > 40) state.clicks.shift();
      refresh();
    },
    true,
  );

  window.addEventListener(
    "keydown",
    (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      noteActionFocus();
      state.keys.push({ t: performance.now(), key: e.key });
      if (state.keys.length > 80) state.keys.shift();
      refresh();
    },
    true,
  );

  window.addEventListener("blur", () => {
    markBackgroundBlur();
    refresh();
  });
  window.addEventListener("focus", () => {
    state._focusedSince = performance.now();
    refresh();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) markBackgroundBlur();
    refresh();
  });
  // !hasFocus não dispara blur se a página nunca teve foco (app já atrás)
  setInterval(() => {
    const before = state.backgroundTainted;
    syncBackgroundFromLive();
    if (before !== state.backgroundTainted) refresh();
  }, 150);

  window.addEventListener(
    "scroll",
    () => {
      state.scrollEvents++;
    },
    { passive: true },
  );

  el("btn-primary").addEventListener("click", () => logUi("click: botão primário"));
  el("btn-secondary").addEventListener("click", () => logUi("click: secundário"));
  el("link-demo").addEventListener("click", (e) => {
    e.preventDefault();
    logUi("click: link interno");
  });
  el("demo-form").addEventListener("submit", (e) => {
    e.preventDefault();
    state.formInteractions++;
    const fd = new FormData(e.target);
    logUi(`submit: nome=${fd.get("nome") || "∅"} opcao=${fd.get("opcao") || "∅"}`);
  });
  el("input-nome").addEventListener("input", () => {
    state.formInteractions++;
  });
  el("select-opcao").addEventListener("change", () => {
    state.formInteractions++;
    logUi(`select: ${el("select-opcao").value}`);
  });

  // drag handle
  const handle = el("drag-handle");
  const zone = el("drag-zone");
  let dragging = false;
  let startX = 0;
  let originLeft = 0;
  let lastX = 0;

  const onDown = (e) => {
    dragging = true;
    startX = e.clientX;
    originLeft = handle.offsetLeft;
    lastX = e.clientX;
    state.lastDragTrusted = e.isTrusted;
    noteActionFocus();
    handle.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    if (!dragging) return;
    const max = zone.clientWidth - handle.offsetWidth - 12;
    let next = originLeft + (e.clientX - startX);
    next = Math.max(6, Math.min(max, next));
    handle.style.left = `${next}px`;
    const delta = Math.abs(e.clientX - lastX);
    if (e.isTrusted) state.dragDistanceTrusted += delta;
    else state.dragDistanceSynthetic += delta;
    lastX = e.clientX;
    const pct = Math.round(((next - 6) / Math.max(1, max - 6)) * 100);
    handle.setAttribute("aria-valuenow", String(pct));
    refresh();
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    const t = state.dragDistanceTrusted;
    const s = state.dragDistanceSynthetic;
    logUi(`drag: trusted=${t.toFixed(0)}px synth=${s.toFixed(0)}px`);
    refresh();
  };
  handle.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);

  el("btn-reset").addEventListener("click", () => {
    state.pointerSamples = [];
    state.clicks = [];
    state.keys = [];
    state.lastClickTrusted = null;
    state.hadMouseMoveBeforeClick = false;
    state.movedSinceLoad = false;
    state.dragDistanceTrusted = 0;
    state.dragDistanceSynthetic = 0;
    state.lastDragTrusted = null;
    state.actionsFocused = 0;
    state.actionsUnfocused = 0;
    state.lastActionFocus = null;
    state.backgroundTainted = false;
    state.backgroundLocked = false;
    state._focusedSince = document.hasFocus() ? performance.now() : null;
    if (!document.hasFocus() || document.hidden) markBackgroundBlur();
    handle.style.left = "6px";
    logUi("comportamento zerado");
    refresh();
  });
}

async function main() {
  wireBehavior();
  const broken = el("broken-img");
  const rerunBroken = () => {
    // reavalia broken image após load
    runEnvChecks().then((checks) => {
      window.__envChecks = checks;
      refresh();
    });
  };
  if (broken) {
    if (broken.complete) rerunBroken();
    else broken.addEventListener("error", rerunBroken);
    broken.addEventListener("load", rerunBroken);
  }
  window.__envChecks = await runEnvChecks();
  refresh();
}

main();
