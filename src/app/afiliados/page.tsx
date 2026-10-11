import Link from "next/link";
import { displayName, getAffiliates } from "@/lib/affiliates";

export const metadata = {
  title: "Afiliados stream",
  description: "Streamers de PixelPlay: compartí tu link y ganá Pixel+ por cada invitado.",
};

export default function AffiliatesIndexPage() {
  const list = getAffiliates();

  return (
    <main className="wrap">
      <section className="hero">
        <div className="badge">
          <span className="dot" />
          PixelStream
        </div>
        <h1>
          AFILIADOS
          <br />
          <em>STREAM</em>
        </h1>
        <p>
          Cada usuario nuevo que se meta con tu link te da a vos y a él{" "}
          <strong>1 día de Pixel+</strong>.
        </p>
      </section>

      <section className="panel">
        <h2 className="section-title">Streamers</h2>
        <div className="grid-3">
          {list.map((af) => {
            const name = displayName(af);
            const slug = af.slug.toLowerCase();
            return (
              <Link key={slug} className="card" href={`/${slug}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://mc-heads.net/avatar/${encodeURIComponent(af.minecraft)}/48`}
                  alt=""
                  width={48}
                  height={48}
                  style={{ imageRendering: "pixelated", borderRadius: 2 }}
                />
                <h3 style={{ marginTop: "0.75rem" }}>{name}</h3>
                <p>pixelplay.gg/{slug}</p>
                <span className="cta">Ver página →</span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
