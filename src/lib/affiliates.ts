import affiliates from "@/data/affiliates.json";

export type Affiliate = {
  slug: string;
  minecraft: string;
  displayName?: string;
  twitch?: string;
  kick?: string;
  youtube?: string;
  active?: boolean;
};

const reserved = new Set([
  "blog",
  "wiki",
  "soporte",
  "conectar",
  "api",
  "favicon.ico",
  "_next",
  "login",
  "afiliados",
]);

export function getAffiliates(): Affiliate[] {
  return (affiliates as Affiliate[]).filter((a) => a.active !== false);
}

export function getAffiliate(slug: string): Affiliate | null {
  const key = slug.trim().toLowerCase();
  if (!key || reserved.has(key)) return null;
  return (
    getAffiliates().find(
      (a) =>
        a.slug.toLowerCase() === key || a.minecraft.toLowerCase() === key,
    ) ?? null
  );
}

export function affiliateSlugs(): string[] {
  return getAffiliates().map((a) => a.slug.toLowerCase());
}

export function displayName(a: Affiliate): string {
  return a.displayName?.trim() || a.minecraft;
}

export const API_BASE =
  process.env.NEXT_PUBLIC_PIXELPLAY_API ?? "https://api.pixelplay.gg";
