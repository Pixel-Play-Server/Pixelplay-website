/* global window, document, fetch */

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function padId(id) {
  const s = String(id || "").trim();
  // Si te pasan "1" -> "0001"
  if (/^\d+$/.test(s) && s.length < 4) return s.padStart(4, "0");
  return s;
}

async function fetchJson(path) {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = html;
}

function setBgImage(id, imageUrl) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!imageUrl) {
    el.style.backgroundImage = "none";
    return;
  }
  el.style.backgroundImage = `url("${imageUrl}")`;
}

async function loadPostById(id) {
  const index = await fetchJson("assets/data/posts/index.json");
  const posts = Array.isArray(index.posts) ? index.posts : [];
  const meta = posts.find((p) => p && p.id === id);
  if (!meta || !meta.contentPath) throw new Error("Post no encontrado");

  const post = await fetchJson(meta.contentPath);
  return { meta, post };
}

function setupMobileOptimizations() {
  // Optimizar contenido para lectura en móvil
  const contentElement = document.getElementById("pp-post-content");
  if (contentElement) {
    // Mejorar tabla responsiva
    const tables = contentElement.querySelectorAll("table");
    tables.forEach((table) => {
      if (!table.parentElement.classList.contains("table-responsive")) {
        const wrapper = document.createElement("div");
        wrapper.className = "table-responsive";
        wrapper.style.overflowX = "auto";
        wrapper.style.marginBottom = "1.5rem";
        wrapper.style.borderRadius = "0.5rem";
        table.parentElement.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });

    // Mejorar legibilidad de código en móvil
    const codeBlocks = contentElement.querySelectorAll("pre, code");
    codeBlocks.forEach((block) => {
      block.style.fontSize = "clamp(12px, 2vw, 14px)";
      block.style.overflowX = "auto";
      block.style.WebkitOverflowScrolling = "touch";
    });

    // Hacer imágenes responsive
    const images = contentElement.querySelectorAll("img");
    images.forEach((img) => {
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.display = "block";
      img.style.margin = "1rem auto";
      img.loading = "lazy"; // Lazy loading nativo
    });
  }

  // Mejorar navegación de artículos en móvil
  if (window.innerWidth < 768) {
    const heroImage = document.getElementById("pp-post-hero-image");
    if (heroImage) {
      heroImage.style.height = "250px"; // Reducir altura en móvil
    }
  }
}

async function init() {
  const rawId = getParam("id");
  const id = padId(rawId);
  if (!id) {
    setText("pp-post-title", "Publicación no encontrada");
    setText("pp-post-meta", "Falta el parámetro ?id= (por ejemplo ?id=0001)");
    return;
  }

  try {
    const { meta, post } = await loadPostById(id);

    document.title = `${post.title || meta.title || "Publicación"} - PixelPlay`;

    setText("pp-post-title", post.title || meta.title || "");
    setText(
      "pp-post-meta",
      `${post.dateLabel || meta.dateLabel || ""} • ${post.readTime || meta.readTime || ""} • ${post.author || meta.author || ""}`
    );
    setText("pp-post-tag", post.tag || meta.tag || "Publicación");
    setBgImage("pp-post-hero-image", post.image || meta.image || "");

    const excerpt = escapeHtml(post.excerpt || meta.excerpt || "");
    setHtml("pp-post-excerpt", excerpt ? `<p>${excerpt}</p>` : "");

    // El contenido ya viene como HTML "seguro" porque es tuyo (JSON del repo).
    setHtml("pp-post-content", String(post.contentHtml || ""));
    
    // Optimizar para móvil después de cargar el contenido
    setupMobileOptimizations();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[PixelPlay] Error cargando post:", e);
    if (window.location.protocol === "file:") {
      setText("pp-post-title", "No se puede cargar en modo archivo");
      setText(
        "pp-post-meta",
        "Abriste el .html con file:// y el navegador bloquea leer JSON. Usá un servidor local (Live Server) o subilo a GitHub Pages."
      );
    } else {
      setText("pp-post-title", "Publicación no encontrada");
      setText("pp-post-meta", `No pudimos cargar la publicación ${id}.`);
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}


