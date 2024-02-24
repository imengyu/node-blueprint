<template>
  <div class="prop-box">  
    <Input v-model="filterProp" class="prop-search" placeholder="搜索属性">
      <template #prefix>
        <Icon icon="icon-search-" />
      </template>
    </Input>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { provide, ref, type Ref } from 'vue';
import MathUtils from '@/node-blueprint/Base/Utils/MathUtils';
import Input from '@/node-blueprint/Editor/Nana/Input/Input.vue';
import Icon from '@/node-blueprint/Editor/Nana/Icon.vue';

export interface PropBoxContext {
  gridSize: Ref<number>,
  filterProp: Ref<string>,
  updateGridSize: (size: number) => void,
}

const props = defineProps({
  gridMaxWidth: {
    type: Number,
    default: 0.8,
  },
  gridMinWidth: {
    type: Number,
    default: 0.2,
  },
});

const gridSize = ref(0.3);
const filterProp = ref("");

provide<PropBoxContext>('PropBoxContext', {
  gridSize,
  filterProp,
  updateGridSize(size: number) {
    gridSize.value = MathUtils.limitNumber(size, props.gridMinWidth, props.gridMaxWidth);
  },
});

</script>

<style lang="scss">
.prop-search {
  margin: 5px 10px;
  padding: 2px 4px;
  border-radius: 4px;
  background-color: var(--mx-editor-background-color);
  border: 1px solid var(--mx-editor-border-color);
  color: var(--mx-editor-text-color);

  input {
    background-color: transparent;
    color: var(--mx-editor-text-color);
  }
}
.prop-box {
  display: flex;
  flex-direction: column;
  background-color: var(--mx-editor-background-second-color);
  border-radius: var(--mx-editor-border-radius-small);
  margin: 0 0 0 var(--mx-editor-border-radius-small);
}
</style>