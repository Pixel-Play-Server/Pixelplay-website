import Link from "next/link";
import { CopyField } from "@/components/CopyField";
import { bedrockAddress, siteConfig } from "@/lib/config";

export const metadata = { title: "Bedrock · Switch" };

export default function BedrockSwitchPage() {
  return (
    <main className="wrap connect-page">
      <Link href="/conectar/bedrock" className="back-link">
        ← Bedrock
      </Link>
      <h1 className="page-title">Bedrock · Nintendo Switch</h1>
      <CopyField value={bedrockAddress()} label="Copiar servidor" />
      <ol className="sheet-steps connect-page-steps">
        <li>Minecraft → Jugar → Servidores → Agregar servidor</li>
        <li>Dirección: {siteConfig.bedrock.host} · Puerto: {siteConfig.bedrock.port}</li>
        <li>Necesitás Nintendo Switch Online para jugar online</li>
      </ol>
    </main>
  );
}
