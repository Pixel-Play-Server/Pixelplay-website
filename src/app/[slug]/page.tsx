import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CopyField } from "@/components/CopyField";
import { AffiliateClaim } from "@/components/AffiliateClaim";
import {
  affiliateSlugs,
  displayName,
  getAffiliate,
} from "@/lib/affiliates";
import { siteConfig } from "@/lib/config";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return affiliateSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const af = getAffiliate(slug);
  if (!af) return { title: "Afiliado" };
  const name = displayName(af);
  return {
    title: `${name} · Stream afiliado`,
    description: `Entrá a PixelPlay desde el stream de ${name} y ambos reciben 1 día de Pixel+.`,
  };
}

export default async function AffiliatePage({ params }: Props) {
  const { slug } = await params;
  const af = getAffiliate(slug);
  if (!af) notFound();

  const name = displayName(af);
  const skin = `https://mc-heads.net/body/${encodeURIComponent(af.minecraft)}/180`;
  const avatar = `https://mc-heads.net/avatar/${encodeURIComponent(af.minecraft)}/64`;

  return (
    <main className="wrap">
      <section className="hero affiliate-hero">
        <div className="badge">
          <span className="dot" />
          Stream afiliado
        </div>
        <div className="affiliate-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="affiliate-skin"
            src={skin}
            alt={`Skin de ${name}`}
            width={120}
            height={270}
          />
          <div>
            <p className="affiliate-kicker">Invitado por</p>
            <h1 className="affiliate-title">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatar} alt="" width={40} height={40} />
              {name}
            </h1>
            <p>
              Cada jugador nuevo que entre con este link le regala{" "}
              <strong>1 día de Pixel+</strong> a <strong>{name}</strong> y se
              queda con <strong>1 día de Pixel+</strong> también.
            </p>
          </div>
        </div>

        <div className="affiliate-steps panel">
          <h2 className="section-title">Cómo funciona</h2>
          <ol className="affiliate-ol">
            <li>Copiá la IP y entrá al server (Java o Bedrock).</li>
            <li>Escribí tu nick abajo y tocá reclamar.</li>
            <li>Listo: Pixel+ por 1 día para vos y para {name}.</li>
          </ol>
        </div>

        <div className="panel">
          <h2 className="section-title">IP del server</h2>
          <CopyField value={siteConfig.java.host} label="Copiar IP Java" />
          <p className="affiliate-bedrock">
            Bedrock: <strong>{siteConfig.bedrock.host}:{siteConfig.bedrock.port}</strong>
          </p>
        </div>

        <div className="panel">
          <h2 className="section-title">Reclamar recompensa</h2>
          <AffiliateClaim affiliateSlug={af.slug} streamerName={name} />
        </div>

        {(af.twitch || af.kick || af.youtube) && (
          <div className="affiliate-links">
            {af.twitch ? (
              <a className="btn btn-ghost" href={af.twitch} target="_blank" rel="noopener noreferrer">
                Twitch
              </a>
            ) : null}
            {af.kick ? (
              <a className="btn btn-ghost" href={af.kick} target="_blank" rel="noopener noreferrer">
                Kick
              </a>
            ) : null}
            {af.youtube ? (
              <a className="btn btn-ghost" href={af.youtube} target="_blank" rel="noopener noreferrer">
                YouTube
              </a>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
