/* global window, document */

// Este archivo ya no se usa en la página principal
// Se mantiene para compatibilidad con posibles referencias antiguas
// El servidor está activo 24/7

function init() {
  // Servidor activo - no hay contador necesario
  console.log("PixelPlay server is online 24/7");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
