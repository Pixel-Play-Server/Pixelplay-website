/* global window, document, fetch, AbortController */

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
}

function getServerHost() {
  const el = document.querySelector("[data-pp-server-host]");
  if (el && el.getAttribute("data-pp-server-host")) {
    return el.getAttribute("data-pp-server-host");
  }

  const input = document.getElementById("pp-server-ip");
  if (input && input.value) return String(input.value).trim();

  return "mc.pixelplay.gg";
}

async function fetchJson(url, timeoutMs) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  const start = window.performance && window.performance.now ? window.performance.now() : Date.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const end = window.performance && window.performance.now ? window.performance.now() : Date.now();
    return { json, elapsedMs: Math.max(0, end - start) };
  } finally {
    window.clearTimeout(timeout);
  }
}

async function getStatus(host) {
  // 1) mcstatus.io (suele devolver latency)
  try {
    const aRes = await fetchJson(
      `https://api.mcstatus.io/v2/status/java/${encodeURIComponent(host)}`,
      6500
    );
    const a = aRes.json;
    return {
      online: Boolean(a.online),
      playersOnline:
        typeof a.players?.online === "number" ? a.players.online : null,
      // En navegador no existe "ping" real al server de Minecraft.
      // Mostramos el RTT desde el usuario a la API de estado (aprox. "tu conexión").
      latency: Math.round(aRes.elapsedMs),
    };
  } catch (_) {
    // fallback
  }

  // 2) mcsrvstat.us (muy popular y simple)
  const bRes = await fetchJson(
    `https://api.mcsrvstat.us/2/${encodeURIComponent(host)}`,
    6500
  );
  const b = bRes.json;
  return {
    online: Boolean(b.online),
    playersOnline:
      typeof b.players?.online === "number" ? b.players.online : null,
    latency: Math.round(bRes.elapsedMs),
  };
}

async function init() {
  const host = getServerHost();

  // placeholders
  setText("pp-online-players", "—");
  setText("pp-status-text", "Cargando…");

  try {
    const s = await getStatus(host);
    setText("pp-online-players", s.playersOnline ?? "—");
  setText("pp-status-text", s.online ? "En línea" : "Fuera de línea");
  } catch (e) {
    setText("pp-status-text", "Sin datos");
    // eslint-disable-next-line no-console
    console.warn("[PixelPlay] Error consultando estado del servidor:", e);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}


