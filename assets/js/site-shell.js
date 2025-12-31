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
            <button id="pp-mobile-menu-toggle" class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#4ade80]" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="pp-mobile-menu">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M4 6.5h16a1 1 0 0 0 0-2H4a1 1 0 1 0 0 2zm16 4.5H4a1 1 0 1 0 0 2h16a1 1 0 0 0 0-2zm0 6.5H4a1 1 0 1 0 0 2h16a1 1 0 0 0 0-2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Menú móvil -->
      <div id="pp-mobile-menu" class="hidden md:hidden bg-white/90 dark:bg-black/90 border-b border-gray-200 dark:border-white/10" role="navigation" aria-label="Menú de navegación móvil">
        <div class="px-2 pt-2 pb-3 space-y-1 max-w-7xl mx-auto">
          <a href="index.html" class="block px-3 py-2 rounded-md text-base font-medium ${page === "home" ? "text-[#4ade80] bg-gray-700/20" : "text-gray-600 dark:text-gray-400 hover:text-[#4ade80] hover:bg-gray-700/20"} transition-colors">Inicio</a>
          <a href="blog.html" class="block px-3 py-2 rounded-md text-base font-medium ${page === "blog" ? "text-[#4ade80] bg-gray-700/20" : "text-gray-600 dark:text-gray-400 hover:text-[#4ade80] hover:bg-gray-700/20"} transition-colors">Blog</a>
          <a href="wiki.html" class="block px-3 py-2 rounded-md text-base font-medium ${page === "wiki" ? "text-[#4ade80] bg-gray-700/20" : "text-gray-600 dark:text-gray-400 hover:text-[#4ade80] hover:bg-gray-700/20"} transition-colors">Wiki</a>
          <a href="soporte.html" class="block px-3 py-2 rounded-md text-base font-medium ${page === "soporte" ? "text-[#4ade80] bg-gray-700/20" : "text-gray-600 dark:text-gray-400 hover:text-[#4ade80] hover:bg-gray-700/20"} transition-colors">Soporte</a>
          <a href="index.html" class="block px-3 py-2 mt-2 bg-[#4ade80] hover:bg-[#22c55e] text-black font-bold rounded-lg transition-all text-center">Jugar ahora</a>
        </div>
      </div>
    </nav>
  `;

  // Agregar event listener para el toggle del menú móvil después de renderizar
  setupMobileMenuToggle();
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

function setupMobileMenuToggle() {
  const toggle = document.getElementById("pp-mobile-menu-toggle");
  const menu = document.getElementById("pp-mobile-menu");
  
  if (!toggle || !menu) return;
  // Evitar registrar listeners múltiples (esto hacía que en mobile el click “abra y cierre” en el mismo tap).
  if (toggle.dataset.ppBound === "true") return;
  toggle.dataset.ppBound = "true";

  // Toggle del menú
  toggle.addEventListener("click", () => {
    const isHidden = menu.classList.contains("hidden");
    if (isHidden) {
      menu.classList.remove("hidden");
      toggle.setAttribute("aria-expanded", "true");
    } else {
      menu.classList.add("hidden");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  // Cerrar menú cuando se hace click en un link
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.add("hidden");
      toggle.setAttribute("aria-expanded", "false");
    });
  });

  // Cerrar menú con tecla Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menu.classList.contains("hidden")) {
      menu.classList.add("hidden");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  // Cerrar menú cuando se cambia el tamaño de la ventana (si vuelve a md+)
  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768 && !menu.classList.contains("hidden")) {
      menu.classList.add("hidden");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

function hideLegacyChrome() {
  document.querySelectorAll("[data-pp-legacy-nav],[data-pp-legacy-footer]").forEach((el) => {
    el.style.display = "none";
  });
}

function setupTouchOptimizations() {
  // Mejorar touch events en botones y links
  const interactiveElements = document.querySelectorAll("a, button, [role='button']");
  interactiveElements.forEach((el) => {
    // Agregar feedback visual mejorado en dispositivos táctiles
    el.addEventListener("touchstart", () => {
      el.style.opacity = "0.8";
    }, { passive: true });

    el.addEventListener("touchend", () => {
      el.style.opacity = "1";
    }, { passive: true });
  });
}

function setupViewportOptimizations() {
  // Mejorar comportamiento en viewport pequeños
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport && !metaViewport.getAttribute("content").includes("viewport-fit")) {
    metaViewport.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover");
  }

  // Evitar scroll horizontal sin romper el scroll vertical (en mobile esto bloqueaba el “deslizar”).
  document.documentElement.style.overflowX = "hidden";
  document.body.style.overflowX = "hidden";
  document.body.style.overscrollBehaviorY = "contain";
}

function init() {
  hideLegacyChrome();
  renderNav();
  renderFooter();
  setupTouchOptimizations();
  setupViewportOptimizations();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}


