<template>
  <div class="node-graph-editorzoom-tool">
    <div class="button left" title="缩小" @click="zoomOut()">
      <Icon icon="icon-zoom-in" />
    </div>
    <select
      v-model="zoomSelectValue"
      @change="zoomSet(zoomSelectValue)"
    >
      <option v-for="(v, i) in zoomValues" :key="i" :value="v">{{ v }}%</option>
    </select>
    <span>{{ Math.floor(viewPort.scale * 100) }}%</span>
    <div class="button right" title="放大" @click="zoomIn()">
      <Icon icon="icon-zoom-out" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType, inject, watch } from "vue";
import Icon from "../../Nana/Icon.vue";
import type { NodeGraphEditorInternalContext, NodeGraphEditorViewport } from "../NodeGraphEditor";

const emit = defineEmits([ 'zoomUpdate' ]);
const props = defineProps({
  viewPort: {
    type: Object as PropType<NodeGraphEditorViewport>,
    default: null,
  },
});

const context = inject('NodeGraphEditorContext') as NodeGraphEditorInternalContext;

const zoomValues = [30, 50, 60, 80, 100, 110, 120, 130, 150, 170, 190, 200];
const zoomSelectValue = ref(4);

watch(() => props.viewPort.scale, () => {
  const viewScale = Math.floor(props.viewPort.scale * 100);
  zoomSelectValue.value = zoomValues.indexOf(viewScale);
})

/**
 * 放大视图
 */
function zoomOut() {
  const viewScale = Math.floor(props.viewPort.scale * 100);
  if (viewScale > 40) zoomSet(viewScale - 10);
  else zoomSet(30);
}
/**
 * 缩小视图
 */
function zoomIn() {
  const viewScale = Math.floor(props.viewPort.scale * 100);
  if (viewScale <= 190) zoomSet(viewScale + 10);
  else zoomSet(200);
}
/**
 * 更新视图缩放
 */
function zoomSet(scale: number) {
  props.viewPort.scaleAndCenter(scale / 100);
  emit("zoomUpdate", scale);
}

context.zoomIn = zoomIn;
context.zoomOut = zoomOut;
context.zoomSet = zoomSet;

</script>
