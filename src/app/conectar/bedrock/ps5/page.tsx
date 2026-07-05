import Link from "next/link";
import { CopyField } from "@/components/CopyField";
import { bedrockAddress, siteConfig } from "@/lib/config";

export const metadata = { title: "Bedrock · PlayStation" };

export default function BedrockPs5Page() {
  return (
    <main className="wrap connect-page">
      <Link href="/conectar/bedrock" className="back-link">
        ← Bedrock
      </Link>
      <h1 className="page-title">Bedrock · PlayStation</h1>
      <CopyField value={bedrockAddress()} label="Copiar servidor" />
      <ol className="sheet-steps connect-page-steps">
        <li>Minecraft → Jugar → Servidores → Agregar servidor</li>
        <li>Dirección: {siteConfig.bedrock.host}</li>
        <li>Puerto: {siteConfig.bedrock.port}</li>
      </ol>
    </main>
  );
}
