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


