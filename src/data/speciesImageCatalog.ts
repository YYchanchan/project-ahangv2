/**
 * Maps a free-text species label to the canonical English key used by placeholder art.
 * This is only an image lookup. Species science linking lives in speciesResolver.ts.
 */
export const SPECIES_DEFAULT_IMAGE_KEYS = [
  "African Lion",
  "Asian Elephant",
  "Hippopotamus",
  "Red Panda",
  "Japanese Macaque",
  "Rhesus Macaque",
  "Giant Panda",
  "South China Tiger",
  "Asian Black Bear",
  "Giraffe",
  "White Rhinoceros",
  "Pallas's Cat",
  "Chinese Pangolin",
  "Puma",
] as const;

export type SpeciesImageKey = (typeof SPECIES_DEFAULT_IMAGE_KEYS)[number];

export const SPECIES_CODE_TO_NAME: Record<string, SpeciesImageKey> = {
  "african-lion": "African Lion",
  "asian-elephant": "Asian Elephant",
  hippopotamus: "Hippopotamus",
  "hippo": "Hippopotamus",
  "red-panda": "Red Panda",
  "japanese-macaque": "Japanese Macaque",
  "rhesus-macaque": "Rhesus Macaque",
  "giant-panda": "Giant Panda",
  "south-china-tiger": "South China Tiger",
  "asiatic-black-bear": "Asian Black Bear",
  "asian-black-bear": "Asian Black Bear",
  giraffe: "Giraffe",
  "white-rhinoceros": "White Rhinoceros",
  "white-rhino": "White Rhinoceros",
  "pallas-cat": "Pallas's Cat",
  "chinese-pangolin": "Chinese Pangolin",
  puma: "Puma",
};

export const CHINESE_SPECIES_TO_NAME: Record<string, SpeciesImageKey> = {
  "非洲狮": "African Lion",
  "狮": "African Lion",
  "狮子": "African Lion",
  "亚洲象": "Asian Elephant",
  "大象": "Asian Elephant",
  "河马": "Hippopotamus",
  "小熊猫": "Red Panda",
  "日本猕猴": "Japanese Macaque",
  "猕猴": "Rhesus Macaque",
  "恒河猴": "Rhesus Macaque",
  "大熊猫": "Giant Panda",
  "熊猫": "Giant Panda",
  "华南虎": "South China Tiger",
  "老虎": "South China Tiger",
  "亚洲黑熊": "Asian Black Bear",
  "黑熊": "Asian Black Bear",
  "长颈鹿": "Giraffe",
  "白犀牛": "White Rhinoceros",
  "兔狲": "Pallas's Cat",
  "穿山甲": "Chinese Pangolin",
  "中华穿山甲": "Chinese Pangolin",
  "中国穿山甲": "Chinese Pangolin",
  "美洲狮": "Puma",
  "山狮": "Puma",
};

export function resolveStandardSpeciesName(speciesInput: string | undefined | null): string {
  if (!speciesInput) return "Unknown";
  const trimmed = speciesInput.trim();
  if (CHINESE_SPECIES_TO_NAME[trimmed]) return CHINESE_SPECIES_TO_NAME[trimmed];

  const normalizedCode = trimmed.toLowerCase().replace(/['’.]/g, "").replace(/\s+/g, "-");
  if (SPECIES_CODE_TO_NAME[normalizedCode]) return SPECIES_CODE_TO_NAME[normalizedCode];

  const direct = SPECIES_DEFAULT_IMAGE_KEYS.find((key) => key.toLowerCase() === trimmed.toLowerCase());
  return direct || trimmed;
}
