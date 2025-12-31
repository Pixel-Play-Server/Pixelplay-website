/* global window, document, IntersectionObserver */

function normalizeHash(hash) {
  if (!hash) return "";
  return hash.startsWith("#") ? hash : `#${hash}`;
}

function getHashFromHref(href) {
  try {
    const u = new URL(href, window.location.href);
    return normalizeHash(u.hash);
  } catch (_) {
    // href puede ser "#algo"
    return normalizeHash(href);
  }
}

function collectLinks() {
  const links = Array.from(
    document.querySelectorAll('aside a[href^="#"]')
  );

  /** @type {Record<string, HTMLAnchorElement[]>} */
  const byHash = {};
  for (const a of links) {
    const hash = getHashFromHref(a.getAttribute("href") || "");
    if (!hash) continue;
    if (!byHash[hash]) byHash[hash] = [];
    byHash[hash].push(a);
  }
  return byHash;
}

function setActiveLinkClasses(a, isActive) {
  // Sidebar “izquierdo” (tiene iconos y estilos tipo pill)
  const isLeftNav = Boolean(a.closest("aside.hidden.lg\\:block"));

  if (isLeftNav) {
    a.classList.toggle("bg-slate-100", isActive);
    a.classList.toggle("dark:bg-dark-surface", isActive);
    a.classList.toggle("text-slate-900", isActive);
    a.classList.toggle("dark:text-white", isActive);
    a.classList.toggle("border-l-2", isActive);
    a.classList.toggle("border-primary", isActive);

    a.classList.toggle("text-slate-600", !isActive);
    a.classList.toggle("dark:text-dark-text", !isActive);
  } else {
    // “En esta página” (derecha)
    a.classList.toggle("text-primary", isActive);
    a.classList.toggle("font-medium", isActive);
    a.classList.toggle("border-primary", isActive);

    a.classList.toggle("text-slate-500", !isActive);
    a.classList.toggle("dark:text-dark-text", !isActive);
    a.classList.toggle("border-transparent", !isActive);
  }
}

function createScrollSpy(sectionIds) {
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const byHash = collectLinks();

  let activeHash = "";

  function updateActive(hash) {
    const next = normalizeHash(hash);
    if (!next || next === activeHash) return;

    // limpiar anteriores
    if (activeHash && byHash[activeHash]) {
      for (const a of byHash[activeHash]) setActiveLinkClasses(a, false);
    }
    activeHash = next;
    if (byHash[activeHash]) {
      for (const a of byHash[activeHash]) setActiveLinkClasses(a, true);
    }
  }

  // Inicial: usa hash de URL o #inicio
  updateActive(window.location.hash || "#inicio");

  // IntersectionObserver para detectar sección visible
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        // elegimos el entry más “arriba” que esté intersectando
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top || 0) - (b.boundingClientRect.top || 0));

        if (visible.length) {
          const id = visible[0].target.id;
          if (id) updateActive(`#${id}`);
        }
      },
      {
        // cuando el título entra al 30% superior, lo consideramos activo
        root: null,
        rootMargin: "-20% 0px -70% 0px",
        threshold: [0, 0.01, 0.1],
      }
    );

    for (const el of sections) observer.observe(el);

    // Si el usuario hace click en un link, actualiza inmediatamente (sin esperar observer)
    document.addEventListener("click", (e) => {
      const a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      const hash = getHashFromHref(a.getAttribute("href") || "");
      if (hash) updateActive(hash);
    });

    return;
  }

  // Fallback simple por scroll
  function onScroll() {
    let best = null;
    for (const el of sections) {
      const r = el.getBoundingClientRect();
      if (r.top <= 160) best = el;
    }
    if (best && best.id) updateActive(`#${best.id}`);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function init() {
  if (document.body.getAttribute("data-pp-page") !== "wiki") return;

  createScrollSpy([
    "inicio",
    "modalidades",
    "anarquico",
    "vanilla",
    "survival-plugins",
    "skyblock",
    "tutorial-skyblock",
    "reglas-clientes",
  ]);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}


