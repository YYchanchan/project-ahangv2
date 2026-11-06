import type { Species } from "../types";

/**
 * Preset library entry for the Chinese pangolin.
 * Popular-science copy written for this archive; protection status follows
 * the IUCN Red List (Critically Endangered) and CITES Appendix I.
 */
export const CHINESE_PANGOLIN: Species = {
  id: "chinese-pangolin",
  aliases: ["穿山甲", "中国穿山甲", "鲮鲤"],
  biologicalProfile: {
    chineseName: "中华穿山甲",
    englishName: "Chinese Pangolin",
    latinName: "Manis pentadactyla",
    kingdom: "Animalia（动物界）",
    phylum: "Chordata（脊索动物门）",
    className: "Mammalia（哺乳纲）",
    order: "Pholidota（鳞甲目）",
    family: "Manidae（穿山甲科）",
    genus: "Manis（穿山甲属）",
    species: "Manis pentadactyla",
  },
  basicInfo: {
    wildLifespan: "缺少可靠的长期野外追踪，暂不能给出确切寿命",
    captiveLifespan: "人工饲养难度很高，能稳定存活的记录仍然很少",
    weight: "约 2–7 kg",
    sizeHeight: "头体长约 40–58 cm，尾长约 25–40 cm",
    diet: "专食蚂蚁和白蚁",
    socialStructure: "独居，除育幼期外很少与同类长时间相伴",
    activityTime: "主要为夜行性，白天多在洞穴中休息",
    reproduction: "胎生，通常一胎一仔；幼兽鳞片初生时较软，会攀附在母兽尾部",
    distribution: "历史上见于中国秦岭以南，以及喜马拉雅南麓到中南半岛北部。现今野外种群高度破碎，许多原分布区已多年缺少可靠记录。",
    habitat: "亚热带森林、灌丛和有丰富蚁类、白蚁的山地；常用前爪挖掘洞穴",
    iucnStatus: "CR（极危）",
    citesStatus: "附录 I",
  },
  characteristics: [
    {
      title: "一身角质鳞甲",
      description: "中华穿山甲背面和尾部覆盖着彼此重叠的角质鳞片。鳞片的成分接近毛发和指甲，并不是骨质甲板，也不能当作药物。受到威胁时，它会把头部收进腹下，卷成几乎密闭的球，让鳞片朝外。",
    },
    {
      title: "没有牙齿的食蚁专家",
      description: "穿山甲没有咀嚼用的牙齿。它靠敏锐的嗅觉找到蚁巢，用粗壮的前爪扒开泥土或朽木，再把细长、带黏液的舌头探进去舔食蚂蚁和白蚁。胃里的角质褶皱和吞下的细沙帮助磨碎食物。",
    },
    {
      title: "既会掘洞，也会攀爬",
      description: "中华穿山甲在地面活动时步态谨慎，遇到合适的坡地会挖出休息洞和育幼洞。它也能用尾部和爪子抓住树干。洞穴除了提供白天的隐蔽处，还能帮助它躲开部分天敌和极端天气。",
    },
    {
      title: "非法贸易是主要威胁",
      description: "鳞片和肉类贸易曾使中华穿山甲被大量猎捕。国际商业性贸易已被禁止，中国亦将其列为国家一级重点保护野生动物。种群恢复仍然缓慢，因为繁殖力低，而且适合的栖息地还在减少。",
    },
  ],
  faqs: [
    {
      q: "穿山甲是爬行动物吗？",
      a: "不是。中华穿山甲是哺乳动物，属于鳞甲目。它有毛发的痕迹、哺乳、体温相对稳定，幼兽由母兽哺育。身上的鳞片只是角蛋白形成的保护结构。",
    },
    {
      q: "中华穿山甲和马来穿山甲怎么区分？",
      a: "两者都是亚洲的穿山甲。中华穿山甲耳廓更明显，鳞片边缘通常较锐，尾部相对较短；马来穿山甲鳞片更多、体型在亚洲种类里往往更大。准确鉴定还要结合产地、鳞片排列和测量数据，不能只看一张远景照片。",
    },
    {
      q: "鳞片为什么不能入药？",
      a: "鳞片的主要成分是角蛋白，和头发、指甲同类。现有医学证据不能支持把它当作药材。购买、运输和食用穿山甲及其制品在法律上受到严格限制，也会直接刺激盗猎。",
    },
    {
      q: "为什么动物园里很少见到穿山甲？",
      a: "穿山甲对饲料、温度、洞穴和安静环境都很敏感，人工提供蚂蚁和白蚁并不容易，应激后也容易拒食。再加上野生种群极危，负责任的机构不会为了展示而随意捕捉。所以物种页可以先讲清科学事实，个体档案则要等有可核验的圈养或救助记录再建立。",
    },
  ],
  extendedReading: {
    congeneric: [
      "马来穿山甲（Manis javanica）",
      "印度穿山甲（Manis crassicaudata）",
      "菲律宾穿山甲（Manis culionensis）",
    ],
    confamilial: [
      "大穿山甲（Smutsia gigantea）",
      "南非穿山甲（Smutsia temminckii）",
      "树穿山甲（Phataginus tricuspis）",
      "长尾穿山甲（Phataginus tetradactyla）",
    ],
    articles: [
      "IUCN 红色名录：中华穿山甲评估说明",
      "CITES 附录 I：穿山甲属国际贸易限制",
    ],
    courses: [
      "国家重点保护野生动物识别：鳞甲目",
      "食蚁性哺乳动物的饲料与应激管理",
    ],
    videos: [
      "夜行性掘洞动物的野外观察入门",
      "鳞片是角蛋白：穿山甲保护科普",
    ],
    creativeProducts: [
      "鳞甲目科普手账",
      "中华穿山甲物种卡",
    ],
  },
  wildVsZoo: [
    {
      title: "食物来源 Diet & Feeding",
      wild: "在森林和灌丛中自行寻找蚁巢与白蚁巢，食物种类随季节变化，取食路线往往很分散。",
      zoo: "需要专门准备蚂蚁、白蚁或经过验证的替代饲料，并观察是否拒食。个体档案只记录这只动物实际吃了什么，不把物种食性重写一遍。",
    },
    {
      title: "行为与空间 Behavior & Range",
      wild: "夜间单独活动，靠嗅觉和挖掘探索较大范围，白天躲在自己挖掘或改用的洞穴里。",
      zoo: "展区或救助舍要提供可挖掘的垫层、隐蔽洞穴和夜间活动时间。白天游客过多时，它可能一直缩在洞里。",
    },
    {
      title: "安全与照护 Safety & Care",
      wild: "主要压力来自盗猎、犬只和栖息地丧失。受伤个体很难自己恢复，鳞片贸易还会把整个种群拖入极危。",
      zoo: "合法机构重点是减少应激、处理寄生虫和外伤，并避免把动物暴露在可被交易的语境里。保护等级和贸易限制写在物种页，不由每只个体的投稿者重复填写。",
    },
  ],
};
