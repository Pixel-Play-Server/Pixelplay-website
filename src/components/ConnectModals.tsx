import { CopyField } from "@/components/CopyField";
import { bedrockAddress, siteConfig } from "@/lib/config";

const PLATFORMS = [
  { hash: "connect-bedrock-phone", label: "Teléfono / Tablet", icon: "📱" },
  { hash: "connect-bedrock-windows", label: "PC · Bedrock Windows", icon: "🖥️" },
  { hash: "connect-bedrock-xbox", label: "Xbox", icon: "🎯" },
  { hash: "connect-bedrock-ps5", label: "PlayStation", icon: "🎮" },
  { hash: "connect-bedrock-switch", label: "Nintendo Switch", icon: "🕹️" },
] as const;

const deepLink = `minecraft://?addExternalServer=PixelPlay|${siteConfig.bedrock.host}|${siteConfig.bedrock.port}`;
const bedrockAddr = bedrockAddress();

function ModalClose() {
  return (
    <a href="#" className="sheet-close" aria-label="Cerrar">
      ×
    </a>
  );
}

function ModalBackdrop() {
  return <a href="#" className="fake-modal-backdrop" aria-label="Cerrar" tabIndex={-1} />;
}

/** Modales CSS (:target) — sin JS para abrir/cerrar, funcionan en Safari iOS */
export function ConnectModals() {
  const { host, port, xboxUser } = siteConfig.bedrock;
  const javaHost = siteConfig.java.host;

  return (
    <>
      <div id="connect-java" className="fake-modal" role="dialog" aria-labelledby="connect-java-title">
        <ModalBackdrop />
        <div className="fake-modal-sheet sheet">
          <ModalClose />
          <h2 id="connect-java-title" className="sheet-title">
            Java · Solo PC
          </h2>
          <p className="sheet-sub">
            Java Edition no corre en el teléfono. Copiá la IP para usarla en PC o Mac.
          </p>
          <CopyField value={javaHost} label="Copiar IP" />
          <ol className="sheet-steps">
            <li>Minecraft Java → Multijugador → Agregar servidor</li>
            <li>Versiones: {siteConfig.java.versions}</li>
          </ol>
        </div>
      </div>

      <div id="connect-bedrock" className="fake-modal" role="dialog" aria-labelledby="connect-bedrock-title">
        <ModalBackdrop />
        <div className="fake-modal-sheet sheet">
          <ModalClose />
          <h2 id="connect-bedrock-title" className="sheet-title">
            ¿Dónde jugás Bedrock?
          </h2>
          <p className="sheet-sub">Elegí tu plataforma y te mostramos cómo entrar.</p>
          <div className="sheet-grid">
            {PLATFORMS.map((p) => (
              <a key={p.hash} href={`#${p.hash}`} className="sheet-option sheet-option--link">
                <span className="sheet-option-icon">{p.icon}</span>
                <span>{p.label}</span>
              </a>
            ))}
          </div>
          <p className="sheet-foot">
            {host}:{port}
          </p>
        </div>
      </div>

      <div id="connect-bedrock-phone" className="fake-modal" role="dialog">
        <ModalBackdrop />
        <div className="fake-modal-sheet sheet">
          <ModalClose />
          <h2 className="sheet-title">Bedrock · Celular / Tablet</h2>
          <CopyField value={bedrockAddr} label="Copiar servidor" />
          <a className="btn btn-primary connect-open-game" href={deepLink}>
            Abrir Minecraft
          </a>
          <ol className="sheet-steps">
            <li>Minecraft → Servidores → Agregar servidor</li>
            <li>Servidor: {host} · Puerto: {port}</li>
          </ol>
          <a href="#connect-bedrock" className="btn btn-ghost sheet-back">
            Cambiar plataforma
          </a>
        </div>
      </div>

      <div id="connect-bedrock-windows" className="fake-modal" role="dialog">
        <ModalBackdrop />
        <div className="fake-modal-sheet sheet">
          <ModalClose />
          <h2 className="sheet-title">Bedrock · Windows</h2>
          <CopyField value={bedrockAddr} label="Copiar servidor" />
          <a className="btn btn-ghost connect-open-game" href={deepLink}>
            Abrir Minecraft Bedrock
          </a>
          <ol className="sheet-steps">
            <li>Edición Bedrock (Microsoft Store o Launcher), no Java</li>
            <li>Jugar → Servidores → Agregar servidor</li>
            <li>{host} · puerto {port}</li>
          </ol>
          <a href="#connect-bedrock" className="btn btn-ghost sheet-back">
            Cambiar plataforma
          </a>
        </div>
      </div>

      <div id="connect-bedrock-xbox" className="fake-modal" role="dialog">
        <ModalBackdrop />
        <div className="fake-modal-sheet sheet">
          <ModalClose />
          <h2 className="sheet-title">Bedrock · Xbox</h2>
          <CopyField value={xboxUser} label="Copiar usuario" />
          <ol className="sheet-steps">
            <li>Minecraft → Jugar → Amigos</li>
            <li>Buscá o agregá a {xboxUser}</li>
            <li>Servidor externo: {host} · {port}</li>
          </ol>
          <a href="#connect-bedrock" className="btn btn-ghost sheet-back">
            Cambiar plataforma
          </a>
        </div>
      </div>

      <div id="connect-bedrock-ps5" className="fake-modal" role="dialog">
        <ModalBackdrop />
        <div className="fake-modal-sheet sheet">
          <ModalClose />
          <h2 className="sheet-title">Bedrock · PlayStation</h2>
          <CopyField value={bedrockAddr} label="Copiar servidor" />
          <ol className="sheet-steps">
            <li>Minecraft → Jugar → Servidores → Agregar servidor</li>
            <li>{host} · puerto {port}</li>
          </ol>
          <a href="#connect-bedrock" className="btn btn-ghost sheet-back">
            Cambiar plataforma
          </a>
        </div>
      </div>

      <div id="connect-bedrock-switch" className="fake-modal" role="dialog">
        <ModalBackdrop />
        <div className="fake-modal-sheet sheet">
          <ModalClose />
          <h2 className="sheet-title">Bedrock · Nintendo Switch</h2>
          <CopyField value={bedrockAddr} label="Copiar servidor" />
          <ol className="sheet-steps">
            <li>Minecraft → Jugar → Servidores → Agregar servidor</li>
            <li>{host} · puerto {port}</li>
            <li>Necesitás Nintendo Switch Online</li>
          </ol>
          <a href="#connect-bedrock" className="btn btn-ghost sheet-back">
            Cambiar plataforma
          </a>
        </div>
      </div>
    </>
  );
}
