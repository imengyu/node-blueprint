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
import Icon from '../../Nana/Icon.vue';
import DraggerBg from '../../Images/dragger-bg.svg';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import type { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import { startInternalDataDragging } from '../../Graph/Editor/EditorDragController';

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
    startInternalDataDragging('drag:graph:0:' + props.childGraph.uid);
  }
}
</script>