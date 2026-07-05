import { ServerStatus } from "@/components/ServerStatus";
import { CopyTextButton } from "@/components/CopyIpButton";
import { bedrockAddress, siteConfig } from "@/lib/config";

type Props = {
  showStatus?: boolean;
  compact?: boolean;
};

export function ConnectSection({ showStatus = true, compact = false }: Props) {
  return (
    <div className={`connect-grid ${compact ? "connect-grid--compact" : ""}`}>
      <div className="connect-box">
        <div className="connect-tag">Java Edition</div>
        <div className="connect-value">{siteConfig.java.host}</div>
        <p className="connect-hint">Versiones {siteConfig.java.versions}</p>
        {showStatus && (
          <div className="connect-stats">
            <ServerStatus />
          </div>
        )}
        <div className="connect-actions connect-actions--touch">
          <a className="btn btn-primary" href="#connect-java">
            Conectar Java
          </a>
        </div>
        <div className="connect-actions connect-actions--desktop">
          <CopyTextButton text={siteConfig.java.host} label="Copiar IP Java" />
        </div>
      </div>

      <div className="connect-box">
        <div className="connect-tag">Bedrock Edition</div>
        <div className="connect-value">{siteConfig.bedrock.host}</div>
        <p className="connect-hint">
          Puerto <strong>{siteConfig.bedrock.port}</strong>
        </p>
        <p className="connect-hint connect-hint--xbox">
          Xbox / PE: <strong>{siteConfig.bedrock.xboxUser}</strong>
        </p>
        <div className="connect-actions connect-actions--touch">
          <a className="btn btn-ghost" href="#connect-bedrock">
            Conectar Bedrock
          </a>
        </div>
        <div className="connect-actions connect-actions--desktop">
          <CopyTextButton text={bedrockAddress()} label="Copiar IP Bedrock" variant="ghost" />
        </div>
      </div>
    </div>
  );
}
