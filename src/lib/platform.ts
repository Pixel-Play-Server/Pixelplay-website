export type DeviceKind = "ios" | "android" | "desktop" | "unknown-mobile";

export type BedrockPlatform = "phone" | "windows" | "xbox" | "ps5" | "switch";

export function getDeviceKind(): DeviceKind {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Mobile|Tablet/i.test(ua)) return "unknown-mobile";
  return "desktop";
}

export function isMobileDevice(): boolean {
  const k = getDeviceKind();
  return k !== "desktop";
}
