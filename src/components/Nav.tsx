"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/blog", label: "Blog" },
  { href: "/wiki", label: "Wiki" },
  { href: "/soporte", label: "Soporte" },
];

export function Nav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link className="logo" href="/">
          Pixel<span>Play</span>
        </Link>
        <nav className="nav-links" aria-label="Principal">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={isActive(l.href) ? "active" : ""}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <Link className="nav-play" href="#connect-java">
          Jugar
        </Link>
        <details className="nav-drawer">
          <summary className="menu-btn" aria-label="Menú">
            ☰
          </summary>
          <nav className="mobile-nav" aria-label="Menú móvil">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={isActive(l.href) ? "active" : ""}
              >
                {l.label}
              </Link>
            ))}
            <Link className="nav-play-mobile" href="#connect-java">
              Conectar
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
