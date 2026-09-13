
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
