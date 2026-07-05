import { ConnectSection } from "@/components/ConnectSection";
import { siteConfig } from "@/lib/config";

export const metadata = { title: "Wiki" };

const faqs = [
  {
    q: "¿IP Java?",
    a: `${siteConfig.java.host} · versiones ${siteConfig.java.versions}.`,
  },
  {
    q: "¿IP Bedrock?",
    a: `${siteConfig.bedrock.host} puerto ${siteConfig.bedrock.port}. Usuario Xbox/PE: ${siteConfig.bedrock.xboxUser}.`,
  },
  {
    q: "¿Qué modalidad hay?",
    a: "Survival PvP activo. SkyBlock y minijuegos están en desarrollo.",
  },
  {
    q: "¿Hay reglas?",
    a: "Sí: no hacks, respeto a la comunidad, no grief excesivo en bases protegidas. Detalle en Discord.",
  },
  {
    q: "¿Cómo reporto un problema?",
    a: "Ticket en Discord o página de Soporte.",
  },
];

export default function WikiPage() {
  return (
    <main className="wrap">
      <h1 className="page-title">Wiki</h1>
      <p className="page-sub">Java, Bedrock y lo básico de PixelPlay.</p>

      <section className="panel">
        <h2 className="section-title">Conectar</h2>
        <ConnectSection showStatus />
      </section>

      <section className="panel">
        <h2 className="section-title">Preguntas frecuentes</h2>
        {faqs.map((f) => (
          <div key={f.q} className="faq-item">
            <h3>{f.q}</h3>
            <p>{f.a}</p>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2 className="section-title">Modalidades</h2>
        <div className="grid-3">
          <article className="card card--static">
            <h3>Survival PvP</h3>
            <p>Modo principal. PvP activo, economía y comunidad.</p>
            <span className="cta cta--active">Activo</span>
          </article>
          <article className="card card--static">
            <h3>SkyBlock</h3>
            <p>Islas, misiones y progresión.</p>
            <span className="cta">Próximamente</span>
          </article>
          <article className="card card--static">
            <h3>Minijuegos</h3>
            <p>BedWars, SkyWars y más.</p>
            <span className="cta">En planificación</span>
          </article>
        </div>
      </section>
    </main>
  );
}
