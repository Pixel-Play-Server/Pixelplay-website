/* global window, document */

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getSectionIndex() {
  // Solo indexamos secciones que tengan id (para navegar)
  const selectors = ["h2[id]", "h3[id]"];
  const nodes = Array.from(document.querySelectorAll(selectors.join(",")));

  return nodes.map((el) => {
    const id = el.getAttribute("id") || "";
    const title = (el.textContent || "").trim();

    // Tomamos un poco de texto cercano como “preview” (primer párrafo después del heading)
    let preview = "";
    let next = el.nextElementSibling;
    while (next && next.tagName && ["DIV"].includes(next.tagName) && !next.textContent.trim()) {
      next = next.nextElementSibling;
    }
    if (next && next.textContent) {
      preview = next.textContent.trim().slice(0, 120);
    }

    return { id, title, preview, level: el.tagName.toLowerCase() };
  });
}

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  // Actualiza hash sin saltar dos veces
  window.history.replaceState(null, "", `#${encodeURIComponent(id)}`);
}

function init() {
  if (document.body.getAttribute("data-pp-page") !== "wiki") return;

  // Este es el input existente del header de wiki.html
  const input = document.querySelector('input[placeholder="Buscar guías, comandos o ítems..."]');
  if (!input) return;

  // Creamos contenedor de resultados como overlay (portal al <body>)
  // para que no quede recortado por contenedores con overflow-hidden.
  const results = document.createElement("div");
  results.id = "pp-wiki-search-results";
  results.className =
    "hidden rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-bg shadow-2xl overflow-hidden";
  results.style.position = "fixed";
  results.style.zIndex = "9999";
  results.style.left = "0px";
  results.style.top = "0px";
  results.style.width = "0px";
  document.body.appendChild(results);

  const index = getSectionIndex();

  function hide() {
    results.classList.add("hidden");
    results.innerHTML = "";
  }

  function positionResults() {
    const r = input.getBoundingClientRect();
    results.style.left = `${Math.round(r.left)}px`;
    results.style.top = `${Math.round(r.bottom + 8)}px`;
    results.style.width = `${Math.round(r.width)}px`;
    // altura máxima visible (para que no se salga de pantalla)
    const maxH = Math.max(180, window.innerHeight - (r.bottom + 16));
    results.style.maxHeight = `${Math.floor(maxH)}px`;
    results.style.overflowY = "auto";
  }

  function render(items) {
    if (!items.length) {
      results.innerHTML =
        '<div class="p-4 text-sm text-slate-500 dark:text-dark-text">No se encontraron resultados.</div>';
      return;
    }

    results.innerHTML = items
      .slice(0, 8)
      .map((it) => {
        const title = escapeHtml(it.title);
        const preview = escapeHtml(it.preview || "");
        const id = escapeHtml(it.id);
        const badge =
          it.level === "h2"
            ? '<span class="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">Sección</span>'
            : '<span class="text-xs font-bold text-slate-500 dark:text-dark-text bg-slate-100 dark:bg-dark-surface border border-slate-200 dark:border-dark-border px-2 py-0.5 rounded">Subsección</span>';

        return `
          <button type="button" data-id="${id}" class="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-dark-surface transition-colors">
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <div class="font-bold text-slate-900 dark:text-white truncate">${title}</div>
                ${preview ? `<div class="text-sm text-slate-600 dark:text-dark-text mt-1 line-clamp-2">${preview}</div>` : ""}
              </div>
              ${badge}
            </div>
          </button>
        `;
      })
      .join("");
  }

  function onInput() {
    const q = normalize(input.value);
    if (!q) return hide();

    const filtered = index
      .map((it) => {
        const hay = normalize(`${it.title} ${it.preview}`);
        const score = hay.includes(q) ? 2 : 0;
        const score2 = normalize(it.title).includes(q) ? 1 : 0;
        return { ...it, _score: score + score2 };
      })
      .filter((it) => it._score > 0)
      .sort((a, b) => b._score - a._score);

    positionResults();
    results.classList.remove("hidden");
    render(filtered);
  }

  input.addEventListener("input", onInput);
  input.addEventListener("focus", onInput);
  window.addEventListener("resize", () => {
    if (!results.classList.contains("hidden")) positionResults();
  });
  window.addEventListener("scroll", () => {
    if (!results.classList.contains("hidden")) positionResults();
  }, { passive: true });

  results.addEventListener("click", (e) => {
    const btn = e.target && e.target.closest ? e.target.closest("button[data-id]") : null;
    if (!btn) return;
    const id = btn.getAttribute("data-id");
    hide();
    if (id) scrollToId(id);
  });

  // Cierra al hacer click afuera
  document.addEventListener("click", (e) => {
    if (e.target === input) return;
    if (results.contains(e.target)) return;
    hide();
  });

  // Escape para cerrar
  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hide();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}


