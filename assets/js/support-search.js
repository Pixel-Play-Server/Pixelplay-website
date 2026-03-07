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

function buildItems() {
  return [
    {
      title: "Conexión",
      desc: "Problemas para entrar, errores de autenticación o timeout.",
      url: "#pp-support-connection",
      keywords: ["login", "timeout", "timed out", "ip", "entrada", "auth"],
    },
    {
      title: "Pagos y recompensas",
      desc: "Cobros duplicados, entregas pendientes, rangos, llaves o recompensas.",
      url: "#pp-support-payments",
      keywords: ["pago", "compra", "rango", "llave", "entrega", "recompensa"],
    },
    {
      title: "Sanciones",
      desc: "Apelaciones, reportes o consultas sobre reglas.",
      url: "#pp-support-punishments",
      keywords: ["ban", "baneo", "apelacion", "reporte", "mute", "sancion"],
    },
    {
      title: "Reglas del servidor",
      desc: "Consulta las reglas oficiales.",
      url: "https://pixelplay.gg/rules/",
      keywords: ["reglas", "rules"],
      external: true,
    },
    {
      title: "Wiki: Modalidades",
      desc: "Anárquico, Vanilla, Survival con plugins y Skyblock.",
      url: "wiki.html#modalidades",
    },
    {
      title: "Wiki: Reglas y clientes",
      desc: "Clientes permitidos/prohibidos y normas importantes.",
      url: "wiki.html#reglas-clientes",
    },
    {
      title: "Abrir ticket en Discord",
      desc: "Soporte directo con el staff.",
      url: "https://discord.pixelplay.gg",
      keywords: ["ticket", "discord", "soporte"],
      external: true,
    },
  ];
}

function init() {
  if (document.body.getAttribute("data-pp-page") !== "soporte") return;

  const input = document.getElementById("pp-support-search");
  const results = document.getElementById("pp-support-results");
  if (!input || !results) return;

  const items = buildItems();

  function render(list) {
    if (!list.length) {
      results.innerHTML =
        '<div class="text-sm text-slate-500 dark:text-slate-400">No se encontraron resultados.</div>';
      return;
    }

    results.innerHTML = list
      .map((it) => {
        const title = escapeHtml(it.title);
        const desc = escapeHtml(it.desc || "");
        const href = escapeHtml(it.url);
        const external = Boolean(it.external);
        const rel = external ? ' rel="noreferrer"' : "";
        const target = external ? ' target="_blank"' : "";
        return `
          <a class="block rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-surface-dark p-4 hover:border-primary/50 transition-colors" href="${href}"${target}${rel}>
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="font-bold text-slate-900 dark:text-white truncate">${title}</div>
                <div class="text-sm text-slate-600 dark:text-slate-400 mt-1">${desc}</div>
              </div>
              <span class="material-symbols-outlined text-slate-400">${external ? "open_in_new" : "arrow_forward"}</span>
            </div>
          </a>
        `;
      })
      .join("");
  }

  function onInput() {
    const q = normalize(input.value);
    if (!q) {
      results.innerHTML = "";
      results.classList.add("hidden");
      return;
    }

    const filtered = items.filter((it) => {
      const hay = normalize(`${it.title} ${it.desc || ""} ${(it.keywords || []).join(" ")}`);
      return hay.includes(q);
    });

    results.classList.remove("hidden");
    render(filtered);
  }

  input.addEventListener("input", onInput);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}


