import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Launcher Windows",
  description:
    "Descargá el instalador NSIS oficial del Pixel Play Launcher para Windows.",
};

const SETUP_URL = "https://launcher.pixelplay.gg/dl/PixelPlaySetup.exe";
const MIRROR_URL =
  "https://panel.pixelplay.gg/dl/pixelplay/releases-v2/windows-x86_64/6.0.2/pixelplay-launcher-amd64-installer.exe";

export default function WindowsLauncherPage() {
  return (
    <main className="wrap">
      <section className="hero">
        <div className="badge">
          <span className="dot" />
          Windows · NSIS
        </div>
        <h1>
          PIXEL PLAY
          <br />
          <em>LAUNCHER</em>
        </h1>
        <p>
          Instalador oficial para Windows (<strong>PixelPlaySetup.exe</strong>).
          Instalás una vez y el launcher se actualiza solo.
        </p>

        <div className="hero-actions" style={{ marginTop: "1.25rem", display: "flex", flexWrap: "wrap", gap: "0.65rem" }}>
          <a className="btn btn-primary" href={SETUP_URL}>
            Descargar instalador
          </a>
          <a className="btn btn-ghost" href={MIRROR_URL}>
            Mirror panel
          </a>
          <Link className="btn btn-ghost" href="https://launcher.pixelplay.gg">
            Otras plataformas
          </Link>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">Qué incluye</h2>
        <div className="grid-3">
          <article className="card card--static">
            <span className="material-symbols-outlined icon-green">download</span>
            <h3>NSIS setup</h3>
            <p>Instalador ~43 MB. Scope de usuario, sin admin obligatorio.</p>
          </article>
          <article className="card card--static">
            <span className="material-symbols-outlined icon-green">sync</span>
            <h3>Auto-update</h3>
            <p>Las actualizaciones usan el .exe drop-in, no el instalador.</p>
          </article>
          <article className="card card--static">
            <span className="material-symbols-outlined icon-green">sports_esports</span>
            <h3>Mods Pixel</h3>
            <p>Perfiles, packs .ppack y cuenta Pixel Play integrados.</p>
          </article>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">Cómo instalar</h2>
        <ol className="affiliate-ol">
          <li>Descargá <strong>PixelPlaySetup.exe</strong>.</li>
          <li>Ejecutá el instalador y seguí los pasos.</li>
          <li>Abrí Pixel Play desde el menú Inicio o el escritorio.</li>
        </ol>
        <p style={{ marginTop: "1rem", fontSize: "0.72rem", color: "var(--dim)" }}>
          Link directo:{" "}
          <a href={SETUP_URL} style={{ color: "var(--green)" }}>
            {SETUP_URL}
          </a>
        </p>
      </section>
    </main>
  );
}
