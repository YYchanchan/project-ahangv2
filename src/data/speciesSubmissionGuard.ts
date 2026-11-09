/**
 * Visitors may file an individual under an existing species, and may submit
 * photos, institution, birthday, family, notes, observations, and memories.
 * They may not send species-science fields. Editors change those in the admin.
 */

const SCIENCE_KEYS = new Set([
  "biologicalprofile",
  "basicinfo",
  "characteristics",
  "faqs",
  "wildvszoo",
  "extendedreading",
  "iucnstatus",
  "citesstatus",
  "wildlifespan",
  "captivelifespan",
  "kingdom",
  "phylum",
  "classname",
  "genus",
  "latinname",
  "imagecredit",
  "coverimage",
]);

const SUPPLEMENT_SPECIES_KEYS = new Set([
  "species",
  "speciescode",
  "speciesid",
  "scientificname",
  "commonname",
  "englishname",
]);

const INDIVIDUAL_CORRECTION_FIELDS = new Set(["gender", "age", "timeline", "name", "institution"]);

export const SPECIES_SCIENCE_REJECTION =
  "物种科普由编辑维护，访客不能修改或投稿物种内容。如发现错误，请使用「联系我们」。";

export function speciesScienceRejection(input: {
  type?: string;
  payload?: Record<string, unknown>;
}): string | null {
  const type = input.type || "";
  const payload = input.payload || {};
  if (containsScience(payload)) return SPECIES_SCIENCE_REJECTION;

  if (type === "supplement") {
    const fields = payload.fields;
    if (fields && typeof fields === "object" && !Array.isArray(fields)) {
      for (const key of Object.keys(fields as Record<string, unknown>)) {
        if (SUPPLEMENT_SPECIES_KEYS.has(key.toLowerCase())) return SPECIES_SCIENCE_REJECTION;
      }
    }
  }

  if (type === "correction") {
    const field = typeof payload.field === "string" ? payload.field : "";
    if (field && !INDIVIDUAL_CORRECTION_FIELDS.has(field)) return SPECIES_SCIENCE_REJECTION;
  }

  if (type !== "recommend" && containsLinkInsideAnimal(payload)) {
    return SPECIES_SCIENCE_REJECTION;
  }

  return null;
}

function containsScience(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => containsScience(item));
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (SCIENCE_KEYS.has(key.toLowerCase())) return true;
    if (containsScience(child)) return true;
  }
  return false;
}

function containsLinkInsideAnimal(payload: Record<string, unknown>): boolean {
  const animal = payload.animal;
  if (!animal || typeof animal !== "object" || Array.isArray(animal)) return false;
  return Object.keys(animal as Record<string, unknown>).some((key) => SUPPLEMENT_SPECIES_KEYS.has(key.toLowerCase()));
}
