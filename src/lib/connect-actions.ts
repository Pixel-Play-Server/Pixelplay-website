import { bedrockAddress, siteConfig } from "@/lib/config";
import type { BedrockPlatform } from "@/lib/platform";

export async function copyText(text: string): Promise<boolean> {
  if (copyTextNow(text)) return true;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return copyTextNow(text);
  }
}

/** Copia en el mismo tick del tap — necesario en iOS Safari (también en HTTP) */
export function copyTextNow(text: string): boolean {
  if (typeof document === "undefined") return false;

  const mark = () => {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.cssText =
        "position:fixed;top:0;left:0;width:2px;height:2px;opacity:0;border:none;padding:0;margin:0;";
      document.body.appendChild(ta);
      ta.focus({ preventScroll: true });
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  };

  if (mark()) return true;

  try {
    const range = document.createRange();
    const node = document.createElement("span");
    node.textContent = text;
    node.style.cssText = "position:fixed;top:0;left:0;opacity:0;";
    document.body.appendChild(node);
    range.selectNodeContents(node);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    const ok = document.execCommand("copy");
    sel?.removeAllRanges();
    document.body.removeChild(node);
    return ok;
  } catch {
    return false;
  }
}

/** Deep link para agregar servidor en Bedrock móvil (PE) */
export function bedrockDeepLink() {
  const host = siteConfig.bedrock.host;
  const port = siteConfig.bedrock.port;
  return `minecraft://?addExternalServer=PixelPlay|${host}|${port}`;
}

export function openMinecraftBedrock() {
  const link = bedrockDeepLink();
  const a = document.createElement("a");
  a.href = link;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export type ConnectResult = {
  title: string;
  copied: string;
  copyOk: boolean;
  steps: string[];
  openedGame?: boolean;
};

export function connectBedrockSync(platform: BedrockPlatform): ConnectResult {
  const addr = bedrockAddress();
  const { host, port, xboxUser } = siteConfig.bedrock;

  if (platform === "phone") {
    const copyOk = copyTextNow(addr);
    return {
      title: "Bedrock · Celular / Tablet",
      copied: addr,
      copyOk,
      steps: [
        copyOk
          ? "La IP se copió al portapapeles."
          : "Mantené presionado el texto de abajo para copiarlo.",
        "Abrí Minecraft → Servidores → Agregar servidor.",
        `Servidor: ${host}`,
        `Puerto: ${port}`,
      ],
    };
  }

  if (platform === "windows") {
    const copyOk = copyTextNow(addr);
    return {
      title: "Bedrock · Windows",
      copied: addr,
      copyOk,
      steps: [
        copyOk
          ? "Dirección copiada al portapapeles."
          : "Mantené presionado el texto de abajo para copiarlo.",
        "Abrí Minecraft Bedrock (Microsoft Store o Minecraft Launcher).",
        "Jugar → Servidores → Agregar servidor.",
        `Servidor: ${host}`,
        `Puerto: ${port}`,
        "Necesitás la edición Bedrock, no Java.",
      ],
    };
  }

  if (platform === "xbox") {
    const copyOk = copyTextNow(xboxUser);
    return {
      title: "Bedrock · Xbox",
      copied: xboxUser,
      copyOk,
      steps: [
        copyOk
          ? "Usuario copiado al portapapeles."
          : "Mantené presionado el texto de abajo para copiarlo.",
        "En Xbox: Minecraft → Jugar → Amigos.",
        "Buscá o agregá al jugador " + xboxUser + ".",
        "También podés agregar servidor externo:",
        `${host} · puerto ${port}`,
      ],
    };
  }

  if (platform === "ps5") {
    const copyOk = copyTextNow(addr);
    return {
      title: "Bedrock · PlayStation",
      copied: addr,
      copyOk,
      steps: [
        copyOk
          ? "Dirección copiada al portapapeles."
          : "Mantené presionado el texto de abajo para copiarlo.",
        "Minecraft → Jugar → Servidores → Agregar servidor.",
        `Dirección: ${host}`,
        `Puerto: ${port}`,
      ],
    };
  }

  const copyOk = copyTextNow(addr);
  return {
    title: "Bedrock · Nintendo Switch",
    copied: addr,
    copyOk,
    steps: [
      copyOk
        ? "Dirección copiada al portapapeles."
        : "Mantené presionado el texto de abajo para copiarlo.",
      "Minecraft → Jugar → Servidores → Agregar servidor.",
      `Dirección: ${host}`,
      `Puerto: ${port}`,
      "Necesitás Nintendo Switch Online para jugar online.",
    ],
  };
}

/** @deprecated Usar connectBedrockSync en handlers de tap */
export async function connectBedrock(platform: BedrockPlatform): Promise<ConnectResult> {
  return connectBedrockSync(platform);
}

export async function connectBedrockPhone(): Promise<ConnectResult> {
  return connectBedrockSync("phone");
}

export async function connectJava(isMobile: boolean): Promise<ConnectResult> {
  const host = siteConfig.java.host;
  const copyOk = copyTextNow(host) || (await copyText(host));
  return {
    title: isMobile ? "Java · Solo PC" : "Java Edition",
    copied: host,
    copyOk,
    steps: isMobile
      ? [
          "Java Edition no corre en el teléfono.",
          "Copiamos la IP para que la uses en PC o Mac.",
          "Minecraft Java → Multijugador → Agregar servidor.",
          `IP: ${host} · versiones ${siteConfig.java.versions}`,
        ]
      : [
          "IP copiada al portapapeles.",
          "Multijugador → Agregar servidor → pegar IP.",
          `Versiones: ${siteConfig.java.versions}`,
        ],
  };
}
