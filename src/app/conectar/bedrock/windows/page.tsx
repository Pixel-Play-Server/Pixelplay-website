import Link from "next/link";
import { CopyField } from "@/components/CopyField";
import { bedrockAddress, siteConfig } from "@/lib/config";

export const metadata = { title: "Bedrock · Windows" };

export default function BedrockWindowsPage() {
  const addr = bedrockAddress();
  const deepLink = `minecraft://?addExternalServer=PixelPlay|${siteConfig.bedrock.host}|${siteConfig.bedrock.port}`;

  return (
    <main className="wrap connect-page">
      <Link href="/conectar/bedrock" className="back-link">
        ← Bedrock
      </Link>
      <h1 className="page-title">Bedrock · Windows</h1>
      <CopyField value={addr} label="Copiar servidor" />
      <a className="btn btn-ghost connect-open-game" href={deepLink}>
        Abrir Minecraft Bedrock
      </a>
      <ol className="sheet-steps connect-page-steps">
        <li>Necesitás Minecraft Bedrock (Microsoft Store o Launcher), no Java</li>
        <li>Jugar → Servidores → Agregar servidor</li>
        <li>Servidor: {siteConfig.bedrock.host} · Puerto: {siteConfig.bedrock.port}</li>
      </ol>
    </main>
  );
}
