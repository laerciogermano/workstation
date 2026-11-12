#!/usr/bin/env python3
"""Gera motion/logo-reveal.html: pin drop do logo v4 (Rolê entra, Go cai, ping no furo). Clique repete."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import *

role, go = split_lockup()
W = 760; s = W / 989; hx, hy = 883 * s, 108 * s
html = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>RolêGo — pin drop</title><style>
{FONT}
:root{{--ease-standard:cubic-bezier(.2,0,0,1);--ease-emphasized:cubic-bezier(.16,1,.3,1)}}
html,body{{margin:0;height:100%}}body{{background:{PURPLE};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;font-family:Poppins,sans-serif;cursor:pointer;overflow:hidden}}
.lk{{position:relative;width:{W}px;height:{256 * s:.0f}px}}.lk img{{position:absolute;inset:0;width:100%}}
.role{{animation:role 220ms var(--ease-standard) both}}
.go{{animation:go 280ms var(--ease-emphasized) 120ms both}}
.ping{{position:absolute;left:{hx:.0f}px;top:{hy:.0f}px;width:60px;height:60px;margin:-30px 0 0 -30px;border-radius:50%;border:4px solid #00E5E5;opacity:0;animation:ping 420ms var(--ease-standard) 400ms both}}
.slo{{color:#fff;font-weight:800;font-style:italic;font-size:44px;letter-spacing:-.02em;animation:fade 300ms var(--ease-standard) 560ms both}}.slo b{{color:#00E5E5}}
.hint{{position:fixed;bottom:20px;color:rgba(255,255,255,.6);font-size:13px}}
@keyframes role{{from{{opacity:0;transform:translateX(-16px)}}to{{opacity:1;transform:none}}}}
@keyframes go{{from{{opacity:0;transform:translateY(-40%)}}to{{opacity:1;transform:none}}}}
@keyframes ping{{0%{{opacity:.9;transform:scale(.2)}}100%{{opacity:0;transform:scale(1.8)}}}}
@keyframes fade{{from{{opacity:0;transform:translateY(6px)}}to{{opacity:1;transform:none}}}}
@media (prefers-reduced-motion: reduce){{.role,.go,.slo{{animation:none}}.ping{{display:none}}}}
</style></head><body onclick="r()">
<div class="lk" id="lk"><img class="role" src="{role}" alt=""><img class="go" src="{go}" alt=""><span class="ping"></span></div>
<div class="slo" id="slo">Viva o <b>rolê.</b></div><div class="hint">clique para repetir · respeita prefers-reduced-motion</div>
<script>function r(){{for(const id of ['lk','slo']){{const e=document.getElementById(id),c=e.cloneNode(true);e.replaceWith(c)}}}}</script>
</body></html>"""
open(os.path.join(HERE, "motion", "logo-reveal.html"), "w").write(html)
print("ok motion/logo-reveal.html")
