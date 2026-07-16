import Link from "next/link";
import { ConnectSection } from "@/components/ConnectSection";
import { getAllPosts } from "@/lib/posts";
import { siteConfig } from "@/lib/config";

export default function HomePage() {
  const posts = getAllPosts().slice(0, 3);

  return (
    <main className="wrap">
      <section className="hero">
        <div className="badge">
          <span className="dot" />
          Cierre temporal
        </div>
        <h1>
          MINECRAFT
          <br />
          <em>SURVIVAL PVP</em>
        </h1>
        <p>
          Estamos renovando PixelPlay. Leé el anuncio del blog y seguinos en Discord.
        </p>

        <ConnectSection />

        <div className="hero-actions hero-actions--solo">
          <a
            className="btn btn-ghost"
            href={siteConfig.discord}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="material-symbols-outlined">chat</span>
            Discord
          </a>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">Cómo entrar</h2>
        <div className="grid-3">
          <article className="card card--static">
            <span className="material-symbols-outlined icon-green">sports_esports</span>
            <h3>Java</h3>
            <p>
              Multijugador → agregar servidor → <strong>{siteConfig.java.host}</strong>
            </p>
          </article>
          <article className="card card--static">
            <span className="material-symbols-outlined icon-green">phone_android</span>
            <h3>Bedrock</h3>
            <p>
              Servidores → <strong>{siteConfig.bedrock.host}</strong> puerto{" "}
              <strong>{siteConfig.bedrock.port}</strong>
            </p>
          </article>
          <article className="card card--static">
            <span className="material-symbols-outlined icon-green">stadia_controller</span>
            <h3>Xbox / PE</h3>
            <p>
              También podés usar el usuario <strong>{siteConfig.bedrock.xboxUser}</strong>
            </p>
          </article>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">Enlaces</h2>
        <div className="grid-3">
          <a className="card" href={siteConfig.discord} target="_blank" rel="noopener noreferrer">
            <span className="material-symbols-outlined icon-green">chat</span>
            <h3>Discord</h3>
            <p>Comunidad y avisos.</p>
            <span className="cta">Entrar ↗</span>
          </a>
          <a className="card" href={siteConfig.tienda} target="_blank" rel="noopener noreferrer">
            <span className="material-symbols-outlined icon-green">shopping_bag</span>
            <h3>Tienda</h3>
            <p>Praktico Shop.</p>
            <span className="cta">praktico.shop ↗</span>
          </a>
          <Link className="card" href="/wiki">
            <span className="material-symbols-outlined icon-green">menu_book</span>
            <h3>Wiki</h3>
            <p>Reglas y guías.</p>
            <span className="cta">Ver wiki →</span>
          </Link>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2 className="section-title section-title--inline">Blog</h2>
          <Link href="/blog" className="panel-link">
            Ver todo →
          </Link>
        </div>
        <div className="grid-3">
          {posts.map((p) => (
            <Link key={p.id} href={`/blog/${p.id}`} className="news-card">
              {p.image ? (
                <div className="thumb" style={{ backgroundImage: `url(${p.image})` }} />
              ) : (
                <div className="thumb" />
              )}
              <div className="body">
                <div className="tag">{p.tag}</div>
                <h3>{p.title}</h3>
                <div className="meta">{p.dateLabel}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
