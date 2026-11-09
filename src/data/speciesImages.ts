import africanLion from "../assets/species-placeholders/african-lion.svg";
import asianElephant from "../assets/species-placeholders/asian-elephant.svg";
import hippopotamus from "../assets/species-placeholders/hippopotamus.svg";
import macaque from "../assets/species-placeholders/macaque.svg";
import asianBlackBear from "../assets/species-placeholders/asian-black-bear.svg";
import giraffe from "../assets/species-placeholders/giraffe.svg";
import giantPanda from "../assets/species-placeholders/giant-panda.svg";
import southChinaTiger from "../assets/species-placeholders/south-china-tiger.svg";
import whiteRhinoceros from "../assets/species-placeholders/white-rhinoceros.svg";
import redPanda from "../assets/species-placeholders/red-panda.svg";
import pallasCat from "../assets/species-placeholders/pallas-cat.svg";
import chinesePangolin from "../assets/species-placeholders/pangolin.svg";
import puma from "../assets/species-placeholders/puma.svg";
import koala from "../assets/species-placeholders/koala.svg";
import { resolveStandardSpeciesName, type SpeciesImageKey } from "./speciesImageCatalog";

export { resolveStandardSpeciesName } from "./speciesImageCatalog";

const SPECIES_DEFAULT_IMAGES: Record<SpeciesImageKey, string> = {
  "African Lion": africanLion,
  "Asian Elephant": asianElephant,
  "Hippopotamus": hippopotamus,
  "Red Panda": redPanda,
  "Japanese Macaque": macaque,
  "Rhesus Macaque": macaque,
  "Giant Panda": giantPanda,
  "South China Tiger": southChinaTiger,
  "Asian Black Bear": asianBlackBear,
  "Giraffe": giraffe,
  "White Rhinoceros": whiteRhinoceros,
  "Pallas's Cat": pallasCat,
  "Chinese Pangolin": chinesePangolin,
  "Puma": puma,
  "Koala": koala,
};

/**
 * Retrieves the default image for a given species name, code, or Chinese translation.
 */
export function getSpeciesDefaultImage(speciesInput: string | undefined | null): string {
  const stdName = resolveStandardSpeciesName(speciesInput);
  if (stdName in SPECIES_DEFAULT_IMAGES) return SPECIES_DEFAULT_IMAGES[stdName as SpeciesImageKey];
  return whiteRhinoceros;
}
