/* global window, document, fetch */

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function byDateDesc(a, b) {
  const da = new Date(a.date || 0).getTime();
  const db = new Date(b.date || 0).getTime();
  return db - da;
}

async function loadNews() {
  // Nuevo esquema: index.json (metadata) + json individual por post (contenido)
  // Para Home/Blog solo necesitamos la metadata del index.
  const res = await fetch("assets/data/posts/index.json", { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar posts/index.json");
  const data = await res.json();
  const posts = Array.isArray(data.posts) ? data.posts.slice().sort(byDateDesc) : [];

  // Generamos la URL al detalle de la noticia si no viene.
  return posts.map((p) => ({
    ...p,
    url: p.url || (p.id ? `publicacion.html?id=${encodeURIComponent(p.id)}` : "blog.html"),
  }));
}

function renderHome(posts) {
  const grid = document.getElementById("pp-home-news-grid");
  if (!grid) return;

  const top = posts.slice(0, 3);
  grid.innerHTML = top
    .map((p) => {
      const tag = escapeHtml(p.tag || "BLOG");
      const title = escapeHtml(p.title || "");
      const dateLabel = escapeHtml(p.dateLabel || "");
      const readTime = escapeHtml(p.readTime || "");
      const excerpt = escapeHtml(p.excerpt || "");
      const image = p.image ? `style='background-image: url("${escapeHtml(p.image)}");'` : "";
      const url = escapeHtml(p.url || "blog.html");

      return `
        <article class="group relative flex flex-col h-full overflow-hidden rounded-2xl bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark hover:border-primary/50 dark:hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/5 dark:hover:shadow-primary/10">
          <div class="h-56 w-full overflow-hidden relative">
            <div class="absolute top-4 left-4 z-20">
              <span class="px-3 py-1 rounded-full bg-primary/90 text-white text-xs font-bold backdrop-blur-sm shadow-md">${tag}</span>
            </div>
            <div class="h-full w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-110" ${image}></div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
          </div>
          <div class="flex flex-1 flex-col p-6 pt-2">
            <div class="flex items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400 mb-3 pt-3">
              <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">calendar_today</span> ${dateLabel}</span>
              <span class="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-600"></span>
              <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">schedule</span> ${readTime}</span>
            </div>
            <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-primary transition-colors leading-tight">${title}</h3>
            <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6 line-clamp-3">${excerpt}</p>
            <div class="mt-auto flex items-center gap-2 text-primary font-bold text-sm group-hover:underline decoration-2 underline-offset-4">
              Leer publicación
            </div>
          </div>
          <a aria-label="Leer noticia" class="absolute inset-0 z-10" href="${url}"></a>
        </article>
      `;
    })
    .join("");
}

function renderBlog(posts) {
  const featured = document.getElementById("pp-blog-featured");
  const grid = document.getElementById("pp-blog-news-grid");
  if (!featured && !grid) return;

  const [first, ...rest] = posts;

  if (featured && first) {
    const title = escapeHtml(first.title || "");
    const dateLabel = escapeHtml(first.dateLabel || "");
    const excerpt = escapeHtml(first.excerpt || "");
    const url = escapeHtml(first.url || "blog.html");
    const image = escapeHtml(first.image || "");

    featured.innerHTML = `
      <div class="group relative bg-white dark:bg-surface-dark rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-xl transition-all duration-300 hover:shadow-primary/10 hover:border-primary/30">
        <div class="grid md:grid-cols-2 gap-0">
          <div class="h-64 md:h-full bg-gray-900 relative overflow-hidden">
            <img alt="${title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100" src="${image}"/>
            <div class="absolute inset-0 bg-gradient-to-t from-surface-dark/90 to-transparent md:bg-gradient-to-r"></div>
            <div class="absolute top-4 left-4">
              <span class="bg-primary text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">${escapeHtml(first.tag || "Destacado")}</span>
            </div>
          </div>
          <div class="p-8 md:p-12 flex flex-col justify-center">
            <div class="flex items-center gap-2 text-primary text-sm font-semibold mb-3">
              <span class="material-icons-outlined text-base">calendar_today</span>
              <time>${dateLabel}</time>
            </div>
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-primary transition-colors">${title}</h2>
            <p class="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">${excerpt}</p>
            <a class="inline-flex items-center text-primary font-bold hover:text-primary-dark transition-colors gap-1 group/link" href="${url}">
              Leer artículo completo
              <span class="material-icons-outlined text-lg transition-transform group-hover/link:translate-x-1">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }

  if (grid) {
    const items = rest.length ? rest : [];
    grid.innerHTML = items
      .map((p) => {
        const title = escapeHtml(p.title || "");
        const dateLabel = escapeHtml(p.dateLabel || "");
        const readTime = escapeHtml(p.readTime || "");
        const excerpt = escapeHtml(p.excerpt || "");
        const url = escapeHtml(p.url || "blog.html");
        const tag = escapeHtml(p.tag || "Noticia");

        const hasImage = Boolean(p.image);
        const imgHtml = hasImage
          ? `<img alt="${title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="${escapeHtml(p.image)}"/>`
          : `<div class="h-48 overflow-hidden relative bg-gray-900 flex items-center justify-center"><span class="material-icons-outlined text-6xl text-gray-700 group-hover:text-primary transition-colors duration-500">article</span></div>`;

        return `
          <article class="flex flex-col bg-white dark:bg-surface-dark rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group">
            <div class="h-48 overflow-hidden relative">
              <div class="absolute top-3 right-3 z-10">
                <span class="bg-black/60 backdrop-blur text-gray-100 text-xs font-medium px-2.5 py-1 rounded border border-white/10">${tag}</span>
              </div>
              ${imgHtml}
            </div>
            <div class="p-6 flex-1 flex flex-col">
              <div class="flex items-center justify-between mb-3">
                <span class="text-primary text-sm font-medium">${dateLabel}</span>
                <span class="text-gray-400 text-xs flex items-center gap-1"><span class="material-icons-outlined text-sm">schedule</span> ${readTime}</span>
              </div>
              <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary transition-colors">${title}</h3>
              <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-grow line-clamp-3">${excerpt}</p>
              <div class="mt-auto pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-end">
                <a class="text-primary hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-primary/20" href="${url}">
                  <span class="material-icons-outlined">arrow_forward</span>
                </a>
              </div>
            </div>
          </article>
        `;
      })
      .join("");
  }
}

function enableSearch(posts) {
  const input = document.getElementById("pp-news-search");
  if (!input) return;

  const doFilter = () => {
    const q = String(input.value || "").trim().toLowerCase();
    if (!q) {
      renderBlog(posts);
      return;
    }

    const filtered = posts.filter((p) => {
      const hay = `${p.title || ""} ${p.excerpt || ""} ${p.tag || ""}`.toLowerCase();
      return hay.includes(q);
    });

    renderBlog(filtered);
  };

  input.addEventListener("input", doFilter);
}

function setupMobileOptimizations() {
  // Mejorar interactividad en móviles
  const articles = document.querySelectorAll("article");
  
  articles.forEach((article) => {
    // Agregar feedback táctil visual
    article.addEventListener("touchstart", () => {
      article.style.transform = "scale(0.98)";
      article.style.opacity = "0.9";
    }, { passive: true });

    article.addEventListener("touchend", () => {
      article.style.transform = "scale(1)";
      article.style.opacity = "1";
    }, { passive: true });

    // Evitar que el hover de desktop interfiera con móvil
    if (!window.matchMedia("(hover: hover)").matches) {
      article.style.cursor = "pointer";
    }
  });

  // Optimizar búsqueda para móvil
  const searchInput = document.querySelector("input[type='search'], input[placeholder*='Buscar']");
  if (searchInput) {
    searchInput.addEventListener("focus", () => {
      // Hacer scroll suave al input en móvil
      if (window.innerWidth < 768) {
        setTimeout(() => {
          searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    });
  }
}

async function init() {
  try {
    const posts = await loadNews();
    renderHome(posts);
    renderBlog(posts);
    enableSearch(posts);
    setupMobileOptimizations();
  } catch (e) {
    // Si falla la carga, no rompemos la página.
    // eslint-disable-next-line no-console
    console.warn("[PixelPlay] No se pudieron cargar noticias:", e);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}


