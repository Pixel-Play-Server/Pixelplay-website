/* global window, document */

function getCurrentPage() {
  const el = document.querySelector("[data-pp-page]");
  return el ? String(el.getAttribute("data-pp-page") || "") : "";
}

function navLink(href, label, isActive) {
  const base =
    "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const active =
    "text-[#4ade80] font-bold relative after:content-[''] after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-[#4ade80] after:rounded-full";
  const inactive =
    "text-gray-600 dark:text-gray-400 hover:text-[#4ade80]";
  return `<a class="${base} ${isActive ? active : inactive}" href="${href}">${label}</a>`;
}

function renderNav() {
  const host = document.getElementById("pp-shell-nav");
  if (!host) return;

  const page = getCurrentPage();

  host.innerHTML = `
    <nav class="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-black/80 border-b border-gray-200 dark:border-white/10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          <a class="flex items-center gap-2" href="index.html" aria-label="PixelPlay - Inicio">
            <span class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Pixel<span class="text-[#4ade80]">Play</span>
            </span>
          </a>

          <div class="hidden md:block">
            <div class="ml-10 flex items-baseline space-x-2">
              ${navLink("index.html", "Inicio", page === "home")}
              ${navLink("blog.html", "Blog", page === "blog")}
              ${navLink("wiki.html", "Wiki", page === "wiki")}
              ${navLink("soporte.html", "Soporte", page === "soporte")}
            </div>
          </div>

          <div class="hidden md:block">
            <a class="bg-[#4ade80] hover:bg-[#22c55e] text-black font-bold py-2 px-5 rounded-lg transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(74,222,128,0.3)]" href="index.html">
              Jugar ahora
            </a>
          </div>

          <div class="-mr-2 flex md:hidden">
            <button class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none" type="button" aria-label="Menú">
              <span class="material-icons-outlined">menu</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  `;
}

function renderFooter() {
  const host = document.getElementById("pp-shell-footer");
  if (!host) return;

  host.innerHTML = `
    <footer class="bg-white dark:bg-black border-t border-gray-200 dark:border-white/10 pt-10 pb-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <p class="text-center md:text-left">
            © 2025 PixelPlay. No estamos afiliados con Mojang Studios o Microsoft.
          </p>
          <div class="flex gap-6">
            <a class="hover:text-[#4ade80] transition-colors" href="blog.html">Blog</a>
            <a class="hover:text-[#4ade80] transition-colors" href="soporte.html">Soporte</a>
            <a class="hover:text-[#4ade80] transition-colors" href="https://discord.pixelplay.gg" target="_blank" rel="noreferrer">Discord</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

function hideLegacyChrome() {
  document.querySelectorAll("[data-pp-legacy-nav],[data-pp-legacy-footer]").forEach((el) => {
    el.style.display = "none";
  });
}

function init() {
  hideLegacyChrome();
  renderNav();
  renderFooter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}


