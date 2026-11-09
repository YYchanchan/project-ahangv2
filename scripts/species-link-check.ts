import assert from "node:assert/strict";
import { CHINESE_PANGOLIN } from "../src/data/chinesePangolin";
import { applyCorrectionToAnimal, mergeIndividualSupplement, missingIndividualFields } from "../src/data/individualSupplement";
import { resolveStandardSpeciesName } from "../src/data/speciesImageCatalog";
import {
  animalWithSharedSpeciesLink,
  resolveSpecies,
  sameSpeciesAnimals,
  speciesLinkFields,
  uncertainSpeciesFields,
  UNCERTAIN_SPECIES_CODE,
} from "../src/data/speciesResolver";
import type { Animal, Species } from "../src/types";

const lion: Species = {
  id: "african-lion",
  biologicalProfile: {
    chineseName: "非洲狮",
    englishName: "African Lion",
    latinName: "Panthera leo",
    kingdom: "Animalia（动物界）",
    phylum: "Chordata（脊索动物门）",
    className: "Mammalia（哺乳纲）",
    order: "Carnivora（食肉目）",
    family: "Felidae（猫科）",
    genus: "Panthera（豹属）",
    species: "Panthera leo",
  },
  basicInfo: {
    captiveLifespan: "约15–20年",
    weight: "",
    sizeHeight: "",
    diet: "",
    socialStructure: "",
    activityTime: "",
    reproduction: "",
    distribution: "",
    habitat: "",
    iucnStatus: "VU（易危）",
    citesStatus: "附录 II",
  },
  characteristics: [],
  faqs: [],
  extendedReading: { congeneric: [], confamilial: [], articles: [], courses: [], videos: [], creativeProducts: [] },
  wildVsZoo: [{ title: "食物来源", wild: "野外捕食", zoo: "配方肉" }],
};

const bear: Species = {
  ...lion,
  id: "asiatic-black-bear",
  biologicalProfile: {
    ...lion.biologicalProfile,
    chineseName: "亚洲黑熊",
    englishName: "Asiatic Black Bear",
    latinName: "Ursus thibetanus",
    species: "Ursus thibetanus",
  },
};

const redPanda: Species = {
  ...lion,
  id: "red-panda",
  biologicalProfile: {
    ...lion.biologicalProfile,
    chineseName: "小熊猫",
    englishName: "Red Panda",
    latinName: "Ailurus fulgens",
    species: "Ailurus fulgens",
  },
};

const catalog = [lion, bear, redPanda, CHINESE_PANGOLIN];

function animal(partial: Partial<Animal> & Pick<Animal, "id" | "name">): Animal {
  return {
    nickname: "",
    species: "",
    scientificName: "",
    speciesCode: "",
    image: "",
    imageType: "placeholder",
    status: "in_zoo",
    institution: "",
    city: "",
    gender: "未知",
    lifeSpan: "待补充",
    statusLabel: "在园",
    tags: [],
    description: "",
    timeline: [],
    observations: [],
    verified: false,
    verifiedCount: 0,
    ...partial,
  };
}

assert.equal(resolveSpecies(catalog, { speciesCode: "african-lion", species: "随便写" })?.id, "african-lion");
assert.equal(resolveSpecies(catalog, { species: "小熊猫" })?.id, "red-panda");
assert.equal(resolveSpecies(catalog, { species: "Asian Black Bear" })?.id, "asiatic-black-bear");
assert.equal(resolveSpecies(catalog, { scientificName: "Panthera leo" })?.id, "african-lion");
assert.equal(resolveSpecies(catalog, { commonName: "穿山甲" })?.id, "chinese-pangolin");
assert.equal(resolveSpecies(catalog, { species: "中华穿山甲" })?.id, "chinese-pangolin");
assert.equal(resolveSpecies(catalog, { speciesCode: UNCERTAIN_SPECIES_CODE, species: "穿山甲" }), undefined);
assert.equal(resolveSpecies(catalog, { species: "河马" }), undefined);
assert.equal(resolveSpecies(catalog, { speciesCode: "hippopotamus", species: "河马" }), undefined);

const linked = speciesLinkFields(CHINESE_PANGOLIN);
assert.equal(linked.speciesCode, "chinese-pangolin");
assert.equal(linked.commonName, "中华穿山甲");
assert.equal(linked.species, "Chinese Pangolin");
assert.equal(linked.scientificName, "Manis pentadactyla");
assert.equal(uncertainSpeciesFields().speciesCode, UNCERTAIN_SPECIES_CODE);

const ahang = animal({
  id: "ahang",
  name: "阿杭",
  species: "African Lion",
  speciesCode: "african-lion",
  institution: "广州动物园",
});
const bebei = animal({
  id: "bebei",
  name: "贝贝",
  species: "非洲狮",
  commonName: "非洲狮",
  speciesCode: "",
  institution: "广州动物园",
});
const peers = sameSpeciesAnimals(catalog, [ahang, bebei], ahang);
assert.deepEqual(peers.map((item) => item.id), ["bebei"]);

const pangolin = animal({
  id: "jiajia",
  name: "甲甲",
  speciesCode: "chinese-pangolin",
  species: "Chinese Pangolin",
  institution: "未知机构",
  description: "由公众推荐建档，资料正在核验中。",
});
assert.ok(missingIndividualFields(pangolin).includes("物种关联") === false);
assert.ok(missingIndividualFields(pangolin).includes("所在机构"));
assert.ok(missingIndividualFields(animal({ id: "x", name: "待核实", speciesCode: UNCERTAIN_SPECIES_CODE })).includes("物种关联"));

const merged = mergeIndividualSupplement(pangolin, {
  institution: "广州动物园",
  area: "夜行馆",
  birthYear: "2018",
  father: "未知",
  relationshipNote: "单独饲养",
  summary: "左前爪有一道旧痕。",
  timeline: [{ year: "2024", title: "完成体检", description: "体重稳定。" }],
  photos: ["/uploads/pangolin.jpg"],
  ...speciesLinkFields(CHINESE_PANGOLIN),
});
assert.equal(merged.speciesCode, "chinese-pangolin");
assert.equal(merged.institution, "广州动物园 · 夜行馆");
assert.equal(merged.image, "/uploads/pangolin.jpg");
assert.equal(merged.timeline.length, 1);
assert.match(merged.description, /家庭与关系：单独饲养/);
assert.equal(merged.summary, "左前爪有一道旧痕。");
assert.equal(CHINESE_PANGOLIN.basicInfo.iucnStatus.includes("CR"), true);
assert.equal(CHINESE_PANGOLIN.basicInfo.citesStatus.includes("附录 I"), true);
assert.ok(CHINESE_PANGOLIN.wildVsZoo && CHINESE_PANGOLIN.wildVsZoo.length >= 3);
assert.ok(!("wildVsZoo" in merged));

assert.equal(resolveStandardSpeciesName("河马"), "Hippopotamus");
assert.equal(resolveStandardSpeciesName("hippopotamus"), "Hippopotamus");
assert.equal(resolveStandardSpeciesName("穿山甲"), "Chinese Pangolin");
assert.equal(resolveStandardSpeciesName("猕猴"), "Rhesus Macaque");
assert.equal(resolveStandardSpeciesName("日本猕猴"), "Japanese Macaque");
assert.notEqual(resolveStandardSpeciesName("河马"), "Red Panda");
assert.equal(resolveStandardSpeciesName("Pallas's Cat"), "Pallas's Cat");

const dundun = animal({
  id: "dundun",
  name: "墩墩",
  species: "非洲狮",
  speciesCode: "",
  description: "园里的年轻雄狮，左耳有缺口。",
  institution: "广州动物园",
});
const linkedDundun = animalWithSharedSpeciesLink(dundun, catalog);
assert.equal(linkedDundun?.speciesCode, "african-lion");
assert.equal(linkedDundun?.species, "非洲狮");
assert.equal(linkedDundun?.description, dundun.description);
assert.equal(linkedDundun?.scientificName, "Panthera leo");
assert.equal(animalWithSharedSpeciesLink(ahang, catalog), null);
assert.equal(animalWithSharedSpeciesLink(animal({
  id: "cougar",
  name: "小微",
  species: "美洲狮",
  speciesCode: "",
}), catalog), null);
const uncertain = animal({ id: "unknown", name: "待定", speciesCode: UNCERTAIN_SPECIES_CODE, species: "非洲狮" });
assert.equal(animalWithSharedSpeciesLink(uncertain, catalog), null);

const corrected = applyCorrectionToAnimal(dundun, "出生年份应为2016年", "age");
assert.equal(corrected.timeline.length, 1);
assert.equal(corrected.timeline[0].title, "生卒资料补充");
assert.equal(corrected.description, dundun.description);
assert.equal(applyCorrectionToAnimal(corrected, "出生年份应为2016年", "age").timeline.length, 1);

console.log("species link checks passed");
