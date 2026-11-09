import type { SpeciesImageCredit } from "../types";

export function speciesCreditLine(credit?: SpeciesImageCredit | null): string {
  if (!credit) return "";
  return [credit.author, credit.license].map((item) => item?.trim() || "").filter(Boolean).join(" · ");
}

export function speciesCreditSource(credit?: SpeciesImageCredit | null): string {
  return credit?.sourceUrl?.trim() || "";
}
