import type { Species } from "../types";

/**
 * Inserted on API start only when no koala row exists.
 * Science follows the IUCN Red List account for Phascolarctos cinereus
 * and the 2022 Australian EPBC listing for the combined Queensland,
 * New South Wales and Australian Capital Territory populations.
 */
export const KOALA: Species = {
  id: "koala",
  aliases: ["树袋熊", "koala"],
  imageCredit: {
    author: "阿杭计划",
    license: "原创示意插画，不是野外或园内实拍",
    sourceUrl: "",
  },
  biologicalProfile: {
    chineseName: "考拉",
    englishName: "Koala",
    latinName: "Phascolarctos cinereus",
    kingdom: "Animalia（动物界）",
    phylum: "Chordata（脊索动物门）",
    className: "Mammalia（哺乳纲）",
    order: "Diprotodontia（双门齿目）",
    family: "Phascolarctidae（考拉科）",
    genus: "Phascolarctos（考拉属）",
    species: "Phascolarctos cinereus",
  },
  basicInfo: {
    wildLifespan: "野外大约 10–12 年，少数雌性更长",
    captiveLifespan: "动物园里常见活到十几岁，有接近 20 年的饲养记录",
    weight: "成体大约 4–15 kg。南部种群通常更大，雄性通常重于雌性",
    sizeHeight: "头体长大约 60–85 cm，尾巴几乎看不见",
    diet: "几乎只吃桉树叶，也会取食少数近缘树种的叶子。叶子纤维多、能量低，还含有需要分解的植物化合物，所以取食很挑树、挑叶",
    socialStructure: "多数时候独居。雄性的活动范围会盖住几只雌性的范围，靠胸口气味腺和叫声彼此辨认",
    activityTime: "以夜间和晨昏为主，一天里有很长时间在休息或睡觉",
    reproduction: "有袋类。孕期大约 35 天，通常一胎一只。幼仔出生后钻进育儿袋，继续发育约半年，之后还要趴在母亲背上",
    distribution: "澳大利亚东部和东南部，包括昆士兰、新南威尔士、维多利亚和南澳大利亚。中国没有野生种群，只可能在动物园见到个体",
    habitat: "有足够桉树的林地和森林。能用的树种、树的大小和叶片化学成分，比“有没有树林”更重要",
    iucnStatus: "VU（易危）。澳大利亚把昆士兰、新南威尔士和首都领地的合并种群在 2022 年列为濒危",
    citesStatus: "未列入 CITES 附录",
  },
  characteristics: [
    {
      title: "有袋类，不是熊",
      description: "考拉属于双门齿目的考拉科，和袋鼠一样是有袋类。幼仔在育儿袋里完成大部分发育。中文里的“树袋熊”容易让人以为它是熊，它和熊没有很近的亲缘关系。",
    },
    {
      title: "几乎只吃桉树叶",
      description: "桉树叶是它的主食，但不是每棵桉树、每片叶子都吃。它会按树种、部位和叶片状态挑选。这种食物能量低，所以它把大量时间用来休息，而不是到处奔跑。",
    },
    {
      title: "靠树生活",
      description: "有力的前肢、对生的指趾和粗糙的掌垫适合抱住树干。它在树冠里进食、休息和躲避地面上的危险，下树通常是为了换树或寻找新的采食点。",
    },
  ],
  faqs: [
    {
      q: "考拉是熊吗？",
      a: "不是。它是澳大利亚的有袋类，学名 Phascolarctos cinereus。熊属于食肉目。叫它树袋熊，只是中文俗名。",
    },
    {
      q: "考拉为什么睡那么久？",
      a: "桉树叶提供的能量很少，而且需要慢慢消化。长时间休息是在节省体力，不是因为缺少刺激。天气热或叶片水分不够时，它也会改变活动方式。",
    },
    {
      q: "考拉喝水吗？",
      a: "大部分水分来自桉树叶。干旱、高温或叶片太干时，它会下到地面或树干低处喝水。看见它喝水，往往说明环境已经很干燥。",
    },
  ],
  wildVsZoo: [
    {
      title: "食物来源",
      wild: "自己在活动范围内挑选合适的桉树和叶片。可用的树会随季节、干旱和火灾改变。",
      zoo: "由园方按食谱提供经过挑选的桉树叶，并记录采食量。叶子的种类和新鲜程度是饲养里最关键的部分。",
    },
    {
      title: "空间与活动",
      wild: "在连续或相接的林地里换树，活动范围随食物和个体而变。地面上有道路、狗和车辆等风险。",
      zoo: "生活在有攀爬结构和遮荫的展区。换树、休息和躲避都发生在人工安排的空间里，不能代表野外的活动距离。",
    },
    {
      title: "健康与威胁",
      wild: "栖息地破碎、干旱、林火、疾病、狗和车辆都会影响野外种群。衣原体感染在一些种群里很常见。",
      zoo: "有兽医、定期检查和稳定的食物。个体的健康记录不能直接当成野外种群的状况。",
    },
  ],
  extendedReading: {
    congeneric: [],
    confamilial: [],
    articles: [
      "IUCN Red List：Phascolarctos cinereus（考拉，易危）",
      "Australian Government，Environment Protection and Biodiversity Conservation Act：昆士兰、新南威尔士和首都领地合并种群于 2022 年列为 Endangered",
    ],
    courses: [],
    videos: [],
    creativeProducts: [],
  },
};
