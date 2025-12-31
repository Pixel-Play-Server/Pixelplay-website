/* global window, document */

function getNextAnniversaryDate() {
  // Aniversario: 20 de enero (apertura beta con invitación)
  const now = new Date();
  const year = now.getFullYear();
  const targetThisYear = new Date(year, 0, 20, 0, 0, 0, 0); // month 0 = enero

  if (now.getTime() <= targetThisYear.getTime()) return targetThisYear;
  return new Date(year + 1, 0, 20, 0, 0, 0, 0);
}

function renderCountdown() {
  const el = document.getElementById("pp-anniversary-timer");
  if (!el) return;

  const target = getNextAnniversaryDate();
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  el.textContent = `Faltan ${diffDays} días para el aniversario`;
}

function init() {
  renderCountdown();
  window.setInterval(renderCountdown, 60_000); // refresca cada minuto
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}


