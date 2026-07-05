import Link from "next/link";
import { siteConfig } from "@/lib/config";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="foot">
      <p>
        © {year} {siteConfig.name} · No afiliado a Mojang AB
      </p>
      <div className="foot-links">
        <Link href="/blog">Blog</Link>
        <Link href="/wiki">Wiki</Link>
        <Link href="/soporte">Soporte</Link>
        <a href={siteConfig.discord} target="_blank" rel="noopener noreferrer">
          Discord
        </a>
      </div>
    </footer>
  );
}
