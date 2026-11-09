import type { Animal, AnimalTimelineEvent } from "../types";
import { UNCERTAIN_SPECIES_CODE, isUncertainSpeciesCode } from "./speciesResolver";

export interface IndividualSupplementInput {
  name?: string;
  nickname?: string;
  aliases?: string[];
  institution?: string;
  city?: string;
  area?: string;
  gender?: Animal["gender"];
  birthDate?: string;
  birthYear?: string;
  birthPlace?: string;
  father?: string;
  mother?: string;
  sibling?: string;
  relationshipNote?: string;
  summary?: string;
  description?: string;
  timeline?: AnimalTimelineEvent[];
  photos?: string[];
  speciesCode?: string;
  speciesId?: string;
  species?: string;
  scientificName?: string;
  commonName?: string;
  englishName?: string;
}

const PLACEHOLDER_DESCRIPTIONS = new Set([
  "由公众推荐建档，资料正在核验中。",
  "资料待补充",
]);

export function missingIndividualFields(animal?: Partial<Animal> | null): string[] {
  if (!animal) {
    return ["照片", "所在机构", "出生日期或年份", "家庭或同伴关系", "生命时间线", "物种关联"];
  }
  const missing: string[] = [];
  const hasPhoto = Boolean(animal.image?.trim()) || Boolean(animal.gallery?.some((item) => item.trim()));
  if (!hasPhoto) missing.push("照片");
  if (!animal.institution?.trim() || animal.institution.trim() === "未知机构") missing.push("所在机构");
  if (!animal.birthDate?.trim() && !animal.birthYear?.trim()) missing.push("出生日期或年份");
  const hasFamily = Boolean(
    animal.father?.trim()
    || animal.mother?.trim()
    || animal.sibling?.trim()
    || animal.relationship
    || animal.relationships?.length,
  );
  if (!hasFamily) missing.push("家庭或同伴关系");
  if (!animal.timeline?.length) missing.push("生命时间线");
  if (!animal.speciesCode?.trim() || isUncertainSpeciesCode(animal.speciesCode)) missing.push("物种关联");
  return missing;
}

export function mergeIndividualSupplement(animal: Animal, fields: IndividualSupplementInput): Animal {
  const next: Animal = {
    ...animal,
    aliases: animal.aliases ? [...animal.aliases] : undefined,
    tags: [...(animal.tags || [])],
    timeline: [...(animal.timeline || [])],
    observations: [...(animal.observations || [])],
    gallery: animal.gallery ? [...animal.gallery] : [],
    relationships: animal.relationships ? animal.relationships.map((item) => ({ ...item })) : undefined,
    relationship: animal.relationship ? { ...animal.relationship } : undefined,
  };

  if (filled(fields.name)) next.name = fields.name.trim();
  if (filled(fields.nickname)) next.nickname = fields.nickname.trim();
  if (filled(fields.institution)) next.institution = fields.institution.trim();
  if (filled(fields.city)) next.city = fields.city.trim();
  if (filled(fields.area)) {
    const area = fields.area.trim();
    if (next.institution && !next.institution.includes(area)) next.institution = `${next.institution} · ${area}`;
    else if (!next.institution) next.institution = area;
  }
  if (fields.gender === "雄性" || fields.gender === "雌性" || fields.gender === "未知") next.gender = fields.gender;
  if (filled(fields.birthDate)) next.birthDate = fields.birthDate.trim();
  if (filled(fields.birthYear)) next.birthYear = fields.birthYear.trim();
  if (filled(fields.birthPlace)) next.birthPlace = fields.birthPlace.trim();
  if (filled(fields.father)) next.father = fields.father.trim();
  if (filled(fields.mother)) next.mother = fields.mother.trim();
  if (filled(fields.sibling)) next.sibling = fields.sibling.trim();

  if (Array.isArray(fields.aliases)) {
    const merged = new Set([...(next.aliases || []), ...fields.aliases.map((item) => item.trim()).filter(Boolean)]);
    next.aliases = [...merged];
  }

  if (filled(fields.summary)) next.summary = fields.summary.trim();
  if (filled(fields.description)) next.description = fields.description.trim();
  else if (filled(fields.summary) && (!next.description || PLACEHOLDER_DESCRIPTIONS.has(next.description))) {
    next.description = fields.summary.trim();
  }

  if (filled(fields.relationshipNote)) {
    const note = fields.relationshipNote.trim();
    const paragraph = `家庭与关系：${note}`;
    if (!next.description?.includes(note)) {
      next.description = next.description ? `${next.description}\n${paragraph}` : paragraph;
    }
  }

  for (const event of fields.timeline || []) {
    if (!filled(event?.year) || !filled(event?.title)) continue;
    const year = event.year.trim();
    const title = event.title.trim();
    const exists = next.timeline.some((item) => item.year === year && item.title === title);
    if (!exists) {
      next.timeline.push({
        year,
        title,
        description: filled(event.description) ? event.description.trim() : "由公众补充的个体经历。",
      });
    }
  }

  const photos = (fields.photos || []).map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
  if (photos.length) {
    next.gallery = [...new Set([...(next.gallery || []), ...photos])];
    if (!next.image?.trim()) {
      next.image = photos[0];
      next.imageType = "real";
    }
  }

  if (filled(fields.speciesCode)) {
    const speciesCode = fields.speciesCode.trim();
    next.speciesCode = speciesCode;
    next.speciesId = speciesCode === UNCERTAIN_SPECIES_CODE ? undefined : (fields.speciesId || speciesCode);
    if (filled(fields.species)) next.species = fields.species.trim();
    if (typeof fields.scientificName === "string") next.scientificName = fields.scientificName.trim();
    if (typeof fields.commonName === "string") next.commonName = fields.commonName.trim();
    if (typeof fields.englishName === "string") next.englishName = fields.englishName.trim();
  }

  if ((next.birthDate || next.birthYear) && (!next.lifeSpan || next.lifeSpan === "待补充")) {
    next.lifeSpan = next.birthDate || `${next.birthYear} 年`;
  }

  return next;
}

export function applyCorrectionToAnimal(animal: Animal, details: string, field?: string): Animal {
  const description = details.trim();
  if (!description) return animal;
  const title = field === "gender"
    ? "性别资料补充"
    : field === "age"
      ? "生卒资料补充"
      : field === "timeline"
        ? "时间线补充"
        : "资料补充";
  const timeline = [...(animal.timeline || [])];
  if (timeline.some((event) => event.title === title && event.description === description)) return animal;
  timeline.push({
    year: String(new Date().getFullYear()),
    title,
    description,
  });
  return { ...animal, timeline };
}

export function readSupplementInput(payload: Record<string, unknown> | undefined): IndividualSupplementInput {
  const raw = payload?.fields;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as IndividualSupplementInput;
}

function filled(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}
