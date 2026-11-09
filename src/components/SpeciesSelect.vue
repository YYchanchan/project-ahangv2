<script setup lang="ts">
import { computed, ref } from "vue";
import type { Species } from "../types";
import { UNCERTAIN_SPECIES_CODE, speciesOptionLabel } from "../data/speciesResolver";

const props = defineProps<{
  species: Species[];
  modelValue: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const query = ref("");

const filteredSpecies = computed(() => {
  const keyword = query.value.trim().toLowerCase();
  const matches = props.species.filter((item) => {
    if (!keyword) return true;
    const profile = item.biologicalProfile;
    return [item.id, profile.chineseName, profile.englishName, profile.latinName, ...(item.aliases || [])]
      .join(" ")
      .toLowerCase()
      .includes(keyword);
  });
  return matches.slice(0, 8);
});

const selectedLabel = computed(() => {
  if (props.modelValue === UNCERTAIN_SPECIES_CODE) return "不确定 / 待核实";
  const selected = props.species.find((item) => item.id === props.modelValue);
  return selected ? speciesOptionLabel(selected) : "请从物种库选择";
});

function choose(id: string) {
  if (props.disabled) return;
  emit("update:modelValue", id);
}
</script>

<template>
  <view class="species-select" :class="{ 'species-select--disabled': disabled }">
    <text class="species-select__current">{{ selectedLabel }}</text>
    <input
      v-model="query"
      :disabled="disabled"
      placeholder="搜索中文名、英文名、拉丁名或别名"
      confirm-type="search"
    />
    <button type="button" :class="{ active: modelValue === UNCERTAIN_SPECIES_CODE }" :disabled="disabled" @click="choose(UNCERTAIN_SPECIES_CODE)">
      <text>不确定 / 待核实</text>
      <text>先记下这只个体，物种以后由审核人员补上</text>
    </button>
    <view v-if="filteredSpecies.length" class="species-select__list">
      <button
        v-for="item in filteredSpecies"
        :key="item.id"
        type="button"
        :class="{ active: modelValue === item.id }"
        :disabled="disabled"
        @click="choose(item.id)"
      >
        <text>{{ item.biologicalProfile.chineseName }}</text>
        <text>{{ item.biologicalProfile.englishName }} · {{ item.biologicalProfile.latinName }}</text>
      </button>
    </view>
    <text v-else class="species-select__empty">物种库里没有匹配的名称。可以改为“不确定 / 待核实”。</text>
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

.species-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.species-select__current {
  color: #292524;
  font-size: 13px;
  font-weight: 700;
}

.species-select input {
  width: 100%;
  height: 43px;
  padding: 0 12px;
  border: 1px solid #e7e5e4;
  border-radius: 11px;
  background: #fff;
  color: #44403c;
  font-size: 11px;
  line-height: 43px;
}

.species-select > button,
.species-select__list button {
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  border: 1px solid #e7e5e4;
  border-radius: 11px;
  background: #fff;
  text-align: left;
}

.species-select > button text:first-child,
.species-select__list button text:first-child {
  color: #292524;
  font-size: 12px;
  font-weight: 700;
}

.species-select > button text:last-child,
.species-select__list button text:last-child {
  color: #78716c;
  font-size: 10px;
}

.species-select button.active {
  border-color: #2f5233;
  background: #f3f7f3;
}

.species-select__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.species-select__empty {
  color: #a8a29e;
  font-size: 10px;
}

.species-select--disabled {
  opacity: 0.6;
}
</style>
