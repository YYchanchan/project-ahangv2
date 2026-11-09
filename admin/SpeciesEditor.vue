<script setup lang="ts">
import { ref, watch } from "vue";
import type { Species } from "../src/types";

const props = defineProps<{
  species: Species;
  isNew: boolean;
}>();

const aliasText = ref("");
const readingText = ref({
  congeneric: "",
  confamilial: "",
  articles: "",
  courses: "",
  videos: "",
  creativeProducts: "",
});

watch(
  () => props.species,
  (species) => {
    aliasText.value = (species.aliases || []).join("\n");
    const reading = species.extendedReading;
    readingText.value = {
      congeneric: reading.congeneric.join("\n"),
      confamilial: reading.confamilial.join("\n"),
      articles: reading.articles.join("\n"),
      courses: reading.courses.join("\n"),
      videos: reading.videos.join("\n"),
      creativeProducts: reading.creativeProducts.join("\n"),
    };
  },
  { immediate: true },
);

function commitLists() {
  props.species.aliases = lines(aliasText.value);
  props.species.extendedReading = {
    congeneric: lines(readingText.value.congeneric),
    confamilial: lines(readingText.value.confamilial),
    articles: lines(readingText.value.articles),
    courses: lines(readingText.value.courses),
    videos: lines(readingText.value.videos),
    creativeProducts: lines(readingText.value.creativeProducts),
  };
}

function lines(value: string): string[] {
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function addCharacteristic() {
  props.species.characteristics.push({ title: "", description: "" });
}

function addFaq() {
  props.species.faqs.push({ q: "", a: "" });
}

function addComparison() {
  props.species.wildVsZoo ||= [];
  props.species.wildVsZoo.push({ title: "", wild: "", zoo: "" });
}

defineExpose({ commitLists });
</script>

<template>
  <div class="species-editor" @focusout="commitLists">
    <p class="editor-note">科普只保存在这一条物种记录上。保存后，所有关联到它的个体都会显示同一份内容，不用逐只复制。</p>
    <div class="form-grid">
      <label><span>物种编号</span><input v-model="species.id" :disabled="!isNew" placeholder="留空时按英文名生成，如 african-lion" /></label>
      <label><span>中文名 *</span><input v-model="species.biologicalProfile.chineseName" placeholder="如：中华穿山甲" /></label>
      <label><span>英文名</span><input v-model="species.biologicalProfile.englishName" placeholder="如：Chinese Pangolin" /></label>
      <label><span>拉丁学名</span><input v-model="species.biologicalProfile.latinName" placeholder="如：Manis pentadactyla" /></label>
      <label class="full"><span>别名（一行一个，方便搜索和关联）</span><textarea v-model="aliasText" rows="3" placeholder="穿山甲&#10;中国穿山甲"></textarea></label>
      <label><span>界</span><input v-model="species.biologicalProfile.kingdom" placeholder="Animalia（动物界）" /></label>
      <label><span>门</span><input v-model="species.biologicalProfile.phylum" placeholder="Chordata（脊索动物门）" /></label>
      <label><span>纲</span><input v-model="species.biologicalProfile.className" placeholder="Mammalia（哺乳纲）" /></label>
      <label><span>目</span><input v-model="species.biologicalProfile.order" placeholder="Pholidota（鳞甲目）" /></label>
      <label><span>科</span><input v-model="species.biologicalProfile.family" placeholder="Manidae（穿山甲科）" /></label>
      <label><span>属</span><input v-model="species.biologicalProfile.genus" placeholder="Manis（穿山甲属）" /></label>
      <label class="full"><span>种</span><input v-model="species.biologicalProfile.species" placeholder="Manis pentadactyla" /></label>
      <label><span>IUCN 保护等级</span><input v-model="species.basicInfo.iucnStatus" placeholder="如：CR（极危）" /></label>
      <label><span>CITES</span><input v-model="species.basicInfo.citesStatus" placeholder="如：附录 I" /></label>
      <label><span>体重</span><input v-model="species.basicInfo.weight" /></label>
      <label><span>体型</span><input v-model="species.basicInfo.sizeHeight" /></label>
      <label><span>动物园寿命</span><input v-model="species.basicInfo.captiveLifespan" /></label>
      <label><span>野外寿命</span><input v-model="species.basicInfo.wildLifespan" /></label>
      <label><span>食性</span><input v-model="species.basicInfo.diet" /></label>
      <label><span>社会结构</span><input v-model="species.basicInfo.socialStructure" /></label>
      <label><span>活动时间</span><input v-model="species.basicInfo.activityTime" /></label>
      <label><span>繁殖</span><input v-model="species.basicInfo.reproduction" /></label>
      <label class="full"><span>分布</span><textarea v-model="species.basicInfo.distribution" rows="3"></textarea></label>
      <label class="full"><span>栖息环境</span><textarea v-model="species.basicInfo.habitat" rows="3"></textarea></label>
    </div>

    <section class="editor-block">
      <header><h3>物种习性</h3><button type="button" @click="addCharacteristic">添加一条</button></header>
      <div v-for="(item, index) in species.characteristics" :key="index" class="repeat-card">
        <input v-model="item.title" placeholder="标题" />
        <textarea v-model="item.description" rows="3" placeholder="这段科普写物种，不写某一只个体"></textarea>
        <button type="button" class="text-danger" @click="species.characteristics.splice(index, 1)">删除</button>
      </div>
    </section>

    <section class="editor-block">
      <header><h3>野外 vs 动物园</h3><button type="button" @click="addComparison">添加一组</button></header>
      <div v-for="(item, index) in species.wildVsZoo || []" :key="index" class="repeat-card">
        <input v-model="item.title" placeholder="对比主题，如食物来源" />
        <textarea v-model="item.wild" rows="2" placeholder="野外"></textarea>
        <textarea v-model="item.zoo" rows="2" placeholder="动物园"></textarea>
        <button type="button" class="text-danger" @click="species.wildVsZoo?.splice(index, 1)">删除</button>
      </div>
    </section>

    <section class="editor-block">
      <header><h3>常见问题</h3><button type="button" @click="addFaq">添加一问</button></header>
      <div v-for="(item, index) in species.faqs" :key="index" class="repeat-card">
        <input v-model="item.q" placeholder="问题" />
        <textarea v-model="item.a" rows="3" placeholder="回答"></textarea>
        <button type="button" class="text-danger" @click="species.faqs.splice(index, 1)">删除</button>
      </div>
    </section>

    <section class="editor-block">
      <header><h3>延伸阅读（一行一条）</h3></header>
      <div class="form-grid">
        <label><span>同属</span><textarea v-model="readingText.congeneric" rows="3"></textarea></label>
        <label><span>同科</span><textarea v-model="readingText.confamilial" rows="3"></textarea></label>
        <label><span>文章</span><textarea v-model="readingText.articles" rows="3"></textarea></label>
        <label><span>课程</span><textarea v-model="readingText.courses" rows="3"></textarea></label>
        <label><span>影像</span><textarea v-model="readingText.videos" rows="3"></textarea></label>
        <label><span>科普产品</span><textarea v-model="readingText.creativeProducts" rows="3"></textarea></label>
      </div>
    </section>
  </div>
</template>

<style scoped>
.editor-note {
  margin: 0 0 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #f3f7f3;
  color: #2f5233;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.6;
}

.editor-block {
  margin-top: 18px;
  padding-top: 8px;
  border-top: 1px solid #eeeae6;
}

.editor-block header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.editor-block h3 {
  margin: 8px 0;
  font-size: 14px;
}

.editor-block header button,
.repeat-card button {
  border: 0;
  background: transparent;
  color: #2f5233;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.repeat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #eeeae6;
  border-radius: 10px;
  background: #fafaf9;
}

.text-danger {
  align-self: flex-start;
  color: #b83b26 !important;
}
</style>
