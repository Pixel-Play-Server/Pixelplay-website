import { bedrockAddress, siteConfig } from "@/lib/config";

export const metadata = { title: "Soporte" };

export default function SoportePage() {
  return (
    <main className="wrap">
      <h1 className="page-title">Soporte</h1>
      <p className="page-sub">¿Problemas para entrar o dudas? Acá te ayudamos.</p>

      <section className="panel">
        <h2 className="section-title">Contacto</h2>
        <div className="grid-2">
          <a className="card" href={siteConfig.discord} target="_blank" rel="noopener noreferrer">
            <span className="material-symbols-outlined icon-green">chat</span>
            <h3>Discord</h3>
            <p>La forma más rápida. Tickets y chat de la comunidad.</p>
            <span className="cta">discord.pixelplay.gg ↗</span>
          </a>
          <a className="card" href="mailto:support@pixelplay.gg">
            <span className="material-symbols-outlined icon-green">mail</span>
            <h3>Email</h3>
            <p>Para consultas formales o reportes.</p>
            <span className="cta">support@pixelplay.gg</span>
          </a>
        </div>
      </section>

      <section className="panel">
        <h2 className="section-title">Problemas comunes</h2>
        <div className="faq-item">
          <h3>No puedo conectar (Java)</h3>
          <p>
            Usá Minecraft <strong>Java</strong>, IP <strong>{siteConfig.java.host}</strong> y versión{" "}
            {siteConfig.java.versions}.
          </p>
        </div>
        <div className="faq-item">
          <h3>No puedo conectar (Bedrock)</h3>
          <p>
            En servidores agregá <strong>{bedrockAddress()}</strong> o buscá el usuario{" "}
            <strong>{siteConfig.bedrock.xboxUser}</strong> en amigos/servidores.
          </p>
        </div>
        <div className="faq-item">
          <h3>“Servidor no disponible”</h3>
          <p>
            Puede ser mantenimiento breve. Revisá Discord o probá de nuevo en unos minutos.
          </p>
        </div>
        <div className="faq-item">
          <h3>Reportar jugador</h3>
          <p>
            Ticket en Discord con nick, fecha y capturas. El staff revisa cada caso.
          </p>
        </div>
      </section>
    </main>
  );
}
