import { siteConfig } from "@/lib/config";

/** Barra inferior — links a modales CSS (:target) */
export function MobileShell() {
  return (
    <nav className="dock" aria-label="Conectar al servidor">
      <a className="btn btn-ghost" href="#connect-java">
        Java
      </a>
      <a className="btn btn-ghost" href="#connect-bedrock">
        Bedrock
      </a>
      <a
        className="btn btn-primary"
        href={siteConfig.discord}
        target="_blank"
        rel="noopener noreferrer"
      >
        Discord
      </a>
    </nav>
  );
}
