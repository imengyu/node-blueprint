<template>
  <div ref="selectBox" class="node-simple-box" @click="onPickType">
    <NodeParamTypeRender :type="modelValue" />
  </div>
</template>

<script setup lang="ts">
import { inject, ref, type PropType } from 'vue';
import NodeParamTypeRender from '../../Small/NodeParamTypeRender.vue';
import type { NodeParamType } from '@/node-blueprint/Base/Flow/Type/NodeParamType';
import type { NodeGraphEditorInternalContext } from '@/node-blueprint/Editor/Graph/NodeGraphEditor';
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';

const emit = defineEmits([ 'update:modelValue' ])
const prop = defineProps({
  modelValue: {
    type: Object as PropType<NodeParamType>,
    default: null,
  },
  canBeAny: {
    type: Boolean,
    default: false
  },
  canBeExecute: {
    type: Boolean,
    default: false
  },
});

const selectBox = ref<HTMLElement>();

const context = inject('NodeGraphEditorContext') as NodeGraphEditorInternalContext;

function onPickType() {
  if (selectBox.value) {
    context.showSelectTypePanel(
      new Vector2(HtmlUtils.getLeft(selectBox.value), HtmlUtils.getTop(selectBox.value)),
      prop.canBeExecute,
      prop.canBeAny
    ).then((type) => {
      emit('update:modelValue', type);
    });
  }
}

</script>