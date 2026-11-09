import type { Animal, Species, SpeciesImageCredit } from "../types";
import { resolveSpecies } from "./speciesResolver";

/** Credit previously stored for the generated koala illustration. It is not a photograph credit. */
export const PLACEHOLDER_ILLUSTRATION_CREDIT: SpeciesImageCredit = {
  author: "阿杭计划",
  license: "原创示意插画，不是野外或园内实拍",
  sourceUrl: "",
};

const PHOTO_RANK: Record<string, number> = {
  official_photo: 0,
  species_photo: 1,
  real: 2,
};

export function isRealPhotoUrl(url?: string | null): url is string {
  const value = (url || "").trim();
  if (!value) return false;
  const lower = value.toLowerCase().split("?")[0];
  if (lower.includes("species-placeholders")) return false;
  if (lower.endsWith(".svg") || lower.startsWith("data:image/svg")) return false;
  return (
    lower.startsWith("/uploads/")
    || lower.startsWith("http://")
    || lower.startsWith("https://")
    || /\.(jpe?g|png|webp|gif)$/.test(lower)
  );
}

export function withoutPlaceholderIllustrationCredit(species: Species): Species | null {
  if (species.coverImage?.trim()) return null;
  const credit = species.imageCredit;
  if (!credit) return null;
  const sameAuthor = (credit.author || "") === PLACEHOLDER_ILLUSTRATION_CREDIT.author;
  const sameLicense = (credit.license || "") === PLACEHOLDER_ILLUSTRATION_CREDIT.license;
  const sameSource = !(credit.sourceUrl || "").trim();
  if (!sameAuthor || !sameLicense || !sameSource) return null;
  const next: Species = { ...species };
  delete next.imageCredit;
  return next;
}

export function speciesPhotoCandidates(species: Species, animals: Animal[], catalog: Species[] = [species]): string[] {
  const ranked: Array<{ url: string; rank: number }> = [];
  for (const animal of animals) {
    if (resolveSpecies(catalog, animal)?.id !== species.id && animal.speciesCode !== species.id) continue;
    const rank = PHOTO_RANK[animal.imageType] ?? 9;
    const urls: Array<[string | undefined, number]> = [
      [animal.image, rank * 10],
      [animal.coverUrl, rank * 10 + 1],
      ...(animal.gallery || []).map((url) => [url, rank * 10 + 2] as [string, number]),
    ];
    for (const [url, photoRank] of urls) {
      if (!isRealPhotoUrl(url)) continue;
      ranked.push({ url: url.trim(), rank: photoRank });
    }
  }
  ranked.sort((left, right) => left.rank - right.rank || left.url.localeCompare(right.url));
  return [...new Set(ranked.map((item) => item.url))];
}

export interface SpeciesCoverChoice {
  src: string;
  kind: "cover" | "photo" | "placeholder";
  credit?: SpeciesImageCredit;
}

/**
 * Editor cover wins. Otherwise use a photo already stored on an individual
 * or supplied as fallbackCover. The cartoon is only the last resort.
 * This does not modify the species record.
 */
export function resolveSpeciesCover(species: Species, animals: Animal[] = [], catalog: Species[] = [species]): SpeciesCoverChoice {
  const explicit = species.coverImage?.trim() || "";
  if (isRealPhotoUrl(explicit)) {
    return { src: explicit, kind: "cover", credit: species.imageCredit };
  }
  const borrowed = speciesPhotoCandidates(species, animals, catalog)[0] || species.fallbackCover?.trim() || "";
  if (isRealPhotoUrl(borrowed)) return { src: borrowed, kind: "photo" };
  return { src: "", kind: "placeholder" };
}
