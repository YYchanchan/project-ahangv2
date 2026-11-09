import assert from "node:assert/strict";
import { EDITOR_WECHAT_ID, EDITOR_WECHAT_LABEL } from "../src/data/contact";
import { CHINESE_PANGOLIN } from "../src/data/chinesePangolin";
import { KOALA } from "../src/data/koala";
import { speciesCreditLine } from "../src/data/speciesImageCredit";
import { resolveSpeciesCover, withoutPlaceholderIllustrationCredit } from "../src/data/speciesCover";
import { SPECIES_RECRUIT_SUBTITLE, SPECIES_RECRUIT_TITLE } from "../src/data/speciesRecruitment";
import { speciesScienceRejection } from "../src/data/speciesSubmissionGuard";
import {
  applySpeciesContentPatch,
  ASIAN_ELEPHANT_DIET_WITH_FORAGING,
  ASIAN_ELEPHANT_DIET_WITH_PREDATION,
  PUMA,
} from "../src/data/speciesContentPatches";
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

const giantPanda: Species = {
  ...lion,
  id: "giant-panda",
  biologicalProfile: {
    ...lion.biologicalProfile,
    chineseName: "大熊猫",
    englishName: "Giant Panda",
    latinName: "Ailuropoda melanoleuca",
    species: "Ailuropoda melanoleuca",
  },
};

const catalog = [lion, bear, redPanda, giantPanda, CHINESE_PANGOLIN];

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
assert.equal(missingIndividualFields(animal({ id: "x", name: "待核实", speciesCode: UNCERTAIN_SPECIES_CODE })).includes("物种关联"), false);

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

function linkedCode(name: string, speciesName: string) {
  return animalWithSharedSpeciesLink(animal({
    id: name,
    name,
    species: speciesName,
    speciesCode: "",
    description: `${name}的个体故事`,
  }), catalog);
}

const dundunLive = linkedCode("墩墩", "非洲狮");
const xingyi = linkedCode("星一", "大熊猫");
const meizhu = linkedCode("妹珠", "大熊猫");
const dede = linkedCode("得得", "白狮");
const xiaowei = linkedCode("小微", "美洲狮");
assert.equal(dundunLive?.speciesCode, "african-lion");
assert.equal(dundunLive?.species, "非洲狮");
assert.equal(dundunLive?.description, "墩墩的个体故事");
assert.equal(xingyi?.speciesCode, "giant-panda");
assert.equal(xingyi?.species, "大熊猫");
assert.equal(meizhu?.speciesCode, "giant-panda");
assert.equal(meizhu?.species, "大熊猫");
assert.equal(dede?.speciesCode, "african-lion");
assert.equal(dede?.species, "白狮");
assert.equal(dede?.commonName, "非洲狮");
assert.equal(xiaowei, null);
assert.equal(resolveSpecies(catalog, { species: "白狮" })?.id, "african-lion");

const liveLion = applySpeciesContentPatch({
  ...lion,
  basicInfo: { ...lion.basicInfo, wildLifespan: "" },
  faqs: [{ q: "白狮是不是独立物种？", a: "原有回答" }],
  extendedReading: { ...lion.extendedReading, articles: ["已有文章"] },
  wildVsZoo: [{ title: "食物来源 Diet & Feeding", wild: "已有", zoo: "已有" }],
});
assert.equal(liveLion?.basicInfo.wildLifespan?.includes("10"), true);
assert.equal(liveLion?.faqs[0].q, "白狮是不是独立物种？");
assert.ok((liveLion?.faqs.length || 0) > 1);
assert.equal(liveLion?.wildVsZoo?.[0].wild, "已有");
assert.equal(applySpeciesContentPatch({
  ...lion,
  basicInfo: { ...lion.basicInfo, wildLifespan: "编辑写过的寿命" },
  faqs: liveLion?.faqs || [],
  extendedReading: liveLion?.extendedReading || lion.extendedReading,
  wildVsZoo: liveLion?.wildVsZoo,
}) , null);

const elephant = applySpeciesContentPatch({
  ...lion,
  id: "asian-elephant",
  basicInfo: { ...lion.basicInfo, diet: ASIAN_ELEPHANT_DIET_WITH_PREDATION, wildLifespan: "50 — 60 年" },
  wildVsZoo: [],
});
assert.equal(elephant?.basicInfo.diet, ASIAN_ELEPHANT_DIET_WITH_FORAGING);
assert.equal(elephant?.basicInfo.wildLifespan, "50 — 60 年");
assert.equal(applySpeciesContentPatch({
  ...lion,
  id: "asian-elephant",
  basicInfo: { ...lion.basicInfo, diet: "编辑改过的食性", wildLifespan: "50 — 60 年" },
  wildVsZoo: [{ title: "自写对比", wild: "甲", zoo: "乙" }],
})?.basicInfo.diet, "编辑改过的食性");

const macaque = applySpeciesContentPatch({
  ...lion,
  id: "rhesus-macaque",
  characteristics: [{ title: "精细的阶级社会", description: "原有" }],
  basicInfo: { ...lion.basicInfo, wildLifespan: "15 — 20 年" },
});
assert.equal(macaque?.characteristics[0].title, "精细的阶级社会");
assert.ok((macaque?.characteristics.length || 0) >= 3);
assert.equal(applySpeciesContentPatch(macaque!) , null);

const pumaCatalog = [...catalog, PUMA];
const xiaoweiLinked = animalWithSharedSpeciesLink(animal({
  id: "xiaowei",
  name: "小微",
  species: "美洲狮",
  speciesCode: "",
  description: "小微自己的故事",
}), pumaCatalog);
assert.equal(xiaoweiLinked?.speciesCode, "puma");
assert.equal(xiaoweiLinked?.species, "美洲狮");
assert.equal(xiaoweiLinked?.description, "小微自己的故事");
assert.equal(animalWithSharedSpeciesLink(animal({
  id: "xiaowei",
  name: "小微",
  species: "美洲狮",
  speciesCode: "",
}), catalog), null);
assert.equal(EDITOR_WECHAT_ID, "18688884927");
assert.equal(EDITOR_WECHAT_LABEL, "添加微信：18688884927");
assert.equal(speciesScienceRejection({
  type: "supplement",
  payload: { fields: { birthDate: "2016-05-01", summary: "左耳有缺口" } },
}), null);
assert.ok(speciesScienceRejection({
  type: "supplement",
  payload: { fields: { speciesCode: "african-lion", species: "African Lion" } },
}));
assert.ok(speciesScienceRejection({
  type: "correction",
  payload: { field: "diet", biologicalProfile: { chineseName: "非洲狮" } },
}));
assert.equal(speciesScienceRejection({
  type: "recommend",
  payload: { animal: { species: "白狮", speciesCode: "", name: "得得" } },
}), null);
assert.equal(speciesScienceRejection({
  type: "correction",
  payload: { field: "name", evidence: "园方名牌" },
}), null);
assert.ok(speciesScienceRejection({
  type: "recommend",
  payload: { imageCredit: { author: "访客", license: "随便写" }, coverImage: "https://example.test/koala.jpg" },
}));
assert.equal(speciesScienceRejection({
  type: "recommend",
  payload: { animal: { name: "圆圆", speciesCode: "koala", species: "Koala" } },
}), null);

const koalaCatalog = [...catalog, KOALA];
assert.equal(resolveSpecies(koalaCatalog, { species: "考拉" })?.id, "koala");
assert.equal(resolveSpecies(koalaCatalog, { species: "树袋熊" })?.id, "koala");
assert.equal(resolveSpecies(koalaCatalog, { commonName: "koala" })?.id, "koala");
assert.equal(animalWithSharedSpeciesLink(animal({
  id: "yuanyuan",
  name: "圆圆",
  species: "树袋熊",
  description: "圆圆自己的故事",
}), koalaCatalog)?.speciesCode, "koala");
assert.equal(KOALA.basicInfo.diet.includes("桉"), true);
assert.equal(KOALA.basicInfo.citesStatus.includes("未列入"), true);
assert.equal(KOALA.coverImage, undefined);
assert.equal(KOALA.imageCredit, undefined);
const koalaWithPhoto = animal({
  id: "yuanyuan-photo",
  name: "圆圆",
  species: "考拉",
  speciesCode: "koala",
  image: "/uploads/animals/yuanyuan.jpg",
  imageType: "real",
});
const koalaCover = resolveSpeciesCover(KOALA, [koalaWithPhoto], koalaCatalog);
assert.equal(koalaCover.kind, "photo");
assert.equal(koalaCover.src, "/uploads/animals/yuanyuan.jpg");
assert.equal(koalaCover.credit, undefined);
const explicit = resolveSpeciesCover({
  ...KOALA,
  coverImage: "/uploads/species/koala-editor.jpg",
  imageCredit: { author: "园方", license: "CC BY 4.0", sourceUrl: "https://example.test/koala" },
}, [koalaWithPhoto], koalaCatalog);
assert.equal(explicit.kind, "cover");
assert.equal(explicit.src, "/uploads/species/koala-editor.jpg");
assert.equal(speciesCreditLine(explicit.credit), "园方 · CC BY 4.0");
assert.equal(resolveSpeciesCover(KOALA, [], koalaCatalog).kind, "placeholder");
const cleared = withoutPlaceholderIllustrationCredit({
  ...KOALA,
  imageCredit: { author: "阿杭计划", license: "原创示意插画，不是野外或园内实拍", sourceUrl: "" },
});
assert.equal(cleared?.imageCredit, undefined);
assert.equal(cleared?.coverImage, undefined);
assert.equal(withoutPlaceholderIllustrationCredit({
  ...KOALA,
  coverImage: "/uploads/species/keep.jpg",
  imageCredit: { author: "阿杭计划", license: "原创示意插画，不是野外或园内实拍" },
}), null);
assert.equal(SPECIES_RECRUIT_TITLE, "寻找第一位成员");
assert.equal(SPECIES_RECRUIT_SUBTITLE, "你在哪里见过它？告诉我们");
assert.equal(resolveStandardSpeciesName("树袋熊"), "Koala");

const corrected = applyCorrectionToAnimal(dundun, "出生年份应为2016年", "age");
assert.equal(corrected.timeline.length, 1);
assert.equal(corrected.timeline[0].title, "生卒资料补充");
assert.equal(corrected.description, dundun.description);
assert.equal(applyCorrectionToAnimal(corrected, "出生年份应为2016年", "age").timeline.length, 1);

console.log("species link checks passed");
