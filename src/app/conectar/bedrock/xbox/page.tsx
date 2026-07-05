import Link from "next/link";
import { CopyField } from "@/components/CopyField";
import { siteConfig } from "@/lib/config";

export const metadata = { title: "Bedrock · Xbox" };

export default function BedrockXboxPage() {
  const user = siteConfig.bedrock.xboxUser;

  return (
    <main className="wrap connect-page">
      <Link href="/conectar/bedrock" className="back-link">
        ← Bedrock
      </Link>
      <h1 className="page-title">Bedrock · Xbox</h1>
      <CopyField value={user} label="Copiar usuario" />
      <ol className="sheet-steps connect-page-steps">
        <li>Minecraft → Jugar → Amigos</li>
        <li>Buscá o agregá al jugador {user}</li>
        <li>También podés agregar servidor: {siteConfig.bedrock.host} puerto {siteConfig.bedrock.port}</li>
      </ol>
    </main>
  );
}
