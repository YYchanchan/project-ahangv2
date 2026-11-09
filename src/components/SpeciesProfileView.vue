<script setup lang="ts">
import { computed } from "vue";
import type { Species } from "../types";

const props = defineProps<{
  species: Species;
  anchorName?: string;
}>();

const emit = defineEmits<{
  notify: [message: string];
}>();

const profile = computed(() => props.species.biologicalProfile);

const speciesBasicInfo = computed(() => {
  const info = props.species.basicInfo;
  return [
    { icon: "🏡", label: "平均寿命（动物园）", value: info.captiveLifespan },
    { icon: "🌲", label: "野外寿命", value: info.wildLifespan },
    { icon: "⚖️", label: "成年体重", value: info.weight },
    { icon: "📏", label: "体型特征", value: info.sizeHeight },
    { icon: "🥩", label: "食性", value: info.diet },
    { icon: "👥", label: "社会结构", value: info.socialStructure },
    { icon: "🌙", label: "活动时间", value: info.activityTime },
    { icon: "🐾", label: "繁殖方式", value: info.reproduction },
    { icon: "🗺️", label: "分布区域", value: info.distribution },
    { icon: "🌿", label: "栖息环境", value: info.habitat },
    { icon: "🛡️", label: "IUCN 保护等级", value: info.iucnStatus },
    { icon: "📜", label: "CITES 等级", value: info.citesStatus },
  ].filter((item) => item.value);
});

const taxonomyCards = computed(() => [
  { label: "界 Kingdom", value: profile.value.kingdom },
  { label: "门 Phylum", value: profile.value.phylum },
  { label: "纲 Class", value: profile.value.className },
  { label: "目 Order", value: profile.value.order },
  { label: "科 Family", value: profile.value.family },
  { label: "属 Genus", value: profile.value.genus },
  { label: "种 Species", value: profile.value.species, highlighted: true },
]);

const taxonomyTree = computed(() => {
  const nodes: Array<{ symbol: string; label: string; name: string; description: string; primary?: "red" | "green" } | null> = [
    props.anchorName
      ? { symbol: "★", label: "个体", name: props.anchorName, description: "当前正在查看的个体", primary: "red" }
      : null,
    { symbol: "v", label: "物种", name: profile.value.chineseName, description: profile.value.latinName, primary: "green" },
    { symbol: "2", label: "属 Genus", name: profile.value.genus.split(" ")[0], description: "亲缘属级分类" },
    { symbol: "3", label: "科 Family", name: profile.value.family.split(" ")[0], description: "特化科级门类" },
    { symbol: "4", label: "目 Order", name: profile.value.order.split(" ")[0], description: "动物分类目级" },
    { symbol: "5", label: "纲 Class", name: profile.value.className.split(" ")[0], description: "哺乳纲" },
    { symbol: "6", label: "门 Phylum", name: profile.value.phylum.split(" ")[0], description: "脊索动物门" },
    { symbol: "7", label: "界 Kingdom", name: profile.value.kingdom.split(" ")[0], description: "动物界" },
  ];
  return nodes.filter((item): item is NonNullable<typeof item> => Boolean(item));
});

const readingGroups = computed(() => {
  const reading = props.species.extendedReading;
  return [
    { title: "同属物种", items: reading.congeneric },
    { title: "同科参考", items: reading.confamilial },
    { title: "延伸阅读", items: reading.articles },
    { title: "课程", items: reading.courses },
    { title: "影像", items: reading.videos },
    { title: "科普产品", items: reading.creativeProducts },
  ].filter((group) => group.items?.length);
});
</script>

<template>
  <view class="species-profile">
    <view class="species-heading">
      <text>🔬</text>
      <view>
        <text>认识这个物种</text>
        <text v-if="anchorName">通过 {{ anchorName }}，认识 {{ profile.chineseName }}。这份科普来自同一条物种记录，同一物种的每只个体都显示它；编辑一次，全部同步。</text>
        <text v-else>{{ profile.englishName }} · {{ profile.latinName }}。同一物种的每只个体都显示这份科普。</text>
      </view>
    </view>

    <view class="subsection-title"><text>📄 生物身份证 (Biological Profile)</text><text>SPECIES ID CARD</text></view>
    <view class="species-id-card">
      <view class="species-id-card__primary">
        <view><text>中文名称</text><text>{{ profile.chineseName }}</text></view>
        <view><text>英文名称</text><text>{{ profile.englishName }}</text></view>
        <view><text>学名 (拉丁文)</text><text>{{ profile.latinName }}</text></view>
      </view>
      <view class="taxonomy-grid">
        <view v-for="tax in taxonomyCards" :key="tax.label" :class="{ highlighted: tax.highlighted }">
          <text>{{ tax.label }}</text><text>{{ tax.value }}</text>
        </view>
      </view>
    </view>

    <view class="subsection-title"><text>📊 基本资料 (Species Specifications)</text></view>
    <view class="species-info-grid">
      <view v-for="info in speciesBasicInfo" :key="info.label">
        <text>{{ info.icon }}</text>
        <view><text>{{ info.label }}</text><text>{{ info.value }}</text></view>
      </view>
    </view>

    <view v-if="species.characteristics.length" class="species-block">
      <view class="subsection-title"><text>✨ 物种独特习性 (Evolutionary Trait)</text></view>
      <view v-for="(trait, index) in species.characteristics" :key="trait.title" class="trait-card">
        <view class="trait-card__title"><text>0{{ index + 1 }}</text><text>{{ trait.title }}</text></view>
        <text>{{ trait.description }}</text>
      </view>
    </view>

    <view class="species-block">
      <view class="subsection-title"><text>🌱 分类关系 (Taxonomy)</text></view>
      <view class="taxonomy-tree">
        <text>从个体到自然分类界限。</text>
        <button
          v-for="node in taxonomyTree"
          :key="node.label"
          @click="emit('notify', `【${node.label}】${node.name}`)"
        >
          <text :class="[`primary-${node.primary || 'plain'}`]">{{ node.symbol }}</text>
          <view>
            <view class="taxonomy-node__name"><text>{{ node.name }}</text><text>({{ node.label }})</text></view>
            <text>{{ node.description }}</text>
          </view>
          <text>›</text>
        </button>
      </view>
    </view>

    <view v-if="species.wildVsZoo?.length" class="species-block wild-zoo">
      <view class="subsection-title"><text>🦁 野外 vs 动物园 (Wild vs Zoo)</text></view>
      <view v-for="item in species.wildVsZoo" :key="item.title" class="wild-zoo__card">
        <text>{{ item.title }}</text>
        <view>
          <view><text>🌲 野外 (Wild)</text><text>{{ item.wild }}</text></view>
          <view><text>🏡 动物园 (Zoo)</text><text>{{ item.zoo }}</text></view>
        </view>
      </view>
    </view>

    <view v-if="species.faqs.length" class="species-block">
      <view class="subsection-title"><text>❓ 常见问题</text></view>
      <view v-for="item in species.faqs" :key="item.q" class="faq-card">
        <text>{{ item.q }}</text>
        <text>{{ item.a }}</text>
      </view>
    </view>

    <view v-if="readingGroups.length" class="species-block">
      <view class="subsection-title"><text>📚 延伸阅读</text></view>
      <view v-for="group in readingGroups" :key="group.title" class="reading-group">
        <text>{{ group.title }}</text>
        <text v-for="item in group.items" :key="item">{{ item }}</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
button {
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  line-height: 1.2;
}

button::after {
  display: none;
}

.species-profile {
  display: flex;
  flex-direction: column;
}

.species-heading {
  display: flex;
  gap: 9px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0ece7;
}

.species-heading > text:first-child {
  font-size: 14px;
  line-height: 1;
}

.species-heading > view {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.species-heading > view text:first-child {
  color: #292524;
  font-family: Georgia, "Songti SC", serif;
  font-size: 14px;
  font-weight: 700;
}

.species-heading > view text:last-child {
  color: #78716c;
  font-family: Georgia, "Songti SC", serif;
  font-size: 9px;
  line-height: 1.5;
}

.subsection-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18px;
  color: #44403c;
  font-family: Georgia, "Songti SC", serif;
  font-size: 14px;
  font-weight: 700;
}

.subsection-title text:last-child:not(:first-child) {
  padding: 2px 5px;
  border-radius: 4px;
  background: #f1f5f9;
  color: #5a6b7c;
  font-family: monospace;
  font-size: 7px;
  letter-spacing: 1px;
}

.species-id-card {
  margin-top: 9px;
  padding: 14px;
  border: 1px solid rgba(217, 195, 176, 0.55);
  border-radius: 15px;
  background: #faf8f5;
}

.species-id-card__primary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e7e5e4;
}

.species-id-card__primary > view,
.taxonomy-grid > view,
.species-info-grid > view,
.trait-card,
.faq-card,
.reading-group,
.wild-zoo__card {
  min-width: 0;
}

.species-id-card__primary > view {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 5px;
  border: 1px solid #e7e5e4;
  border-radius: 10px;
  background: #fff;
  text-align: center;
}

.species-id-card__primary text:first-child,
.taxonomy-grid text:first-child {
  color: #a8a29e;
  font-size: 9px;
  line-height: 1.35;
}

.species-id-card__primary text:last-child {
  overflow-wrap: anywhere;
  color: #292524;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.4;
}

.species-id-card__primary > view:last-child text:last-child {
  color: #b83b26;
  font-family: Georgia, serif;
  font-style: italic;
}

.taxonomy-grid,
.species-info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
}

.taxonomy-grid {
  padding-top: 10px;
}

.species-info-grid {
  gap: 7px;
  padding-top: 9px;
}

.taxonomy-grid > view,
.species-info-grid > view {
  display: flex;
  gap: 7px;
  padding: 7px 9px;
  border: 1px solid #e7e5e4;
  border-radius: 9px;
  background: #fff;
}

.species-info-grid > view {
  padding: 9px;
  border-color: #eeeae6;
  background: rgba(250, 248, 245, 0.65);
}

.taxonomy-grid > view.highlighted {
  border-color: #a7f3d0;
  background: #ecfdf5;
}

.taxonomy-grid text:last-child,
.species-info-grid text:last-child,
.trait-card > text:last-child,
.faq-card text:last-child,
.reading-group text,
.wild-zoo__card text {
  overflow-wrap: anywhere;
}

.taxonomy-grid > view {
  flex-direction: column;
  gap: 3px;
}

.taxonomy-grid text:last-child {
  color: #44403c;
  font-size: 10px;
  font-weight: 700;
  line-height: 1.4;
}

.species-info-grid > view > view {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 3px;
}

.species-info-grid > view > view text:first-child {
  color: #a8a29e;
  font-size: 8px;
}

.species-info-grid > view > view text:last-child {
  color: #44403c;
  font-family: Georgia, "Songti SC", serif;
  font-size: 9px;
  font-weight: 700;
  line-height: 1.45;
}

.trait-card,
.faq-card,
.reading-group,
.wild-zoo__card {
  margin-top: 8px;
  padding: 11px;
  border: 1px solid #f0ece7;
  border-radius: 11px;
  background: #fafaf9;
}

.trait-card,
.faq-card,
.reading-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.trait-card__title {
  display: flex;
  align-items: center;
  gap: 5px;
  color: #2f5233;
  font-size: 10px;
  font-weight: 700;
}

.trait-card__title text:first-child {
  padding: 2px 4px;
  border-radius: 4px;
  background: rgba(47, 82, 51, 0.08);
  font-family: monospace;
  font-size: 8px;
}

.trait-card > text:last-child,
.faq-card text:last-child,
.reading-group text {
  color: #57534e;
  font-family: Georgia, "Songti SC", serif;
  font-size: 9px;
  line-height: 1.65;
}

.faq-card text:first-child,
.reading-group > text:first-child {
  color: #292524;
  font-size: 11px;
  font-weight: 700;
}

.taxonomy-tree {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 9px;
  padding: 13px;
  border: 1px solid #e7e5e4;
  border-radius: 14px;
  background: #faf8f5;
}

.taxonomy-tree > text {
  padding-bottom: 6px;
  color: #a8a29e;
  font-family: Georgia, serif;
  font-size: 8px;
  text-align: center;
}

.taxonomy-tree button {
  display: grid;
  grid-template-columns: 28px 1fr auto;
  gap: 9px;
  align-items: center;
  width: 100%;
  padding: 5px;
  text-align: left;
}

.taxonomy-tree button > text:first-child {
  display: flex;
  width: 27px;
  height: 27px;
  align-items: center;
  justify-content: center;
  border: 1px solid #d6d3d1;
  border-radius: 50%;
  background: #fff;
  color: #57534e;
  font-family: monospace;
  font-size: 8px;
  font-weight: 700;
}

.taxonomy-tree button > text.primary-red {
  border-color: #b83b26;
  background: #b83b26;
  color: #fff;
}

.taxonomy-tree button > text.primary-green {
  border-color: #2f5233;
  background: #2f5233;
  color: #fff;
}

.taxonomy-tree button > view {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.taxonomy-node__name {
  display: flex;
  align-items: baseline;
  gap: 3px;
  color: #44403c;
  font-size: 9px;
  font-weight: 700;
}

.taxonomy-node__name text:last-child,
.taxonomy-tree button > view > text:last-child,
.taxonomy-tree button > text:last-child {
  color: #a8a29e;
  font-size: 8px;
  font-weight: 400;
}

.wild-zoo {
  margin-top: 15px;
  padding-top: 2px;
  border-top: 1px solid #f5f5f4;
}

.wild-zoo__card > text {
  display: block;
  padding-bottom: 7px;
  border-bottom: 1px solid rgba(217, 195, 176, 0.45);
  color: #44403c;
  font-size: 9px;
  font-weight: 700;
}

.wild-zoo__card > view {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding-top: 8px;
}

.wild-zoo__card > view > view {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px;
  border: 1px solid #f0ece7;
  border-radius: 9px;
  background: #fff;
}

.wild-zoo__card > view > view text:first-child {
  color: #2f5233;
  font-size: 8px;
  font-weight: 700;
}

.wild-zoo__card > view > view:first-child text:first-child {
  color: #78716c;
}

.wild-zoo__card > view > view text:last-child {
  color: #57534e;
  font-family: Georgia, "Songti SC", serif;
  font-size: 8px;
  line-height: 1.55;
}
</style>
