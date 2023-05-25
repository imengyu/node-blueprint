<template>
  <div class="node-graph-breadcrumb">
    <div v-for="(graph, i) in graphBreadcrumb" :key="i" :class="(i==graphBreadcrumb.length-1?'last':'')+(graph.isCurrent?' current':'')">
      <span v-if="graph.isCurrent">{{ graph.text }}</span>
      <a 
        v-else href="javascript:;" 
        @click="$emit('goGraph', graph.graph)"
      >
        {{ graph.text }}
      </a>
      <Icon icon="icon-arrow-right-bold" :size="12" />
    </div>
    <div v-if="!graphBreadcrumb || graphBreadcrumb.length == 0">
      {{ currentDocunment.name }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { toRefs, watch, type PropType, ref, onMounted, nextTick } from 'vue';
import type { NodeDocunment } from '@/node-blueprint/Base/Flow/Graph/NodeDocunment';
import { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import ArrayUtils from '@/node-blueprint/Base/Utils/ArrayUtils';
import Icon from '../../Nana/Icon.vue';

defineEmits([ 'goGraph' ]);

const props = defineProps({
  currentDocunment: {
    type: Object as PropType<NodeDocunment>,
    default: null,
  },
  currentGraph: {
    type: Object as PropType<NodeGraph>,
    default: null,
  },
})

const {
  currentDocunment, currentGraph,
} = toRefs(props);

const graphBreadcrumb = ref<Array<{
  text: string,
  graph: NodeGraph,
  isCurrent: boolean,
}>>([]);

watch(currentGraph, (v) => {
  loadGraphBreadcrumb(v);
});

function loadGraphBreadcrumb(v : NodeGraph) {
  ArrayUtils.clear(graphBreadcrumb.value);
  if (v === null || currentDocunment.value === null) 
    return;
  
  graphBreadcrumb.value.push({
    text: v.name,
    graph: v,
    isCurrent: true
  });
  let loop = (graph : NodeGraph) => {
    graphBreadcrumb.value.unshift({
      text: graph.name,
      graph: graph,
      isCurrent: false
    });
    if(graph.parent !== null && graph.parent instanceof NodeGraph) 
      loop(graph.parent);
  };
  if(v.parent !== null && v.parent instanceof NodeGraph) 
    loop(v.parent);
} 

onMounted(() => {
  nextTick(() => {
    loadGraphBreadcrumb(currentGraph.value);
  });
});
</script>

<style lang="scss">
@import '../NodeIdeDefine.scss';

.node-graph-breadcrumb {
  position: absolute;
  top: 0;
  left: $left-toolbar-width;
  right: 0;
  height: $top-breadcrumb-height;
  padding: 3px 6px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  user-select: none;
  cursor: pointer;
  color: #c0c0c0;

  > div {
    display: inline-flex;
    align-items: center;
    margin-left: 7px;
    font-size: 12px;

    svg {
      margin: 0 3px;
      fill: #fff;
    }
    a {
      color: #fff;

      &:hover, &:active {
        transform: scale(1.1);
      }
    }
  }
}
</style>