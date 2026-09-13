#!/usr/bin/env python3
"""Gera a wiki HTML a partir dos READMEs de flow/epics e flow/tasks."""

from __future__ import annotations

import html
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FLOW = ROOT / "flow"
WIKI = ROOT / "wiki"
SECTIONS = ("epics", "tasks")

STATUS_CLASS = {
    "todo": "status-todo",
    "doing": "status-doing",
    "done": "status-done",
}


def rewrite_href(href: str, rel_page: Path | None = None) -> str:
    href = href.strip()
    if href.startswith(("http://", "https://", "mailto:", "#")):
        return href
    href = href.replace("\\", "/")
    if href.endswith("board.md") and rel_page is not None:
        return Path(os_relpath(str(ROOT / "board.md"), str(WIKI / rel_page.parent))).as_posix()
    # README.md / folder links → index.html
    if href.endswith("/README.md"):
        return href[: -len("README.md")] + "index.html"
    if href.endswith("README.md"):
        return href[: -len("README.md")] + "index.html"
    if href.endswith("/"):
        return href + "index.html"
    return href


def fix_image_src(src: str, rel_from_wiki: Path) -> str:
    """Point image refs at flow/images or local print.png under flow."""
    src = src.replace("%20", " ")
    src = html.unescape(src)
    if src.startswith(("http://", "https://", "data:")):
        return html.escape(src)
    # resolve against original md location under flow
    # rel_from_wiki is like epics/EP-01/... → original under flow/
    flow_page_dir = FLOW / rel_from_wiki.parent
    target = (flow_page_dir / src).resolve()
    try:
        rel = Path(os_path_rel(WIKI / rel_from_wiki.parent, target))
        return html.escape(rel.as_posix())
    except Exception:
        return html.escape(src)


def os_path_rel(from_dir: Path, to_file: Path) -> str:
    return str(Path(os_relpath(str(to_file), str(from_dir))))


def os_relpath(path: str, start: str) -> str:
    import os

    return os.path.relpath(path, start)


def format_rich_text(text: str) -> str:
    """Escape plain text while preserving **bold** and `code`."""
    tokens: list[tuple[str, str]] = []

    def stash(kind: str, inner: str) -> str:
        tokens.append((kind, inner))
        return f"\x00{len(tokens) - 1}\x00"

    text = re.sub(r"`([^`]+)`", lambda m: stash("code", m.group(1)), text)
    text = re.sub(r"\*\*([^*]+)\*\*", lambda m: stash("strong", m.group(1)), text)
    text = html.escape(text)

    def restore(m: re.Match) -> str:
        kind, inner = tokens[int(m.group(1))]
        esc = html.escape(inner)
        return f"<code>{esc}</code>" if kind == "code" else f"<strong>{esc}</strong>"

    return re.sub(r"\x00(\d+)\x00", restore, text)


def md_inline(text: str, rel_page: Path | None = None) -> str:
    slots: list[str] = []

    def hold(html_snippet: str) -> str:
        slots.append(html_snippet)
        return f"\x01{len(slots) - 1}\x01"

    # images ![alt](src) — placeholder, fixed later
    text = re.sub(
        r"!\[([^\]]*)\]\(([^)]+)\)",
        lambda m: hold(
            f'<img data-src="{html.escape(m.group(2))}" alt="{html.escape(m.group(1))}" />'
        ),
        text,
    )
    # links [text](href)
    text = re.sub(
        r"\[([^\]]+)\]\(([^)]+)\)",
        lambda m: hold(
            f'<a href="{html.escape(rewrite_href(m.group(2), rel_page))}">'
            f"{format_rich_text(m.group(1))}</a>"
        ),
        text,
    )
    text = format_rich_text(text)
    return re.sub(r"\x01(\d+)\x01", lambda m: slots[int(m.group(1))], text)


def parse_table(lines: list[str], start: int, rel_page: Path | None = None) -> tuple[str, int]:
    rows = []
    i = start
    while i < len(lines) and lines[i].strip().startswith("|"):
        rows.append(lines[i].strip())
        i += 1
    if len(rows) < 2:
        return "", start

    def split_row(row: str) -> list[str]:
        parts = [c.strip() for c in row.strip("|").split("|")]
        return parts

    header = split_row(rows[0])
    body_rows = [split_row(r) for r in rows[2:] if not re.match(r"^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$", r)]

    out = ['<table class="meta">']
    out.append("<thead><tr>" + "".join(f"<th>{md_inline(c, rel_page)}</th>" for c in header) + "</tr></thead>")
    out.append("<tbody>")
    for row in body_rows:
        cells = []
        for idx, c in enumerate(row):
            cls = ""
            header_name = header[idx].strip().lower() if idx < len(header) else ""
            if header_name == "status":
                cls = STATUS_CLASS.get(c.strip().lower(), "")
            elif len(row) >= 2 and row[0].strip().lower() == "status" and idx == 1:
                cls = STATUS_CLASS.get(c.strip().lower(), "")
            cells.append(f'<td class="{cls}">{md_inline(c, rel_page)}</td>')
        out.append("<tr>" + "".join(cells) + "</tr>")
    out.append("</tbody></table>")
    return "\n".join(out), i


def markdown_to_html(md: str, rel_from_wiki: Path) -> str:
    lines = md.splitlines()
    out: list[str] = []
    i = 0
    in_code = False
    code_lang = ""
    code_buf: list[str] = []
    list_type = None  # ul / ol

    def close_list():
        nonlocal list_type
        if list_type:
            out.append(f"</{list_type}>")
            list_type = None

    while i < len(lines):
        line = lines[i]

        if line.strip().startswith("```"):
            close_list()
            fence = line.strip()[3:].strip()
            if not in_code:
                in_code = True
                code_lang = fence
                code_buf = []
            else:
                in_code = False
                body = "\n".join(code_buf)
                if code_lang == "mermaid":
                    out.append(f'<pre class="mermaid">{html.escape(body)}</pre>')
                else:
                    lang = f' class="language-{html.escape(code_lang)}"' if code_lang else ""
                    out.append(f"<pre><code{lang}>{html.escape(body)}</code></pre>")
                code_lang = ""
            i += 1
            continue

        if in_code:
            code_buf.append(line)
            i += 1
            continue

        if line.strip().startswith("|") and i + 1 < len(lines) and re.search(r"\|?\s*-{3,}", lines[i + 1]):
            close_list()
            table_html, i = parse_table(lines, i, rel_from_wiki)
            out.append(table_html)
            continue

        if re.match(r"^#{1,6}\s+", line):
            close_list()
            level = len(line) - len(line.lstrip("#"))
            text = line.lstrip("#").strip()
            out.append(f"<h{level}>{md_inline(text, rel_from_wiki)}</h{level}>")
            i += 1
            continue

        if re.match(r"^[-*]\s+", line):
            if list_type != "ul":
                close_list()
                out.append("<ul>")
                list_type = "ul"
            item = re.sub(r"^[-*]\s+", "", line)
            out.append(f"<li>{md_inline(item, rel_from_wiki)}</li>")
            i += 1
            continue

        if re.match(r"^\d+\.\s+", line):
            if list_type != "ol":
                close_list()
                out.append("<ol>")
                list_type = "ol"
            item = re.sub(r"^\d+\.\s+", "", line)
            out.append(f"<li>{md_inline(item, rel_from_wiki)}</li>")
            i += 1
            continue

        if line.strip() == "---":
            close_list()
            out.append("<hr />")
            i += 1
            continue

        if not line.strip():
            close_list()
            i += 1
            continue

        # paragraph (possibly continuation of wrapped prose)
        close_list()
        para = [line]
        i += 1
        while i < len(lines):
            nxt = lines[i]
            if not nxt.strip():
                break
            if nxt.lstrip().startswith(("#", "|", "```")):
                break
            if re.match(r"^[-*]\s+", nxt) or re.match(r"^\d+\.\s+", nxt):
                break
            if nxt.strip() == "---":
                break
            para.append(nxt)
            i += 1
        text = " ".join(p.strip() for p in para)
        # arrow footer lines
        if text.startswith("→"):
            out.append(f'<p class="footer-nav">{md_inline(text, rel_from_wiki)}</p>')
        else:
            out.append(f"<p>{md_inline(text, rel_from_wiki)}</p>")

    close_list()
    result = "\n".join(out)

    # fix image paths
    def replace_img(m: re.Match) -> str:
        src = m.group(1)
        alt = m.group(2)
        fixed = fix_image_src(src, rel_from_wiki)
        # encode spaces for file URLs
        fixed = fixed.replace(" ", "%20")
        return f'<img src="{fixed}" alt="{alt}" loading="lazy" />'

    result = re.sub(
        r'<img data-src="([^"]*)" alt="([^"]*)" />',
        replace_img,
        result,
    )
    return result


def css_href(rel: Path) -> str:
    depth = len(rel.parts) - 1  # index.html at depth 0 of folder
    return "../" * depth + "assets/wiki.css"


def js_href(rel: Path) -> str:
    depth = len(rel.parts) - 1
    return "../" * depth + "assets/wiki.js"


def root_href(rel: Path, target: str = "index.html") -> str:
    depth = len(rel.parts) - 1
    return "../" * depth + target


def nav_html(rel: Path, title: str) -> str:
    root = root_href(rel)
    epics = root_href(rel, "epics/index.html")
    tasks = root_href(rel, "tasks/index.html")
    return f"""
<aside class="sidebar">
  <a class="brand" href="{root}">Flow Wiki</a>
  <nav>
    <a href="{epics}">Épicos</a>
    <a href="{tasks}">Tasks</a>
  </nav>
  <p class="side-note">Espelho HTML de <code>flow/</code></p>
</aside>
"""


def page_shell(title: str, body: str, rel: Path, crumb: str = "") -> str:
    return f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{html.escape(title)} · Flow Wiki</title>
  <link rel="stylesheet" href="{css_href(rel)}" />
</head>
<body>
  <div class="layout">
    {nav_html(rel, title)}
    <main class="content">
      {f'<p class="crumb">{crumb}</p>' if crumb else ''}
      {body}
    </main>
  </div>
  <script src="{js_href(rel)}"></script>
</body>
</html>
"""


def convert_tree(section: str) -> None:
    src_root = FLOW / section
    dst_root = WIKI / section
    for readme in sorted(src_root.rglob("README.md")):
        rel_dir = readme.parent.relative_to(FLOW)
        out_dir = WIKI / rel_dir
        out_dir.mkdir(parents=True, exist_ok=True)
        rel_page = rel_dir / "index.html"
        md = readme.read_text(encoding="utf-8-sig")
        # title from first heading
        m = re.search(r"^#\s+(.+)$", md, re.M)
        title = m.group(1).strip() if m else rel_dir.name
        body = markdown_to_html(md, rel_page)
        parts = list(rel_dir.parts)
        crumbs = [f'<a href="{root_href(rel_page)}">Wiki</a>']
        acc: list[str] = []
        for p in parts:
            acc.append(p)
            href = root_href(rel_page, "/".join(acc) + "/index.html")
            crumbs.append(f'<a href="{href}">{html.escape(p)}</a>')
        crumb = " / ".join(crumbs)
        html_page = page_shell(title, body, rel_page, crumb)
        (out_dir / "index.html").write_text(html_page, encoding="utf-8")
        print(f"  wrote {rel_page.as_posix()}")


def write_home() -> None:
    body = """
<h1>Flow Wiki</h1>
<p>Wiki HTML com a mesma estrutura dos Markdown em <code>flow/epics</code> e <code>flow/tasks</code>.</p>
<div class="cards">
  <a class="card" href="epics/index.html">
    <h2>Épicos</h2>
    <p>EP-01 … EP-04 e histórias de usuário.</p>
  </a>
  <a class="card" href="tasks/index.html">
    <h2>Tasks</h2>
    <p>Hierarquia TSK-001 … TSK-012.</p>
  </a>
</div>
<h2>Estrutura</h2>
<pre class="tree">wiki/
├── epics/
│   ├── EP-01-explorar/
│   │   ├── US-01-criar-arquivo/
│   │   └── …
│   ├── EP-02-board/
│   ├── EP-03-gantt/
│   └── EP-04-arvore-de-execucao/
└── tasks/
    └── TSK-001-criar-epico/
        └── TSK-002-criar-as-historias/
            ├── TSK-003-explorar/
            │   └── TSK-007…012/
            ├── TSK-004-board/
            ├── TSK-005-gantt/
            └── TSK-006-arvore-de-execucao/</pre>
"""
    (WIKI / "index.html").write_text(
        page_shell("Início", body, Path("index.html")),
        encoding="utf-8",
    )
    print("  wrote index.html")


def write_assets() -> None:
    assets = WIKI / "assets"
    assets.mkdir(parents=True, exist_ok=True)
    (assets / "wiki.css").write_text(
        """
:root {
  --bg: #0f1419;
  --panel: #1a222c;
  --text: #e7ecf1;
  --muted: #9aa7b5;
  --accent: #3d9cf0;
  --line: #2a3542;
  --todo: #8b95a1;
  --doing: #e0b44b;
  --done: #4caf7a;
  --font: "Segoe UI", "IBM Plex Sans", system-ui, sans-serif;
  --mono: "Cascadia Code", "Consolas", monospace;
}

* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  line-height: 1.55;
  min-height: 100vh;
}

.layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  min-height: 100vh;
}

.sidebar {
  background: var(--panel);
  border-right: 1px solid var(--line);
  padding: 1.25rem 1rem;
  position: sticky;
  top: 0;
  height: 100vh;
}

.brand {
  display: block;
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--text);
  text-decoration: none;
  margin-bottom: 1.25rem;
}

.sidebar nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.sidebar nav a {
  color: var(--muted);
  text-decoration: none;
  padding: 0.4rem 0.55rem;
  border-radius: 6px;
}

.sidebar nav a:hover {
  background: #243040;
  color: var(--text);
}

.side-note {
  margin-top: 2rem;
  font-size: 0.75rem;
  color: var(--muted);
}

.content {
  padding: 1.75rem 2rem 3rem;
  max-width: 920px;
}

.crumb {
  font-size: 0.85rem;
  color: var(--muted);
  margin: 0 0 1rem;
}

.crumb a { color: var(--accent); text-decoration: none; }
.crumb a:hover { text-decoration: underline; }

h1, h2, h3 { line-height: 1.25; margin: 1.4rem 0 0.7rem; }
h1 { margin-top: 0; font-size: 1.85rem; }
h2 { font-size: 1.3rem; border-bottom: 1px solid var(--line); padding-bottom: 0.35rem; }
h3 { font-size: 1.05rem; }

p { margin: 0.65rem 0; color: #d5dde6; }
a { color: var(--accent); }
strong { color: #fff; }

table.meta {
  width: 100%;
  border-collapse: collapse;
  margin: 0.85rem 0 1.25rem;
  font-size: 0.92rem;
}

table.meta th,
table.meta td {
  border: 1px solid var(--line);
  padding: 0.45rem 0.65rem;
  text-align: left;
  vertical-align: top;
}

table.meta th {
  background: #222b36;
  color: var(--muted);
  font-weight: 600;
}

table.meta tr:nth-child(even) td { background: #151c24; }

.status-todo { color: var(--todo); font-weight: 600; }
.status-doing { color: var(--doing); font-weight: 600; }
.status-done { color: var(--done); font-weight: 600; }

ul, ol { padding-left: 1.35rem; }
li { margin: 0.25rem 0; }

pre, pre.mermaid {
  background: #121820;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 0.9rem 1rem;
  overflow-x: auto;
  font-family: var(--mono);
  font-size: 0.85rem;
}

pre.tree { color: var(--muted); }

code {
  font-family: var(--mono);
  font-size: 0.88em;
  background: #243040;
  padding: 0.1em 0.35em;
  border-radius: 4px;
}

pre code { background: none; padding: 0; }

img {
  max-width: 100%;
  border-radius: 8px;
  border: 1px solid var(--line);
  margin: 0.5rem 0 1rem;
  display: block;
}

.footer-nav { color: var(--muted); font-size: 0.9rem; }

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  margin: 1.25rem 0 2rem;
}

.card {
  display: block;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 1.1rem 1.2rem;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s ease, transform 0.15s ease;
}

.card:hover {
  border-color: var(--accent);
  transform: translateY(-2px);
}

.card h2 { margin: 0 0 0.4rem; border: 0; padding: 0; font-size: 1.15rem; color: var(--text); }
.card p { margin: 0; color: var(--muted); font-size: 0.92rem; }

@media (max-width: 720px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar {
    position: static;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--line);
  }
  .sidebar nav { flex-direction: row; flex-wrap: wrap; }
  .content { padding: 1.25rem; }
}
""",
        encoding="utf-8",
    )
    (assets / "wiki.js").write_text(
        """
(async () => {
  const nodes = document.querySelectorAll("pre.mermaid");
  if (!nodes.length) return;
  try {
    const mermaid = (await import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs")).default;
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
    });
    await mermaid.run({ nodes });
  } catch (err) {
    console.warn("Mermaid failed to load", err);
  }
})();
""",
        encoding="utf-8",
    )
    print("  wrote assets/")


def main() -> None:
    print("Building Flow wiki…")
    write_assets()
    write_home()
    for section in SECTIONS:
        print(f"Converting {section}/…")
        convert_tree(section)
    print("Done.")


if __name__ == "__main__":
    main()
