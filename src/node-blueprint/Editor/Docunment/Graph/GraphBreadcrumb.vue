<template>
  <!--图表导航栏-->
  <div class="node-graph-breadcrumb">
    <div 
      v-for="(graph, i) in graphBreadcrumb"
      :key="i"
      :class="(i==graphBreadcrumb.length-1?'last':'')+(graph.isCurrent?' current':'')"
    >
      <span v-if="graph.isCurrent">{{ graph.text }}</span>
      <a 
        v-else href="javascript:;" 
        @click="onGraphClicked(graph.graph as NodeGraph)"
      >
        {{ graph.text }}
      </a>
      <Icon 
        v-if="!graph.isEnd"
        icon="icon-arrow-right-bold"
        :size="12"
        @click="onArrowClicked($event, graph as GraphBreadcrumb)"
      />
    </div>
    <div v-if="!graphBreadcrumb || graphBreadcrumb.length == 0">
      {{ currentDocunment?.name }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { toRefs, watch, type PropType, ref, onMounted, nextTick } from 'vue';
import type { NodeDocunment } from '@/node-blueprint/Base/Flow/Graph/NodeDocunment';
import { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import ArrayUtils from '@/node-blueprint/Base/Utils/ArrayUtils';
import Icon from '../../Nana/Icon.vue';
import ContextMenuGlobal, { type MenuItem } from '@imengyu/vue3-context-menu';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';

interface GraphBreadcrumb {
  text: string,
  graph: NodeGraph,
  isCurrent: boolean,
  isEnd: boolean,
  childList: {
    text: string,
    graph: NodeGraph,
  }[],
}

const emit = defineEmits([ 'goGraph' ]);

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

const graphBreadcrumb = ref<GraphBreadcrumb[]>([]);

watch(currentGraph, (v) => {
  loadGraphBreadcrumb(v);
});

function loadGraphBreadcrumb(v : NodeGraph) {
  ArrayUtils.clear(graphBreadcrumb.value);
  if (v === null || currentDocunment.value === null) 
    return;

  let childList = v.children.map((v1) => ({
    text: v1.name,
    graph: v1,
  }));
  
  graphBreadcrumb.value.push({
    text: v.name,
    graph: v,
    childList,
    isCurrent: true,
    isEnd: childList.length === 0,
  });
  
  let loop = (graph : NodeGraph) => {
    childList = graph.children.map((v1) => ({
      text: v1.name,
      graph: v1,
    }));

    graphBreadcrumb.value.unshift({
      text: graph.name,
      graph: graph,
      childList,
      isCurrent: false,
      isEnd: childList.length === 0,
    });
    if(graph.parent !== null && graph.parent instanceof NodeGraph) 
      loop(graph.parent);
  };
  if(v.parent !== null && v.parent instanceof NodeGraph) 
    loop(v.parent);
} 
function onGraphClicked(graph: NodeGraph) {
  emit('goGraph', graph);
}
function onArrowClicked(e: MouseEvent, graphBreadcrum: GraphBreadcrumb) {
  const ele = (e.target as HTMLElement).parentElement;
  ContextMenuGlobal.showContextMenu({
    x: HtmlUtils.getLeft(ele!),
    y: HtmlUtils.getTop(ele!) + ele!.offsetHeight,
    theme: 'mac dark',
    items: graphBreadcrum.childList.map((b) => ({
      label: b.text,
      onClick: () => onGraphClicked(b.graph),
    } as MenuItem))
  })
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
  padding: 0 6px;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  user-select: none;
  cursor: pointer;
  color: var(--mx-editor-light-text-color);

  > div {
    display: inline-flex;
    align-items: center;
    margin-left: 7px;
    font-size: 12px;

    svg {
      margin: 0 3px;
      fill: var(--mx-editor-text-color);
    }
    a {
      color: var(--mx-editor-text-color);

      &:hover, &:active {
        transform: scale(1.1);
      }
    }
  }
}
</style>