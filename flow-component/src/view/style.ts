/** CSS da vista Flow (tokens e classes do Flow IDE), escopado em `.fcv`. */
export const FLOW_CSS = `
.fcv{--accent:var(--fc-accent,#d4432a);--ink:var(--fc-ink,#1e2025);--body:var(--fc-body,#4b505a);--muted:var(--fc-muted,#7b818c);--line:var(--fc-line,#e7e4de);--line-2:var(--fc-line-2,#d9d5cd);--paper:var(--fc-paper,#fff);--panel:var(--fc-panel,#f8f6f2);--wash:var(--fc-wash,#f1eee8);
--ok:var(--fc-ok,#1f7a4d);--run:var(--fc-run,#2a62a8);--warn:var(--fc-warn,#a76400);--fail:var(--fc-fail,#c2352b);--t-pessoa:var(--fc-pessoa,#2f6aa3);--t-ia:var(--fc-ia,#9b4fa0);--fn:var(--fc-fn,#2563eb);--loop:var(--fc-loop,#7c3aed);--dado:var(--fc-dado,#dc2626);
--shadow:0 1px 0 rgba(30,32,37,.04),0 1px 3px rgba(30,32,37,.08);--font:"IBM Plex Sans","Helvetica Neue",Arial,sans-serif;--mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
position:relative;display:flex;flex-direction:column;height:100%;min-height:420px;background:var(--paper);color:var(--ink);font:13px/1.4 var(--font);border:1px solid var(--line);border-radius:8px;overflow:hidden}
.fcv *{box-sizing:border-box}
.fcv button,.fcv select,.fcv input{font:inherit}
.fcv .ib{width:28px;height:28px;border:0;background:none;border-radius:6px;display:inline-grid;place-items:center;color:var(--muted);padding:0;cursor:pointer}
.fcv .ib:hover{background:var(--wash);color:var(--ink)} .fcv .ib.on{background:var(--wash);color:var(--accent)} .fcv .ib svg{width:14px;height:14px}
.fcv .ztoolbar{display:flex;align-items:center;gap:10px;padding:6px 12px;border-bottom:1px solid var(--line);background:var(--paper);flex:none}
.fcv .ztoolbar .ttl{font-size:12px;font-weight:600;color:var(--muted);display:inline-flex;gap:6px;align-items:center}
.fcv .ztoolbar select.root{border:1px solid var(--line-2);border-radius:6px;height:26px;padding:0 6px;background:var(--paper);color:var(--ink);font-size:12px}
.fcv .btn{border:1px solid var(--line-2);background:var(--paper);border-radius:6px;height:26px;padding:0 9px;display:inline-flex;gap:5px;align-items:center;cursor:pointer;font-size:12px;color:var(--body)}
.fcv .btn:hover{border-color:var(--accent);color:var(--accent)} .fcv .btn svg{width:13px;height:13px}
.fcv .dz{margin-left:auto;display:flex;align-items:center;gap:2px} .fcv .pct{font:11px var(--mono);color:var(--muted);min-width:38px;text-align:center}
.fcv .zcanvas{flex:1;min-height:0;position:relative;overflow:hidden;background:var(--paper);cursor:grab;touch-action:none}
.fcv .zcanvas.panning{cursor:grabbing}
.fcv .zworld{position:absolute;left:0;top:0;transform-origin:0 0}
.fcv .gtable{display:grid}
.fcv .gleft{border-right:1px solid var(--line)} .fcv .gright{position:relative}
.fcv .ghead{height:52px;display:grid;align-items:end;padding:0 12px 8px 14px;border-bottom:1px solid var(--line)}
.fcv .fl-cols{display:grid;grid-template-columns:148px minmax(0,1fr);gap:6px;align-items:center}
.fcv .ghead .fl-cols span{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.fcv .grow{height:34px;padding:0 12px 0 14px;border-bottom:1px solid var(--line);position:relative;cursor:pointer}
.fcv .grow.sel{background:color-mix(in srgb,var(--ink) 7%,var(--paper))}
.fcv .grow.ifrow{cursor:default;background:color-mix(in srgb,var(--warn) 7%,transparent)} .fcv .grow.ifrow .nm b{color:var(--warn);font-weight:600;font-size:12px}
.fcv .grow.forrow{background:color-mix(in srgb,var(--loop) 7%,transparent)} .fcv .grow.forrow .nm b{color:var(--loop)}
.fcv .grow.tryrow{cursor:default;background:color-mix(in srgb,var(--ok) 7%,transparent)} .fcv .grow.tryrow .nm b{color:var(--ok);font-weight:600;font-size:12px}
.fcv .grow.catchrow{background:color-mix(in srgb,var(--fail) 7%,transparent)} .fcv .grow.catchrow .nm b{color:var(--fail)}
.fcv .trd{flex:none;font:700 9px var(--mono);color:var(--ok);border:1.2px solid var(--ok);border-radius:3px;padding:1px 4px;line-height:1.2} .fcv .trd.c{color:var(--fail);border-color:var(--fail)}
.fcv .nm{display:flex;align-items:center;gap:8px;font:12px var(--mono);min-width:0;height:100%}
.fcv .nm b{font-weight:400;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis} .fcv .grow.grp .nm b{font-weight:500}
.fcv .nm .car{width:14px;margin-right:-4px;display:grid;place-items:center;color:var(--muted);cursor:pointer;border-radius:4px}
.fcv .nm .car:hover{color:var(--accent);background:var(--panel)} .fcv .nm .car svg{width:14px;height:14px;transition:transform .15s}
.fcv .grow.grp:not(.open) .car svg{transform:rotate(-90deg)}
.fcv .nm .gi{color:var(--muted);display:grid;place-items:center} .fcv .nm .gi svg{width:14px;height:14px}
.fcv .c-ag{display:flex;align-items:center;gap:6px;min-width:0;height:100%} .fcv .c-ag.muted{color:var(--muted);font-size:11px;justify-content:center}
.fcv .fl-g{position:absolute;top:0;bottom:-1px;width:1px;background:var(--line-2);pointer-events:none}
.fcv .lpd{width:12px;flex:none;color:var(--loop);font-weight:700;text-align:center;margin-right:2px}
.fcv .ifd{width:8px;height:8px;flex:none;border:1.5px solid var(--warn);transform:rotate(45deg);margin:0 4px 0 1px}
.fcv .iorow .nm{gap:6px;font-size:11px} .fcv .io-k{color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.05em;min-width:62px}
.fcv .io-d{display:inline-flex;align-items:center;gap:4px;font:500 10.5px var(--mono);color:var(--body);cursor:pointer}
.fcv .io-sq{width:7px;height:7px;border:1.2px solid var(--dado);background:var(--paper);display:inline-block}
.fcv .io-cube{width:9px;height:10px;fill:var(--paper);stroke:var(--dado);stroke-width:1}
.fcv .fav{width:22px;height:22px;border-radius:50%;flex:none;display:grid;place-items:center;background:var(--paper);border:1.5px solid var(--t-ia);color:var(--t-ia)} .fcv .fav svg{width:12px;height:12px}
.fcv .fav.maquina{border-color:var(--ok);color:var(--ok)} .fcv .fav.pessoa{border-color:var(--t-pessoa);color:var(--t-pessoa)}
.fcv .fav.arquivo{border-color:#64748b;color:#64748b} .fcv .fav.none{background:none;border:1px dashed var(--line-2);color:var(--muted)}
.fcv .resp-pick{position:relative;display:inline-flex;align-items:center;gap:6px;min-width:0;cursor:pointer;max-width:100%}
.fcv .resp-pick select{position:absolute;inset:0;opacity:0;width:100%;cursor:pointer}
.fcv .resp-pick.vazio{position:relative;display:block;flex:none;width:100%;height:24px;overflow:hidden}
.fcv .resp-pick.vazio select{position:absolute;inset:0;opacity:1;width:100%;height:24px;padding:0 22px 0 8px;border:1px dashed var(--accent);border-radius:6px;color:var(--accent);font-size:11px;font-weight:500;appearance:none;-webkit-appearance:none;cursor:pointer;text-overflow:ellipsis;
background-color:color-mix(in srgb,var(--accent) 6%,var(--paper));background-image:linear-gradient(45deg,transparent 50%,var(--accent) 50%),linear-gradient(135deg,var(--accent) 50%,transparent 50%);background-position:right 11px top 10px,right 7px top 10px;background-size:4px 4px;background-repeat:no-repeat}
.fcv .resp-pick.vazio select:hover,.fcv .resp-pick.vazio select:focus{border-style:solid;outline:none}
.fcv .rp-n,.fcv .fav-n{font-size:11px;color:var(--body);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fcv .task-pick{appearance:none;border:1px solid var(--line-2);background:var(--paper);border-radius:5px;height:24px;padding:0 22px 0 7px;font:12px/1 var(--mono);color:var(--ink);max-width:100%;cursor:pointer}
.fcv .task-miss{color:var(--fail)}
.fcv .fl-ren{flex:1;min-width:0;height:24px;border:1px solid var(--accent);border-radius:5px;padding:0 6px;color:var(--ink);background:var(--paper);outline:none}
.fcv .fl-tools{position:absolute;right:10px;top:50%;transform:translateY(-50%);display:none;gap:2px;background:var(--paper);border:1px solid var(--line-2);border-radius:6px;padding:1px;box-shadow:var(--shadow);z-index:2}
.fcv .grow:hover .fl-tools{display:flex} .fcv .fl-tools .ib{width:24px;height:22px} .fcv .fl-tools .ib:hover{color:var(--accent)}
.fcv .fl-tools .ib.danger:hover,.fcv .bar-tools .ib.danger:hover{color:var(--fail);background:color-mix(in srgb,var(--fail) 12%,transparent)}
.fcv .fl-tools i.sep{width:1px;margin:3px 1px;background:var(--line)}
.fcv .bar-tools{position:absolute;z-index:6;display:flex;align-items:center;gap:1px;height:26px;padding:1px;background:var(--paper);border:1px solid var(--line-2);border-radius:7px;box-shadow:var(--shadow);white-space:nowrap}
.fcv .bar-tools .ib{width:24px;height:22px;color:var(--body)} .fcv .bar-tools .ib:hover{color:var(--accent);background:var(--panel)}
.fcv .bar-tools .ib.on{color:var(--accent)}
.fcv .edge-pop{position:absolute;z-index:7;display:flex;gap:2px;padding:2px;background:var(--paper);border:1px solid var(--line-2);border-radius:8px;box-shadow:var(--shadow)}
.fcv .edge-pop .ib{width:26px;height:24px;color:var(--body)} .fcv .edge-pop .ib:hover{color:var(--accent);background:var(--panel)}
.fcv svg.fview{display:block;overflow:visible}
.fcv .fview text{font-family:var(--mono);font-size:9px;fill:var(--body)}
.fcv .fview .sv-title{font:600 10px var(--mono);text-anchor:middle}
.fcv .fview .sv-lbl{font:500 9px var(--mono);fill:var(--ink)}
.fcv .fview .sv-hl,.fcv .fview .sv-row{stroke:var(--line)}
.fcv .fview .sv-div{stroke:color-mix(in srgb,var(--muted) 55%,transparent)}
.fcv .fview .sv-chip rect{fill:var(--wash);stroke:color-mix(in srgb,var(--muted) 70%,transparent);stroke-width:1.3}
.fcv .fview .sv-chip text{font:600 9px var(--mono);fill:var(--ink);text-anchor:middle}
.fcv .fview .sv-los{fill:var(--paper);stroke:var(--muted);stroke-width:1.3} .fcv .fview .sv-ax{stroke:var(--muted);stroke-width:1.3}
.fcv .fview .sv-selr{fill:color-mix(in srgb,var(--ink) 6%,transparent)}
.fcv .fview .sv-band{fill:color-mix(in srgb,var(--warn) 7%,transparent);stroke:none}
.fcv .fview .sv-band.lp{fill:color-mix(in srgb,var(--loop) 7%,transparent);stroke:none}
.fcv .fview .sv-band.tr{fill:color-mix(in srgb,var(--ok) 5%,transparent);stroke:none}
.fcv .fview .sv-bandl.tr{stroke:var(--ok)}
.fcv .fview .sv-band.ca{fill:color-mix(in srgb,var(--fail) 5%,transparent);stroke:none}
.fcv .fview .sv-bandl.ca{stroke:var(--fail)}
.fcv .fview .sv-pill.try rect{fill:color-mix(in srgb,var(--ok) 16%,var(--paper))} .fcv .fview .sv-pill.try text{fill:var(--ok)}
.fcv .fview .sv-pill.catch rect{fill:color-mix(in srgb,var(--fail) 16%,var(--paper))} .fcv .fview .sv-pill.catch text{fill:var(--fail)}
.fcv .fview .sv-bandl{stroke:var(--warn);stroke-width:2} .fcv .fview .sv-bandl.lp{stroke:var(--loop)}
.fcv .fview .sv-fn{fill:var(--fn)} .fcv .fview .sv-fn.abs{fill:color-mix(in srgb,var(--fn) 8%,var(--paper));stroke:var(--fn);stroke-width:1.5}
.fcv .fview .sv-fn.nag{fill:transparent;stroke:var(--fn);stroke-width:1.5} .fcv .fview .sv-fn.fail{stroke:var(--fail);stroke-width:2}
.fcv .fview .sv-fn.sel,.fcv .fview .sv-sum.sel{stroke:var(--ink);stroke-width:2} .fcv .fview .sv-sum{fill:var(--fn)}
.fcv .fview g[data-act]:hover .sv-fn,.fcv .fview g[data-act]:hover .sv-sum{filter:brightness(1.12)}
.fcv .fview .sv-fbt{fill:#fff;pointer-events:auto} .fcv .fview .sv-fbt.abs,.fcv .fview .sv-fbt.nag{fill:var(--ink)}
.fcv .fview .sv-dn{font:500 9px var(--mono);fill:var(--muted)} .fcv .fview .sv-dl{cursor:pointer} .fcv .fview .sv-dl:hover{fill:var(--ink);text-decoration:underline}
.fcv .fview .sv-pill text{font:600 9px var(--mono)}
.fcv .fview .sv-pill.if rect{fill:color-mix(in srgb,var(--warn) 18%,var(--paper))} .fcv .fview .sv-pill.if text{fill:var(--warn)}
.fcv .fview .sv-pill.loop rect{fill:color-mix(in srgb,var(--loop) 18%,var(--paper))} .fcv .fview .sv-pill.loop text{fill:var(--loop)}
.fcv .fview .sv-pill.fail rect{fill:color-mix(in srgb,var(--fail) 16%,var(--paper))} .fcv .fview .sv-pill.fail text{fill:var(--fail);font-family:var(--font)}
.fcv .fview .sv-pill.exec rect{fill:color-mix(in srgb,var(--run) 16%,var(--paper))} .fcv .fview .sv-pill.exec text{fill:var(--run);font-family:var(--font)}
.fcv .fview .sv-pill.wait rect{fill:color-mix(in srgb,var(--warn) 16%,var(--paper))} .fcv .fview .sv-pill.wait text{fill:var(--warn);font-family:var(--font)}
.fcv .fview .sv-pill.cancel rect{fill:color-mix(in srgb,var(--muted) 16%,var(--paper))} .fcv .fview .sv-pill.cancel text{fill:var(--muted);font-family:var(--font)}
.fcv .fview .sv-fd rect,.fcv .fview .sv-fd path{fill:var(--paper);stroke:var(--dado);stroke-width:1.2} .fcv .fview .sv-fd.ext rect,.fcv .fview .sv-fd.ext path{fill:var(--dado)}
.fcv .fview .sv-fd text{font:500 9px var(--mono);fill:var(--body)} .fcv .fview .sv-fd.ext text{fill:var(--muted)}
.fcv .fview .fdep{fill:none;stroke:#9a9a9a;stroke-width:1.2} .fcv .fview .fdep.dash{stroke-dasharray:3 3}
.fcv .fview .fdep-hit{stroke:transparent;stroke-width:14;fill:none;cursor:pointer;pointer-events:stroke}
.fcv .fview .fdep-hit:hover + .fdep{stroke:var(--accent)}
.fcv .fview .fstub{stroke:#9a9a9a;stroke-width:1.2}
.fcv .fview .fdot{fill:var(--paper);stroke:var(--dado);stroke-width:1.3;cursor:pointer} .fcv .fview .fdot.a{fill:var(--dado)}
.fcv .fview .fif{fill:var(--paper);stroke:var(--warn);stroke-width:1.5;pointer-events:none} .fcv .fview .fif-pad{fill:transparent}
.fcv .fview .io-ghost{cursor:pointer} .fcv .fview .io-ghost .hit{fill:transparent} .fcv .fview .io-ghost .gh{fill:var(--paper);stroke:var(--dado);stroke-width:1.2;opacity:0} .fcv .fview .io-ghost .gp{stroke:var(--dado);stroke-width:1.2;fill:none;opacity:0;pointer-events:none} .fcv .fview .io-ghost:hover .gh,.fcv .fview .io-ghost:hover .gp{opacity:1}
.fcv .fview .fif-hit,.fcv .fview .floop-hit{cursor:pointer}
.fcv .fview .floop{fill:transparent;stroke:none}
.fcv .fview .farc{fill:none;stroke:var(--loop);stroke-width:1.3;pointer-events:none}
.fcv .flfoot{flex:none;display:flex;align-items:center;gap:14px;padding:8px 16px;border-top:1px solid var(--line);flex-wrap:wrap}
.fcv .flegend{display:flex;align-items:center;gap:12px;font-size:11px;color:var(--muted);flex-wrap:wrap}
.fcv .flegend>span{display:inline-flex;align-items:center;gap:5px} .fcv .flegend i{display:inline-block}
.fcv .lg-fc{width:16px;height:8px;border-radius:2px;background:var(--fn)} .fcv .lg-fa{width:16px;height:8px;border-radius:2px;border:1.5px solid var(--fn)}
.fcv .lg-dot{width:8px;height:8px;border:1.3px solid var(--dado)} .fcv .lg-da{width:8px;height:8px;background:var(--dado)}
.fcv .lg-sum{width:18px;height:4px;border-radius:2px;background:var(--fn)} .fcv .lg-seq{width:14px;height:8px;border-top:1.2px solid #9a9a9a;border-right:1.2px solid #9a9a9a}
.fcv .lg-try{width:8px;height:8px;border:1.5px solid var(--ok);border-radius:2px} .fcv .lg-catch{width:8px;height:8px;border:1.5px solid var(--fail);border-radius:2px} .fcv .lg-for{width:8px;height:8px;border:1.5px solid var(--loop);border-radius:50%} .fcv .lg-if{width:8px;height:8px;border:1.5px solid var(--warn);transform:rotate(45deg)}
.fcv .ftag{font:600 10px var(--mono);padding:3px 5px;border-radius:3px;color:var(--loop);background:color-mix(in srgb,var(--loop) 18%,transparent)}
.fcv .vdock{margin-left:auto;display:flex;align-items:center;gap:2px;padding:2px;border:1px solid var(--line);border-radius:10px;background:var(--paper);box-shadow:var(--shadow)}
.fcv .vdock button{width:30px;height:28px;border:0;background:none;border-radius:8px;display:grid;place-items:center;color:var(--muted);cursor:pointer;padding:0}
.fcv .vdock button:hover{color:var(--ink);background:var(--wash)} .fcv .vdock button[aria-pressed="true"]{background:var(--ink);color:var(--paper)}
.fcv .vdock svg{width:15px;height:15px} .fcv .vdock .fd-sep{width:1px;align-self:stretch;margin:5px 3px;background:var(--line)}
.fcv .toast{position:absolute;left:50%;bottom:64px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:7px 12px;border-radius:8px;font-size:12px;z-index:9;box-shadow:var(--shadow)}
.fcv.ro{min-height:0;height:auto;border-radius:6px;pointer-events:none}
.fcv .fs-bar{position:absolute;top:6px;right:6px;z-index:8;pointer-events:auto;display:flex;gap:2px;background:var(--paper);border:1px solid var(--line-2);border-radius:7px;box-shadow:var(--shadow);padding:1px}
.fcv .fs-extra{display:none;width:26px;height:26px} .fcv.ro.full .fs-extra{display:inline-grid}
.fcv .fs-btn{width:26px;height:26px}
.fcv:not(.ro) .fs-bar{top:5px;right:10px;box-shadow:none;border-color:transparent;background:none}
.fcv:not(.ro) .ztoolbar{padding-right:50px}
.fcv.full{position:fixed;inset:0;z-index:2147483000;height:100vh;width:100vw;min-height:0;border:0;border-radius:0}
.fcv.ro.full{pointer-events:auto} .fcv.ro.full .zcanvas{flex:1;height:auto}
.fcv.ro .fl-tools,.fcv.ro .bar-tools,.fcv.ro .edge-pop{display:none!important}
.fcv.ro .resp-pick select,.fcv.ro .task-pick{pointer-events:none}
.fcv.ro .zcanvas{cursor:default;flex:none}
.fcv .empty{padding:40px;color:var(--muted);text-align:center}

/* ───── temas do Flow IDE com regras próprias (espelham flow.css; ativados por <html data-tema="…">) ───── */
:root[data-tema="eternos"] .fcv .fview .fdot{fill:#fff;stroke:#0b0b0b} :root[data-tema="eternos"] .fcv .fview .fdot.a{fill:#0b0b0b}
:root[data-tema="eternos"] .fcv .lg-fc{background:#fff;border:1.5px solid #0b0b0b} :root[data-tema="eternos"] .fcv .lg-fa{background:#0b0b0b;border-color:#0b0b0b}
:root[data-tema="eternos"] .fcv .lg-dot{background:#fff;border-color:#0b0b0b} :root[data-tema="eternos"] .fcv .lg-da{background:#0b0b0b}
:root[data-tema="eternos"] .fcv .fav{background:#fff;border-color:#0b0b0b;color:#0b0b0b} :root[data-tema="eternos"] .fcv .fav.maquina{border-color:#1f7a4d;color:#1f7a4d}
:root[data-tema="eternos"] .fcv .fav.none{background:none;border:1px dashed var(--line-2);color:var(--muted)}
:root[data-tema="eternos"] .fcv .grow.sel{background:rgba(0,0,0,.07);box-shadow:inset 0 -1px 0 rgba(0,0,0,.25),inset 0 1px 0 rgba(0,0,0,.25)}
:root[data-tema="eternos"] .fcv .grow.ifrow{background:rgba(0,0,0,.035)}
:root[data-tema="eternos-black"] .fcv .fview .sv-fn{fill:#fff;stroke:#fff;stroke-width:1.5} :root[data-tema="eternos-black"] .fcv .fview .sv-fn.abs{fill:#000;stroke:#f2f2f2}
:root[data-tema="eternos-black"] .fcv .fview .sv-fn.nag{fill:transparent} :root[data-tema="eternos-black"] .fcv .fview .sv-fbt{fill:#0b0b0b} :root[data-tema="eternos-black"] .fcv .fview .sv-fbt.abs{fill:#f2f2f2}
:root[data-tema="eternos-black"] .fcv .fview .sv-selr{fill:rgba(255,255,255,.08)} :root[data-tema="eternos-black"] .fcv .fview .sv-band:not(.tr):not(.ca){fill:rgba(255,255,255,.04)}
:root[data-tema="eternos-black"] .fcv .fview .fdot{fill:#fff;stroke:#fff} :root[data-tema="eternos-black"] .fcv .fview path.fdot{stroke:#0b0b0b} :root[data-tema="eternos-black"] .fcv .fview .fdot.a{fill:#000;stroke:#f2f2f2}
:root[data-tema="eternos-black"] .fcv .fview .sv-fd rect,:root[data-tema="eternos-black"] .fcv .fview .sv-fd path{fill:#fff;stroke:#fff}
:root[data-tema="eternos-black"] .fcv .fview .sv-fd.ext rect,:root[data-tema="eternos-black"] .fcv .fview .sv-fd.ext path{fill:#000;stroke:#f2f2f2}
:root[data-tema="eternos-black"] .fcv .lg-fc{background:#fff;border:1.5px solid #fff} :root[data-tema="eternos-black"] .fcv .lg-fa{background:#000;border:1.5px solid #f2f2f2}
:root[data-tema="eternos-black"] .fcv .lg-dot{background:#fff;border-color:#fff} :root[data-tema="eternos-black"] .fcv .lg-da{background:#000;border:1.3px solid #f2f2f2}
:root[data-tema="eternos-black"] .fcv .fav{background:#fff;border-color:#f2f2f2;color:#0b0b0b} :root[data-tema="eternos-black"] .fcv .fav.maquina{border-color:#52a943;color:#52a943}
:root[data-tema="eternos-black"] .fcv .fav.none{background:none;border:1px dashed var(--line-2);color:var(--muted)}
:root[data-tema="eternos-black"] .fcv .grow.sel{background:rgba(255,255,255,.08)} :root[data-tema="eternos-black"] .fcv .grow.ifrow,:root[data-tema="eternos-black"] .fcv .grow.forrow{background:rgba(255,255,255,.04)}
:root[data-tema="tablet-black"] .fcv .fview .sv-fn{fill:#5b8cff;stroke:#5b8cff;stroke-width:1.5} :root[data-tema="tablet-black"] .fcv .fview .sv-fn.abs{fill:color-mix(in srgb,#5b8cff 14%,#0b0b0b);stroke:#5b8cff}
:root[data-tema="tablet-black"] .fcv .fview .sv-fn.nag{fill:transparent;stroke:#5b8cff} :root[data-tema="tablet-black"] .fcv .fview .sv-fbt{fill:#0b0b0b} :root[data-tema="tablet-black"] .fcv .fview .sv-fbt.abs{fill:#dbe7ff}
:root[data-tema="tablet-black"] .fcv .fview .sv-selr{fill:rgba(91,140,255,.12)} :root[data-tema="tablet-black"] .fcv .fview .sv-band:not(.tr):not(.ca){fill:rgba(255,255,255,.04)}
:root[data-tema="tablet-black"] .fcv .fview .fdot{fill:#0b0b0b;stroke:#a855f7} :root[data-tema="tablet-black"] .fcv .fview .fdot.a{fill:#5b8cff;stroke:#5b8cff}
:root[data-tema="tablet-black"] .fcv .fview .sv-fd rect,:root[data-tema="tablet-black"] .fcv .fview .sv-fd path{fill:#0b0b0b;stroke:#a855f7}
:root[data-tema="tablet-black"] .fcv .fview .sv-fd.ext rect,:root[data-tema="tablet-black"] .fcv .fview .sv-fd.ext path{fill:#5b8cff;stroke:#5b8cff}
:root[data-tema="tablet-black"] .fcv .lg-fc{background:#5b8cff;border:1.5px solid #5b8cff} :root[data-tema="tablet-black"] .fcv .lg-fa{background:color-mix(in srgb,#5b8cff 14%,#0b0b0b);border:1.5px solid #5b8cff}
:root[data-tema="tablet-black"] .fcv .lg-dot{background:#0b0b0b;border-color:#a855f7} :root[data-tema="tablet-black"] .fcv .lg-da{background:#5b8cff;border:1.3px solid #5b8cff}
:root[data-tema="tablet-black"] .fcv .fav{background:#121212;border-color:#5b8cff;color:#dbe7ff} :root[data-tema="tablet-black"] .fcv .fav.maquina{border-color:#52a943;color:#52a943}
:root[data-tema="tablet-black"] .fcv .fav.ia{border-color:#a855f7;color:#e9d5ff} :root[data-tema="tablet-black"] .fcv .fav.pessoa{border-color:#5b8cff;color:#dbe7ff}
:root[data-tema="tablet-black"] .fcv .fav.none{background:none;border:1px dashed var(--line-2);color:var(--muted)}
:root[data-tema="tablet-black"] .fcv .grow.sel{background:rgba(91,140,255,.12)} :root[data-tema="tablet-black"] .fcv .grow.ifrow,:root[data-tema="tablet-black"] .fcv .grow.forrow{background:rgba(255,255,255,.04)}
`;
