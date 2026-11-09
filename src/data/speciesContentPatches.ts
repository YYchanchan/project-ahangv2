import type { Species, SpeciesCharacteristic, SpeciesFAQ, WildVsZooItem } from "../types";

/**
 * Additive species-science updates applied on API start.
 * Blank fields are filled. Existing editor text is left in place,
 * except the one exact diet wording listed below.
 */

export const ASIAN_ELEPHANT_DIET_WITH_PREDATION =
  "植食性（主要捕食草、树叶、嫩枝、树皮、果实、根茎等）";

export const ASIAN_ELEPHANT_DIET_WITH_FORAGING =
  "植食性（主要取食草、树叶、嫩枝、树皮、果实、根茎等）";

const comparison = (title: string, wild: string, zoo: string): WildVsZooItem => ({ title, wild, zoo });

const food = (wild: string, zoo: string) => comparison("食物来源 Diet & Feeding", wild, zoo);
const range = (wild: string, zoo: string) => comparison("行为与空间 Behavior & Range", wild, zoo);
const care = (wild: string, zoo: string) => comparison("安全与照护 Safety & Care", wild, zoo);

export const PUMA: Species = {
  id: "puma",
  aliases: ["山狮", "cougar"],
  biologicalProfile: {
    chineseName: "美洲狮",
    englishName: "Puma",
    latinName: "Puma concolor",
    kingdom: "Animalia（动物界）",
    phylum: "Chordata（脊索动物门）",
    className: "Mammalia（哺乳纲）",
    order: "Carnivora（食肉目）",
    family: "Felidae（猫科）",
    genus: "Puma（美洲狮属）",
    species: "Puma concolor",
  },
  basicInfo: {
    wildLifespan: "野外多数活不到 13 年",
    captiveLifespan: "人工饲养下有超过 20 年的记录",
    weight: "成体体重随地区和性别变化很大，雄性通常重于雌性",
    sizeHeight: "头体长大约 1–1.5 米，尾长大约 0.6–0.9 米",
    diet: "肉食，主要捕猎鹿等有蹄类，也会吃较小的哺乳动物",
    socialStructure: "独居。除繁殖和母兽带仔外，很少长期结伴",
    activityTime: "晨昏和夜间更常见，白天也会活动",
    reproduction: "胎生。孕期大约三个月，每胎通常 2–3 仔",
    distribution: "美洲。从加拿大西部、美国西部，经中美洲直到南美南端。它是现存陆生哺乳动物里自然分布最广的种类之一。中国野外没有原生种群。",
    habitat: "森林、灌丛、山地、草原和荒漠都能生活，只要有猎物和可以隐蔽的地形",
    iucnStatus: "LC（无危）",
    citesStatus: "附录 II",
  },
  characteristics: [
    {
      title: "不会吼的大猫",
      description: "美洲狮不属于豹属。它不能像狮子、老虎那样吼叫，但可以发出低沉的叫声，也能像家猫一样发出呼噜声。体型已经很大，分类上却和只能低鸣的猫科更接近。",
    },
    {
      title: "靠长尾保持平衡",
      description: "又粗又长的尾巴约占身体后部很大一截，在跳跃、转身和从高处落下时帮助保持平衡。捕猎方式主要是隐蔽接近后短距离扑击，而不是长时间追赶。",
    },
    {
      title: "独来独往的广布猎手",
      description: "成体各自占用很大的活动范围，范围大小随猎物多少而变。同一地区的美洲狮用气味和刮痕彼此避开，只有发情和育幼时才会靠近。",
    },
  ],
  faqs: [
    {
      q: "美洲狮和非洲狮是同一种动物吗？",
      a: "不是。美洲狮的学名是 Puma concolor，非洲狮是 Panthera leo。它们都是猫科，但属不同，吼叫能力、社会和外形都不一样。名字里的“狮”只是中文习惯叫法。",
    },
    {
      q: "中国野外有美洲狮吗？",
      a: "没有。美洲狮的自然分布只在美洲。动物园或救助机构里的个体，不能当成中国的野生种群。",
    },
    {
      q: "美洲狮会像狮子一样吼吗？",
      a: "不会。真正会吼的是豹属里的狮子、虎、豹和美洲虎。美洲狮的喉部结构不同，发声更接近低鸣和呼噜。",
    },
  ],
  extendedReading: {
    congeneric: [],
    confamilial: ["非洲狮（Panthera leo）", "虎（Panthera tigris）", "猎豹（Acinonyx jubatus）"],
    articles: [
      "IUCN 红色名录：Puma concolor 评估（无危）",
      "CITES 附录：Puma concolor 列入附录 II",
    ],
    courses: [],
    videos: [],
    creativeProducts: [],
  },
  wildVsZoo: [
    food(
      "自行寻找鹿和其他猎物。捕到之后并不总是立刻吃完，有时会把剩余部分遮盖起来稍后再回来。",
      "按时提供经过配比的肉类。个体档案只记录这只动物实际吃了什么，不用把物种食性重写一遍。",
    ),
    range(
      "独自在很大的地面活动，利用山坡、林缘和岩石接近猎物。",
      "需要足够的高低落差、可以隐蔽的角落，以及不把动物长时间暴露在围观之下的安排。",
    ),
    care(
      "受伤或年老后很难再捕到猎物，野外没有治疗。",
      "兽医可以处理外伤和牙齿问题。保护等级写在物种页上，不由每一只个体的投稿者重复填写。",
    ),
  ],
};

interface ContentPatch {
  wildLifespan?: string;
  dietFrom?: string;
  dietTo?: string;
  characteristics?: SpeciesCharacteristic[];
  faqs?: SpeciesFAQ[];
  wildVsZoo?: WildVsZooItem[];
  articles?: string[];
}

const patches: Record<string, ContentPatch> = {
  "african-lion": {
    wildLifespan: "野外通常约 10–14 年，雄狮往往更短",
    faqs: [
      {
        q: "狮群为什么以雌狮为核心？",
        a: "一群狮子里长期留在一起的，多是有亲缘关系的雌狮。它们共同保卫领地、照顾幼崽，也承担大部分捕猎。雄狮长到可以独立后通常离开出生的狮群，成年后靠争夺或接管别的狮群获得繁殖机会。",
      },
      {
        q: "狮子主要在什么时候捕猎？",
        a: "很多捕猎发生在较凉爽的夜间和晨昏。雌狮常结成小组接近猎物。雄狮鬃毛显眼，不太适合长时间隐蔽，但在对付大型猎物时也会加入。",
      },
      {
        q: "狮子的吼声有什么用？",
        a: "吼声可以传到很远，用来标明这片地方已经有狮群，也帮助分散活动的成员重新会合。它不是每时每刻都在吼，更多出现在夜间和领地边界。",
      },
    ],
    articles: [
      "IUCN 红色名录：Panthera leo 评估（易危）",
      "CITES 附录：Panthera leo 列入附录 II",
    ],
  },
  "red-panda": {
    wildLifespan: "野外平均约 8 年",
    articles: [
      "IUCN 红色名录：Ailurus fulgens 评估（濒危）",
      "Smithsonian's National Zoo：Red panda life history",
    ],
  },
  "asian-elephant": {
    wildLifespan: "野外常可活过 50 年",
    dietFrom: ASIAN_ELEPHANT_DIET_WITH_PREDATION,
    dietTo: ASIAN_ELEPHANT_DIET_WITH_FORAGING,
    wildVsZoo: [
      food(
        "象群自己找草、树叶、嫩枝、树皮和果实。一天里大量时间都花在取食和走动上。",
        "提供干草、树枝和配方饲料，并由饲养员观察食欲。具体食谱属于个体饲养记录，不写进物种页。",
      ),
      range(
        "家族群由年长雌象带领，活动范围可以很大，也用低频声音保持联系。",
        "场地需要可以泡水或泥浴的地方、可摩擦的立木，以及能让象群保持彼此距离的空间。",
      ),
      care(
        "盗猎、人象冲突和栖息地缩小是野外的主要压力。受伤的象很难得到治疗。",
        "足部、牙齿和皮肤需要长期观察。亚洲象在 CITES 附录 I，国际贸易受到严格限制。",
      ),
    ],
    articles: [
      "IUCN 红色名录：Elephas maximus 评估（濒危）",
      "CITES 附录：Elephas maximus 列入附录 I",
    ],
  },
  "asiatic-black-bear": {
    wildLifespan: "野外约 20–25 年",
    wildVsZoo: [
      food(
        "大部分食物来自植物：嫩叶、浆果、坚果，也会吃昆虫和偶尔得到的动物性食物。",
        "按季节搭配果实、蔬菜和配方饲料，并用丰容把食物藏起来，让它自己寻找。",
      ),
      range(
        "善于爬树。温带地区的黑熊在食物变少的冬季可能进洞休眠，南方种群则不一定有完整的冬眠。",
        "需要可攀爬的树干或架台，以及可以躲开游客视线的休息处。温暖地区的馆舍里，往往看不到野外那种长时间休眠。",
      ),
      care(
        "盗猎取胆和栖息地破碎是野外的主要威胁。",
        "牙齿、关节和刻板行为需要兽医与饲养员一起看。亚洲黑熊列入 CITES 附录 I。",
      ),
    ],
    articles: [
      "IUCN 红色名录：Ursus thibetanus 评估（易危）",
      "CITES 附录：Ursus thibetanus 列入附录 I",
    ],
  },
  "pallas-cat": {
    wildLifespan: "野外寿命缺少可靠的长期追踪",
    wildVsZoo: [
      food(
        "在高原和草原上主要找鼠兔、田鼠和其他小型猎物，几乎不吃植物。",
        "提供肉类或整只小型猎物。兔狲对弓形虫很敏感，饲料和环境都要避免被家猫粪便污染。",
      ),
      range(
        "独自生活在寒冷、开阔的地方，用岩石和洞穴躲避天敌，也把洞当成产仔的地方。",
        "需要凉爽、可以躲藏的铺面，而不是又热又空的展区。它看起来毛很蓬松，并不代表不怕热。",
      ),
      care(
        "野外的主要压力来自猎物减少、犬只和误伤。",
        "人工繁殖不容易，幼崽也容易生病。兔狲列入 CITES 附录 II。",
      ),
    ],
    articles: [
      "IUCN 红色名录：Otocolobus manul 评估",
      "CITES 附录：Otocolobus manul 列入附录 II",
    ],
  },
  "giant-panda": {
    wildLifespan: "野外约 15–20 年",
    wildVsZoo: [
      food(
        "一天中的大部分时间用来吃竹子。不同季节会换竹种和部位，从笋到叶再到茎。",
        "仍然以新鲜竹子为主，再按需要补充高纤维窝头。吃了多少、换了哪种竹，应记在这只熊猫的个体记录里。",
      ),
      range(
        "独自生活在四川、陕西和甘肃的山地竹林，靠气味标记彼此避开。",
        "场地要能放下足够的竹子，并有可以爬和高处休息的结构。发情和育幼期会单独安排。",
      ),
      care(
        "栖息地被道路和农田切开后，野生种群不容易来往。",
        "发情、怀孕和幼仔护理都有专门观察。大熊猫列入 CITES 附录 I。",
      ),
    ],
    articles: [
      "IUCN 红色名录：Ailuropoda melanoleuca 评估（易危）",
      "CITES 附录：Ailuropoda melanoleuca 列入附录 I",
    ],
  },
  "rhesus-macaque": {
    wildLifespan: "野外约 15–20 年",
    characteristics: [
      {
        title: "可以暂存食物的颊囊",
        description: "猕猴口腔两侧有颊囊，能在争夺激烈时先把果实或种子塞进去，再到安全的地方慢慢吃。这不是疾病，而是旧大陆猴常见的取食结构。",
      },
      {
        title: "从山地到城边都能生活",
        description: "猕猴从南亚分布到中国南方和东南亚，森林、河边和寺庙、农田边缘都能看到。能利用人类留下的食物，是它分布很广的原因之一，也因此更容易和人发生冲突。",
      },
    ],
    wildVsZoo: [
      food(
        "杂食。果实、种子、嫩叶是常见食物，也会翻找昆虫、鸟蛋和小型动物。",
        "用蔬果、谷物和配方饲料搭配，并把一部分食物藏在丰容器里，减少抢食。",
      ),
      range(
        "成群生活，群里有清楚的位次。互相理毛用来维系关系，也能把位次做出来。",
        "合群饲养时要给低位个体留出躲开的路线和遮挡，否则取食和休息都会被高位个体占住。",
      ),
      care(
        "野外的主要风险是交通事故、犬只和被人投喂后的冲突。",
        "定期看牙齿和体重，并避免游客直接投喂。猕猴列入 CITES 附录 II。",
      ),
    ],
    articles: [
      "IUCN 红色名录：Macaca mulatta 评估（无危）",
      "CITES 附录：Macaca mulatta 列入附录 II",
    ],
  },
  giraffe: {
    wildLifespan: "野外约 15–20 年",
    wildVsZoo: [
      food(
        "主要吃金合欢等高处的叶子、花和嫩枝，用长舌把带刺的枝条卷下来。",
        "把牧草和树枝放到够得着又不必一直低头的高度。一次给太多软嫩饲料，并不等于更接近野外食性。",
      ),
      range(
        "松散地聚在一起，没有狮子那种固定的家族群。很高的血压把血液送到大脑，低头喝水时还要调整姿势。",
        "室内高度、地面软硬和进出门的尺寸都要按成体脖子来设计。低头喝水的动作也要有足够空间。",
      ),
      care(
        "栖息地分割和盗猎使一些地区的野生长颈鹿数量下降。",
        "蹄部和颈部受伤需要兽医处理。长颈鹿列入 CITES 附录 II。",
      ),
    ],
    articles: [
      "IUCN 红色名录：Giraffa camelopardalis 评估（易危）",
      "CITES 附录：Giraffa camelopardalis 列入附录 II",
    ],
  },
  puma: {
    articles: [
      "IUCN 红色名录：Puma concolor 评估（无危）",
      "CITES 附录：Puma concolor 列入附录 II",
    ],
  },
};

export function applySpeciesContentPatch(species: Species): Species | null {
  const patch = patches[species.id];
  if (!patch) return null;
  const next = cloneSpecies(species);
  let changed = false;

  if (patch.wildLifespan && !next.basicInfo.wildLifespan?.trim()) {
    next.basicInfo.wildLifespan = patch.wildLifespan;
    changed = true;
  }
  if (patch.dietFrom && patch.dietTo && next.basicInfo.diet === patch.dietFrom) {
    next.basicInfo.diet = patch.dietTo;
    changed = true;
  }
  if (appendByKey(next.characteristics, patch.characteristics, (item) => item.title)) changed = true;
  if (appendByKey(next.faqs, patch.faqs, (item) => item.q)) changed = true;
  next.wildVsZoo ||= [];
  if (appendByKey(next.wildVsZoo, patch.wildVsZoo, (item) => item.title)) changed = true;
  if (appendByKey(next.extendedReading.articles, patch.articles, (item) => item)) changed = true;

  return changed ? next : null;
}

function appendByKey<T>(target: T[], incoming: T[] | undefined, keyOf: (item: T) => string): boolean {
  if (!incoming?.length) return false;
  const seen = new Set(target.map((item) => keyOf(item).trim()));
  let changed = false;
  for (const item of incoming) {
    const key = keyOf(item).trim();
    if (!key || seen.has(key)) continue;
    target.push(item);
    seen.add(key);
    changed = true;
  }
  return changed;
}

function cloneSpecies(species: Species): Species {
  return {
    ...species,
    aliases: species.aliases ? [...species.aliases] : undefined,
    biologicalProfile: { ...species.biologicalProfile },
    basicInfo: { ...species.basicInfo },
    characteristics: species.characteristics.map((item) => ({ ...item })),
    faqs: species.faqs.map((item) => ({ ...item })),
    extendedReading: {
      congeneric: [...species.extendedReading.congeneric],
      confamilial: [...species.extendedReading.confamilial],
      articles: [...species.extendedReading.articles],
      courses: [...species.extendedReading.courses],
      videos: [...species.extendedReading.videos],
      creativeProducts: [...species.extendedReading.creativeProducts],
    },
    wildVsZoo: species.wildVsZoo?.map((item) => ({ ...item })),
  };
}
