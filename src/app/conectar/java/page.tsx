import Link from "next/link";
import { CopyField } from "@/components/CopyField";
import { siteConfig } from "@/lib/config";

export const metadata = { title: "Conectar · Java" };

export default function ConectarJavaPage() {
  const host = siteConfig.java.host;

  return (
    <main className="wrap connect-page">
      <Link href="/" className="back-link">
        ← Inicio
      </Link>
      <h1 className="page-title">Java Edition</h1>
      <p className="page-sub">
        En el teléfono no podés jugar Java. Copiá la IP y usala en PC o Mac.
      </p>
      <CopyField value={host} label="Copiar IP" />
      <ol className="sheet-steps connect-page-steps">
        <li>Minecraft Java → Multijugador → Agregar servidor</li>
        <li>Pegá la IP: {host}</li>
        <li>Versiones compatibles: {siteConfig.java.versions}</li>
      </ol>
    </main>
  );
}
