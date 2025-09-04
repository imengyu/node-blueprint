<template>
  <div
    v-tooltip="'可直接拖拽此箭头以添加子程序调用至图表中'"
    class="prop-list-dragger" 
    :style="{ backgroundImage: `url(${DraggerBg})` }"
    draggable="true"
    @dragstart="onChildGraphDrag"
  >
    <Icon icon="icon-back1" />
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { NodeGraph } from '@/Core/Graph/NodeGraph';
import Icon from '@/Editor/Components/Shared/Icon.vue';
import DraggerBg from '../../Images/dragger-bg.svg';
import HtmlUtils from '@/Common/Html';
import { startInternalDataDragging } from '@/Editor/GraphEditor/Editor/EditorDragController';

const props = defineProps({
  childGraph: {
    type: Object as PropType<NodeGraph>,
    required: true,
  },
});

function onChildGraphDrag(e: DragEvent) {
  if(HtmlUtils.isEventInControl(e)) { 
    e.preventDefault(); 
    e.stopPropagation(); 
  }
  else {
    startInternalDataDragging(`drag:graph:${props.childGraph.type === 'subgraph' ? 'subgraph' : 'function'}: ${props.childGraph.name}`);
  }
}
</script>