// Cores chapadas, as mesmas do desenho; tudo preso ao elemento do editor.
export const styles = (s: string) => `
${s}{--bg:#050505;--panel:#0d0d0d;--field:#151515;--line:#262626;--text:#e8e8e8;--muted:#8a8a8a;--accent:#f07167;--on-accent:#fff;--warn:#e0b84f;
  display:grid;grid-template:"top top" auto "view side" minmax(0,1fr) "code side" auto / minmax(0,1fr) 360px;height:100%;background:var(--bg);color:var(--text);font:13px/1.4 var(--flow-ui-font,"IBM Plex Sans",system-ui,sans-serif)}
${s}[data-theme=light]{--bg:#fff;--panel:#faf9f6;--field:#fff;--line:#dedbd4;--text:#1d1f24;--muted:#646a75;--accent:#d2463c;--warn:#8a690c}
${s} *{box-sizing:border-box}
${s} button,${s} input,${s} select,${s} textarea{font:inherit;color:inherit}
${s} button{background:var(--field);border:1px solid var(--line);border-radius:6px;padding:5px 10px;cursor:pointer;min-height:30px}
${s} button:hover:not(:disabled){border-color:var(--muted)}
${s} button:disabled{opacity:.38;cursor:default}
${s} :focus-visible{outline:2px solid var(--accent);outline-offset:1px}
${s} input:not([type=checkbox]),${s} select,${s} textarea{background:var(--field);border:1px solid var(--line);border-radius:6px;padding:5px 8px;min-width:0;width:100%;min-height:30px}
${s} code{font-family:var(--flow-font,"IBM Plex Mono",ui-monospace,monospace);font-size:12px}
${s} header{grid-area:top;display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 12px;border-bottom:1px solid var(--line)}
${s} header strong{font-size:14px;margin-right:4px}
${s} header select{width:auto;max-width:260px}
${s} header .space{flex:1}
${s} .stage{grid-area:view;min-height:0;min-width:0;position:relative}
${s} .canvas{position:absolute;inset:0}
${s} .toast{position:absolute;left:50%;top:60px;transform:translateX(-50%);max-width:calc(100% - 32px);background:var(--accent);color:var(--on-accent);border-radius:8px;padding:8px 14px;font-weight:500}
${s} .toast:empty{display:none}
${s} aside{grid-area:side;overflow:auto;background:var(--panel);border-left:1px solid var(--line);min-height:0}
${s} aside section{padding:12px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:8px}
${s} h3{margin:0;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
${s} aside label{display:grid;grid-template-columns:110px minmax(0,1fr);align-items:center;gap:8px}
${s} aside label.check{display:flex}
${s} .hint{margin:0;color:var(--muted);font-size:12px}
${s} .rules{padding:10px 12px;border-bottom:1px solid var(--line);font-size:12px}
${s} .rules b{display:block;margin-bottom:4px}
${s} .rules ul{margin:0;padding-left:16px;color:var(--muted)}
${s} .rules:empty{display:none}
${s} .crumbs{display:flex;flex-wrap:wrap;gap:2px;align-items:center;padding:8px 12px;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--panel);z-index:1}
${s} .crumbs button{border:0;background:none;padding:2px 6px;min-height:24px;color:var(--muted);font-family:var(--flow-font,"IBM Plex Mono",ui-monospace,monospace);font-size:12px}
${s} .crumbs button[aria-current]{color:var(--on-accent);background:var(--accent)}
${s} .crumbs span{color:var(--muted)}
${s} .datum{display:flex;flex-direction:column;gap:4px}
${s} .datum .row{display:grid;grid-template-columns:minmax(0,1fr) 150px 30px;gap:4px;align-items:center}
${s} .datum .index{font-family:var(--flow-font,monospace);color:var(--muted);padding-left:6px}
${s} .datum>input,${s} .datum>select{margin-left:12px;width:calc(100% - 12px)!important}
${s} .fields{margin-left:6px;padding-left:10px;border-left:1px solid var(--line);display:flex;flex-direction:column;gap:6px}
${s} button.icon{padding:0;font-size:16px}
${s} button.link{align-self:flex-start;border-style:dashed;background:none}
${s} .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:4px}
${s} .grid.four{grid-template-columns:repeat(4,1fr)}
${s} .grid button{padding-inline:4px}
${s} button.primary{background:var(--accent);border-color:var(--accent);color:var(--on-accent);font-weight:600}
${s} button.danger{color:var(--accent)}
${s} .segmented{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);border-radius:8px;padding:2px;gap:2px}
${s} .segmented button{border:0;background:none;padding-inline:2px}
${s} .segmented button[aria-checked=true]{background:var(--text);color:var(--bg);font-weight:600}
${s} .note{margin:0;font-size:12px;color:var(--muted)}
${s} .note.error,${s} .problem.error b{color:var(--accent)}
${s} .note.warning,${s} .problem.warning b{color:var(--warn)}
${s} .problems{height:clamp(150px,26vh,260px);overflow:auto;padding:6px 12px;border-top:1px solid var(--line)}
${s} .problem{display:grid;grid-template-columns:70px minmax(80px,180px) minmax(0,1fr);gap:8px;width:100%;text-align:left;border-color:transparent;background:none;align-items:baseline}
${s} .tabs select{width:auto}
${s} .warn{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--warn);font-size:12px}
${s} .drawer{grid-area:code;border-top:1px solid var(--line);display:flex;flex-direction:column;min-height:0;min-width:0}
${s} .tabs{display:flex;flex-wrap:wrap;gap:4px;padding:6px 12px;align-items:center}
${s} .tabs button{border-color:transparent;background:none}
${s} .tabs button[aria-pressed=true]{border-color:var(--line);background:var(--field);font-weight:600}
${s} .tabs .space{flex:1}
${s} .drawer pre,${s} .drawer textarea{margin:0;height:clamp(150px,26vh,260px);overflow:auto;padding:10px 14px;font:12px/1.55 var(--flow-font,"IBM Plex Mono",ui-monospace,monospace);white-space:pre;tab-size:2}
${s} .drawer textarea{border-width:1px 0 0!important;border-radius:0!important;resize:none}
${s} [hidden]{display:none!important}
@media (max-width:820px){
  ${s}{grid-template:"top" auto "view" 55vh "code" auto "side" auto / minmax(0,1fr);height:auto;min-height:100%}
  ${s} aside{border-left:0;border-top:1px solid var(--line);overflow:visible}
}
`;
