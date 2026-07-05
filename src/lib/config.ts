export const siteConfig = {
  name: "PixelPlay",
  tagline: "Survival PvP · Java & Bedrock",
  discord: "https://discord.pixelplay.gg",
  tienda: "https://praktico.shop",
  java: {
    host: "mc.pixelplay.gg",
    versions: "1.8.9 – 1.21+",
  },
  bedrock: {
    host: "bedrock.pixelplay.gg",
    port: 19132,
    xboxUser: "pixelplay5607",
  },
  /** @deprecated use siteConfig.java.host */
  serverIp: "mc.pixelplay.gg",
  /** @deprecated use siteConfig.java.versions */
  versions: "1.8.9 – 1.21+",
} as const;

export function bedrockAddress() {
  return `${siteConfig.bedrock.host}:${siteConfig.bedrock.port}`;
}
