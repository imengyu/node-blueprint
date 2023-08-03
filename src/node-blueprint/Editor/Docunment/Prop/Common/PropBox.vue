<template>
  <div class="prop-box">  
    <Input v-model="filterProp" class="prop-search">
      <template #suffix>
        <Icon icon="icon-search" />
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
    default: 1,
  },
  gridMinWidth: {
    type: Number,
    default: 0.2,
  },
});

const gridSize = ref(0.5);
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

.prop-box {
  display: flex;
  flex-direction: column;

  .prop-search {
    margin: 5px 10px;
    padding: 2px 4px;
    border-radius: 4px;
    background-color: var(--mx-editor-backgroud);
    border: 1px solid var(--mx-editor-border-color);
    color: var(--mx-editor-text-color);

    input {
      background-color: transparent!important;
      color: var(--mx-editor-text-color)!important;
    }
  }
}
</style>