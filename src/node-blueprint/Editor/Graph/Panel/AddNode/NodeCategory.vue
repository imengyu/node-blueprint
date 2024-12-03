<template>
  <CollapseItem 
    v-for="item in categoryData.childCategories"
    v-show="item.show && item.filterShow" 
    :key="item.key"
    v-model:open="item.open" 
    :title="item.category"
  >
    <NodeCategory 
      v-if="item.open"
      :categoryData="item"
      :isAddDirectly="isAddDirectly"
    />
  </CollapseItem>

  <div v-if="categoryData.nodes.length > 0" class="nodes-select-list">
    <Tooltip
      v-for="item in categoryData.nodes"
      :key="item.key"
      :content="item.define.description"
    >
      <div
        v-show="item.show && item.filterShow && !item.define.hideInAddPanel" 
        class="item"
        draggable="true" 
        @click="onClick(item)"
        @dragstart="onDrag(item, $event)"
      >
        <span>
          <img :src="item.define.style?.logo || DefaultLogo">
          {{ item.define.name }}
        </span>
        <span>
          <span v-if="item.define.preprocessor" class="badge">预处理</span>
          <Tooltip content="将节点添加到收藏">
            <SmallButton
              icon="icon-star"
              :color="favoriteList.includes(item.define.guid) ? 
                'var(--mx-editor-yellow-text-color)' : 
                'var(--mx-editor-text-color)'"
              @click.stop="setNodeFav(item.define.guid, !favoriteList.includes(item.define.guid))" 
            />
          </Tooltip>
          <SmallButton 
            v-if="isAddDirectly"
            icon="icon-add-bold"
            title="添加到鼠标位置"
            class="add-button"
            @click.stop="onAddClick(item)" 
          />
        </span>
      </div>
    </Tooltip>
  </div>
  <div v-else class="nodes-select-list-empty">此分类下暂无可用节点</div>
</template>

<script lang="ts" setup>
import { inject, type PropType, type Ref } from 'vue'
import type { INodeDefine } from '@/node-blueprint/Base/Flow/Node/Node';
import type { CategoryData, CategoryDataItem } from '@/node-blueprint/Base/Flow/Registry/NodeCategory';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import CollapseItem from '../../../Components/List/CollapseItem.vue';
import DefaultLogo from '../../../Images/BlockIcon/function_static.svg';
import SmallButton from '../../../Components//SmallButton.vue';
import Tooltip from '@/node-blueprint/Editor/Nana/Tooltip/Tooltip.vue';
import { startInternalDataDragging } from '../../Editor/EditorDragController';

const props = defineProps({
  categoryData: {
    type: Object as PropType<CategoryData>,
    required: true,
  },
  isAddDirectly: {
    type: Boolean,
    default: false
  },
});

const favoriteList = inject('favoriteList') as Ref<string[]>;
const setNodeFav = inject('setNodeFav') as (nodeGuid: string, add: boolean) => void;
const addNode = inject('addNode') as (node: INodeDefine) => void;

function onDrag(item: CategoryDataItem, e: DragEvent) {
  if (HtmlUtils.isEventInControl(e)) {
    e.preventDefault();
    e.stopPropagation();
  }
  else {
    startInternalDataDragging("drag:node:" + item.define.guid);
  }
}
function onClick(item: CategoryDataItem) {
  if (!props.isAddDirectly)
    addNode(item.define);
}
function onAddClick(item: CategoryDataItem) {
  addNode(item.define);
}
</script>

<style lang="scss">
.nodes-select-list {
  position: relative;

  .item {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 2px 13px;
    margin-left: -8px;
    margin-top: 1px;
    cursor: default;
    border-radius: var(--mx-editor-border-radius-small);
    user-select: none;

    img, .logo {
      display: inline-block; 
      width: 20px;
      height: 20px;
      margin-right: 5px;
      vertical-align: middle;
    }

    h5 {
      font-size: 1rem;
    }
    span {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      font-size: 0.8rem;
      color: var(--mx-editor-text-color);

      &.badge {
        margin-left: 5px;
        padding: 2px 5px;
        border-radius: var(--mx-editor-border-radius-small);
        background-color: var(--mx-editor-yellow-text-color);
        color: var(--mx-editor-light-text-color);
        font-size: 0.7rem;
      }
    }

    &:hover {
      background-color: var(--mx-editor-list-item-hover-second-color);
    }
    &:active {
      opacity: 0.7;
    }
  }
}
.nodes-select-list-empty {
  padding: 3px;
  text-align: center;
  font-size: var(--mx-editor-font-size-small);
}
</style>