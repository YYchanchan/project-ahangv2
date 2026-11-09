import type { Animal, Species } from "../types";

/** Explicit “not yet identified” link. Admins can replace it with a library id later. */
export const UNCERTAIN_SPECIES_CODE = "uncertain";

export interface SpeciesIdentityFields {
  speciesCode: string;
  speciesId?: string;
  species: string;
  scientificName: string;
  commonName: string;
  englishName: string;
}

export interface SpeciesMatchInput {
  speciesCode?: string | null;
  speciesId?: string | null;
  species?: string | null;
  scientificName?: string | null;
  commonName?: string | null;
  englishName?: string | null;
}

/**
 * Synonyms that are not stored on every seeded species row.
 * Keys are library ids. A synonym is only used when that species is in the catalog.
 */
const EXTRA_ALIASES: Record<string, string[]> = {
  // 白狮 is a colour morph of the African lion, not a separate species.
  "african-lion": ["狮", "狮子", "白狮"],
  "red-panda": ["红熊猫"],
  "asiatic-black-bear": ["Asian Black Bear", "黑熊", "月熊"],
  "asian-elephant": ["大象"],
  giraffe: ["长颈鹿"],
  "rhesus-macaque": ["恒河猴", "猕猴"],
  "pallas-cat": ["Pallas Cat", "兔狲"],
  "giant-panda": ["熊猫"],
  "chinese-pangolin": ["穿山甲", "中国穿山甲", "鲮鲤"],
  puma: ["山狮"],
  koala: ["树袋熊", "koala"],
};

export function speciesOptionLabel(species: Species): string {
  const profile = species.biologicalProfile;
  return `${profile.chineseName} · ${profile.englishName}`;
}

export function speciesLinkFields(species: Species): SpeciesIdentityFields {
  const profile = species.biologicalProfile;
  return {
    speciesCode: species.id,
    speciesId: species.id,
    species: profile.englishName,
    scientificName: profile.latinName,
    commonName: profile.chineseName,
    englishName: profile.englishName,
  };
}

export function uncertainSpeciesFields(): SpeciesIdentityFields {
  return {
    speciesCode: UNCERTAIN_SPECIES_CODE,
    speciesId: undefined,
    species: "待核实物种",
    scientificName: "",
    commonName: "不确定/待核实",
    englishName: "",
  };
}

export function isUncertainSpeciesCode(code?: string | null): boolean {
  const value = normalizeKey(code || "");
  return value === UNCERTAIN_SPECIES_CODE
    || value === "pending"
    || value === "unknown"
    || value === "待核实"
    || value === "待核实物种"
    || value === "不确定"
    || value === "不确定/待核实";
}

export function resolveSpecies(
  catalog: Species[],
  input?: SpeciesMatchInput | string | null,
): Species | undefined {
  if (!input || !catalog.length) return undefined;
  const query: SpeciesMatchInput = typeof input === "string"
    ? { species: input, speciesCode: input }
    : input;

  const code = (query.speciesCode || "").trim();
  if (isUncertainSpeciesCode(code)) return undefined;

  if (code) {
    const byId = catalog.find((species) => species.id === code || codeKey(species.id) === codeKey(code));
    if (byId) return byId;
  }

  const speciesId = (query.speciesId || "").trim();
  if (speciesId && !isUncertainSpeciesCode(speciesId)) {
    const bySpeciesId = catalog.find((species) => species.id === speciesId);
    if (bySpeciesId) return bySpeciesId;
  }

  const candidates = [
    query.species,
    query.scientificName,
    query.commonName,
    query.englishName,
    code,
  ].filter((item): item is string => Boolean(item && item.trim() && !isPlaceholderName(item)));

  if (!candidates.length) return undefined;
  const index = buildAliasIndex(catalog);
  for (const candidate of candidates) {
    const hit = index.get(normalizeKey(candidate)) || index.get(codeKey(candidate));
    if (hit) return hit;
  }
  return undefined;
}

/**
 * Link an existing individual to a shared species record without replacing
 * names, stories, photos, or observations the record already has.
 * Returns null when the animal is already linked, explicitly unverified, or unknown.
 */
export function animalWithSharedSpeciesLink(animal: Animal, catalog: Species[]): Animal | null {
  const code = (animal.speciesCode || "").trim();
  if (isUncertainSpeciesCode(code)) return null;
  if (code && catalog.some((species) => species.id === code)) return null;

  const resolved = resolveSpecies(catalog, {
    species: animal.species,
    scientificName: animal.scientificName,
    commonName: animal.commonName,
    englishName: animal.englishName,
    speciesId: code ? undefined : animal.speciesId,
  });
  if (!resolved) return null;

  const identity = speciesLinkFields(resolved);
  const next: Animal = {
    ...animal,
    speciesCode: identity.speciesCode,
    speciesId: identity.speciesId,
  };
  if (!meaningfulName(animal.species)) next.species = identity.species;
  if (!meaningfulName(animal.scientificName)) next.scientificName = identity.scientificName;
  if (!meaningfulName(animal.commonName)) next.commonName = identity.commonName;
  if (!meaningfulName(animal.englishName)) next.englishName = identity.englishName;
  return next;
}

function meaningfulName(value?: string | null): boolean {
  const key = (value || "").trim().toLowerCase();
  return Boolean(key) && key !== "unknown" && key !== "待核实物种" && key !== "不确定/待核实";
}

export function sameSpeciesAnimals(catalog: Species[], animals: Animal[], current: Animal): Animal[] {
  const resolved = resolveSpecies(catalog, current);
  const code = current.speciesCode?.trim();
  return animals.filter((item) => {
    if (item.id === current.id) return false;
    if (code && !isUncertainSpeciesCode(code) && item.speciesCode === code) return true;
    if (!resolved) return false;
    return resolveSpecies(catalog, item)?.id === resolved.id;
  });
}

function buildAliasIndex(catalog: Species[]): Map<string, Species> {
  const index = new Map<string, Species>();
  for (const species of catalog) {
    const profile = species.biologicalProfile;
    const labels = [
      species.id,
      profile.chineseName,
      profile.englishName,
      profile.latinName,
      profile.species,
      ...(species.aliases || []),
      ...(EXTRA_ALIASES[species.id] || []),
    ];
    for (const label of labels) {
      if (!label?.trim()) continue;
      index.set(normalizeKey(label), species);
      index.set(codeKey(label), species);
    }
  }
  return index;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, " ");
}

function codeKey(value: string): string {
  return normalizeKey(value).replace(/['.]/g, "").replace(/\s+/g, "-");
}

function isPlaceholderName(value: string): boolean {
  const key = normalizeKey(value);
  return key === "unknown" || key === "待核实物种" || key === "不确定/待核实" || isUncertainSpeciesCode(value);
}
