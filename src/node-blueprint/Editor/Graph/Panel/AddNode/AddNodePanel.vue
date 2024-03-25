<template>
  <NodeFloatPanel 
    :title="`添加${filterText}`"
    :position="position"
    :size="size"
    :show="show"
    @update:show="(v) => $emit('update:show', v)"
    @click="onClick($event)"
  >    
    <Row align="center">
      <input v-model="searchValue" class="node-small-input fill" type="text" placeholder="搜索单元...">
      <SmallButton v-if="searchValue != ''" icon="icon-close-bold" text="清空筛选" @click="searchValue=''" />
    </Row>

    <CollapseItem
      v-show="nodesFavorite.show && nodesFavorite.filterShow && nodesFavorite.category!=''"
      v-model:open="nodesFavorite.open"
      :title="nodesFavorite.category"
    >
      <NodeCategory
        :categoryData="(nodesFavorite as CategoryData)"
        :isAddDirectly="isAddDirectly"
      />
    </CollapseItem>

    <NodeList 
      :allNodesGrouped="allNodesGrouped"
      :isAddDirectly="isAddDirectly"
    />

    <NodeCategory
      v-if="nodesGroupedMostOut"
      :categoryData="(nodesGroupedMostOut as CategoryData)"
      :isAddDirectly="isAddDirectly"
    />

    <div v-if="searchValue != '' && currentShowCount===0" class="node-add-panel-empty">
      暂无筛选结果。请更改筛选条件后再试
    </div>
  </NodeFloatPanel>
</template>

<script setup lang="ts">
import { computed, ref, type PropType, onMounted, watch, provide, onBeforeUnmount } from 'vue';
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import NodeFloatPanel from '../Components/NodeFloatPanel.vue';
import Row from '../../../Nana/Layout/Row';
import NodeList from './NodeList.vue';
import NodeCategory from './NodeCategory.vue';
import SmallButton from '@/node-blueprint/Editor/Components//SmallButton.vue';
import type { CategoryData, CategoryDataItem } from '@/node-blueprint/Base/Flow/Registry/NodeCategory';
import type { NodePortDirection } from '@/node-blueprint/Base/Flow/Node/NodePort';
import type { NodeParamType } from '@/node-blueprint/Base/Flow/Type/NodeParamType';
import type { INodeDefine } from '@/node-blueprint/Base/Flow/Node/Node';
import SettingsUtils from '@/node-blueprint/Base/Utils/SettingsUtils';
import ArrayUtils from '@/node-blueprint/Base/Utils/ArrayUtils';
import CollapseItem from '@/node-blueprint/Editor/Components/List/CollapseItem.vue';

const emit = defineEmits([ 
  'update:show',
  'addNode'
]);

const props = defineProps({
  /**
   * 是否显示
   */
  show: {
    type: Boolean,
    default: false
  },
  /**
   * 显示位置
   */
  position: {
    type: Object as PropType<Vector2>,
    default: () => new Vector2(),
  },
  /**
   * 所有单元数组
   */
  allNodesGrouped: {
    type: Object as PropType<Array<CategoryData>>,  
    default: null,
  },
  /**
   * 所有单元数组
   */
  allNodesFlat: {
    type: Object as PropType<Map<string, CategoryDataItem>>,  
    default: null,
  },
  /**
   * 是否是直接添加
   */
  isAddDirectly: {
    type: Boolean,
    default: false,
  },
  /**
   * 根据端口方向筛选
   */
  filterByPortDirection: {
    type: String as PropType<NodePortDirection>,  
    default: null,
  },
  /**
   * 根据端口类型筛选
   */
  filterByPortType: {
    type: Object as PropType<NodeParamType>,  
    default: null,
  },
});

const size = computed(() => {
  return new Vector2(
    300,
    window.innerHeight / 2
  );
})

const nodesFavorite = ref<CategoryData>({
  category: '我的收藏',
  childCategories: [],
  nodes: [],
  open: false,
  show: true,
  filterShow: true,
});
const nodesGroupedMostOut = ref<CategoryData|null>(null);
const filterText = ref('所有可用单元');
const searchValue = ref('');
const currentShowCount = ref(0);
const currentFilterCount = ref(0);
const favoriteList = ref<string[]>([]);

//加载最外层单元
function loadMostOutNodes() {
  for (let index = 0; index < props.allNodesGrouped.length; index++) {
    if(props.allNodesGrouped[index].category === '') {
      nodesGroupedMostOut.value = props.allNodesGrouped[index];
      break;
    }        
  }
}
//加载收藏单元
function loadFavorite() {
  favoriteList.value = SettingsUtils.getSettings('NodeGraphEditorFavoriteNodes', []) || [];
  flushFavorite();
}
function flushFavorite() {
  nodesFavorite.value.nodes = favoriteList.value
    .map((guid) => props.allNodesFlat.get(guid))
    .filter(b => b !== undefined) as CategoryDataItem[];
}
//保存收藏单元
function saveFavorite() {
  SettingsUtils.setSettings('NodeGraphEditorFavoriteNodes', favoriteList.value);
}
//添加/移除收藏单元
function setNodeFav(nodeGuid: string, add: boolean) {
  if(add)
    favoriteList.value.push(nodeGuid);
  else
    ArrayUtils.removeBy(favoriteList.value, b => b !== nodeGuid, true);
  flushFavorite();
}

//搜索与筛选
function doFilterLoop(cn : (b : INodeDefine) => boolean) {
  currentFilterCount.value = 0;
  let loop = (data : CategoryData) => {
    let showChildCount = 0;
    data.nodes.forEach((b) => {
      b.show = cn(b.define);
      if(b.show) showChildCount++;
    });
    data.childCategories.forEach((d) => showChildCount += loop(d));
    data.show = showChildCount > 0;
    return showChildCount;
  };
  props.allNodesGrouped.forEach((cd) => currentFilterCount.value += loop(cd));
}
function doFilter() {
  if(props.filterByPortType !== null) {
    doFilterLoop((b) => hasOnePortByDirectionAndType(b, props.filterByPortDirection, props.filterByPortType, true));
    filterText.value = (props.filterByPortDirection === 'input' ? '获取 ' : '输出 ') + props.filterByPortType.toUserFriendlyName() + ' 的单元';
  }
  else clearFilter();
}
function clearFilter() {
  currentFilterCount.value = 0;

  let loop = (data : CategoryData) => {
    data.show = true;
    data.nodes.forEach((b) => b.show = true);
    data.childCategories.forEach((d) => loop(d));
    currentFilterCount.value++;
  };

  props.allNodesGrouped.forEach((cd) => loop(cd));
  filterText.value = '所有可用单元';
}
function doSearch() {
  currentShowCount.value = 0;
  let loop = (data : CategoryData) => {
    let showChildCount = 0;
    data.nodes.forEach((b) => {
      b.filterShow = 
        b.define.name.includes(searchValue.value) 
        || (b.define.description !== undefined && b.define.description.includes(searchValue.value));
      
      if(b.filterShow) 
        showChildCount++;
      data.childCategories.forEach((d) => showChildCount += loop(d));
    });
    data.childCategories.forEach((d) => showChildCount += loop(d));
    data.filterShow = showChildCount > 0;
    data.open = true;
    return showChildCount;
  };
  props.allNodesGrouped.forEach((cd) => currentShowCount.value += loop(cd));
}
function clearSearch() {

  let loop = function(data : CategoryData) {
    data.filterShow = true;
    data.open = false;
    data.nodes.forEach((b) => b.filterShow = true);
    data.childCategories.forEach((d) => loop(d));
  };

  props.allNodesGrouped.forEach((cd) => loop(cd));
}
//根据方向、类型、键类型等参数在当前定义文件中查找一个端口
function hasOnePortByDirectionAndType(node : INodeDefine, direction : NodePortDirection, type : NodeParamType, includeAny = false) {
  const ports = node.ports;
  if (!ports)
    return false;
  for(let i = 0, c = ports.length; i < c;i++) {
    const port = ports[i];
    if (port.direction === direction && port.paramType.acceptable(type, includeAny))
      return true;
  }
  return false;
}

//点击其他地方关闭此弹窗
function onDocClick() {
  emit('update:show', false);
}
function onClick(e : MouseEvent) {
  e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
}

function addNode(node: INodeDefine) {
  emit('addNode', node);
  emit('update:show', false);
}

provide('addNode', addNode);
provide('setNodeFav', setNodeFav);
provide('favoriteList', favoriteList);

watch(() => props.allNodesGrouped, () => {
  loadMostOutNodes();
});
watch(() => props.show, (newV) => {
  if(newV) { 
    setTimeout(() => {
      document.addEventListener('click', onDocClick);
      doFilter();
    }, 100); } 
  else 
    document.removeEventListener('click', onDocClick);
});
watch(searchValue, (newV) => {
  if(newV === '') clearSearch();
  else doSearch();
});

onMounted(() => {
  setTimeout(() => {
    loadMostOutNodes() ;
    loadFavorite();
  }, 1000);
});
onBeforeUnmount(() => {
  saveFavorite();
});
</script>

<style>
.node-add-panel-empty {
  text-align: center;
  padding: 20px;
}
</style>