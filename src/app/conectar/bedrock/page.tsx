import Link from "next/link";
import { siteConfig } from "@/lib/config";

export const metadata = { title: "Conectar · Bedrock" };

const PLATFORMS = [
  { href: "/conectar/bedrock/telefono", label: "Teléfono / Tablet", icon: "📱" },
  { href: "/conectar/bedrock/windows", label: "PC · Bedrock Windows", icon: "🖥️" },
  { href: "/conectar/bedrock/xbox", label: "Xbox", icon: "🎯" },
  { href: "/conectar/bedrock/ps5", label: "PlayStation", icon: "🎮" },
  { href: "/conectar/bedrock/switch", label: "Nintendo Switch", icon: "🕹️" },
] as const;

export default function ConectarBedrockPage() {
  return (
    <main className="wrap connect-page">
      <Link href="/" className="back-link">
        ← Inicio
      </Link>
      <h1 className="page-title">Bedrock Edition</h1>
      <p className="page-sub">¿Dónde vas a jugar? Elegí tu plataforma.</p>
      <div className="sheet-grid connect-page-grid">
        {PLATFORMS.map((p) => (
          <Link key={p.href} href={p.href} className="sheet-option sheet-option--link">
            <span className="sheet-option-icon">{p.icon}</span>
            <span>{p.label}</span>
          </Link>
        ))}
      </div>
      <p className="sheet-foot">
        {siteConfig.bedrock.host}:{siteConfig.bedrock.port}
      </p>
    </main>
  );
}
