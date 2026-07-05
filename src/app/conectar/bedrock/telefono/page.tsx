import Link from "next/link";
import { CopyField } from "@/components/CopyField";
import { bedrockAddress, siteConfig } from "@/lib/config";

export const metadata = { title: "Bedrock · Teléfono" };

export default function BedrockTelefonoPage() {
  const addr = bedrockAddress();
  const deepLink = `minecraft://?addExternalServer=PixelPlay|${siteConfig.bedrock.host}|${siteConfig.bedrock.port}`;

  return (
    <main className="wrap connect-page">
      <Link href="/conectar/bedrock" className="back-link">
        ← Bedrock
      </Link>
      <h1 className="page-title">Bedrock · Celular</h1>
      <CopyField value={addr} label="Copiar servidor" />
      <a className="btn btn-primary connect-open-game" href={deepLink}>
        Abrir Minecraft
      </a>
      <ol className="sheet-steps connect-page-steps">
        <li>Copiá la dirección o tocá &quot;Abrir Minecraft&quot;</li>
        <li>Minecraft → Servidores → Agregar servidor</li>
        <li>Servidor: {siteConfig.bedrock.host}</li>
        <li>Puerto: {siteConfig.bedrock.port}</li>
      </ol>
    </main>
  );
}
