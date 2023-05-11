<template>
  <CollapseItem 
    v-for="(item, index) in categoryData.childCategories" 
    :key="index" 
    v-show="item.show && item.filterShow"
    v-model:open="item.open" 
    :title="item.category"
  >
    <NodeCategory v-show="item.open" :categoryData="item" />
  </CollapseItem>

  <div class="nodes-select-list">
    <Tooltip
      v-for="(item, index) in categoryData.nodes"
      :key="index"
      :content="item.define.description"
    >
      <div class="item" 
        v-show="item.show && item.filterShow && !item.define.hideInAddPanel"
      
        :draggable="isAddDirectly ? 'false' : 'true'" 
        @click="onClick(item)"
        @dragstart="onDrag(item, $event)"
      >
        <span>
          <img :src="item.define.style?.logo || DefaultLogo" />
          {{ item.define.name }}
        </span>
        <SmallButton 
          v-if="isAddDirectly"
          icon="icon-add-bold"
          title="添加到鼠标位置"
          class="add-button"
          @click="onAddClick(item)" 
        />
        <span v-else></span>
      </div>
    </Tooltip>
    
  </div>
</template>

<script lang="ts" setup>
import { inject, type PropType } from 'vue'
import type { INodeDefine } from '@/node-blueprint/Base/Flow/Node/Node';
import type { CategoryData, CategoryDataItem } from '@/node-blueprint/Base/Flow/Registry/NodeCategory';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import CollapseItem from '../../../Base/List/CollapseItem.vue';
import DefaultLogo from '../../../Images/BlockIcon/function_static.svg';
import SmallButton from '../../../Base/Button/SmallButton.vue';
import Tooltip from '@/node-blueprint/Editor/Base/Tooltip/Tooltip.vue';

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

const addNode = inject('addNode') as (node: INodeDefine) => void;

function onDrag(item: CategoryDataItem, e: DragEvent) {
  if (HtmlUtils.isEventInControl(e)) {
    e.preventDefault();
    e.stopPropagation();
  }
  else if (e.dataTransfer) {
    e.dataTransfer.setData("text/plain", "drag:block:" + item.define.guid);
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
    border-radius: 4px;

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
      color: #888;
    }

    &:hover {
      background-color: rgba(183, 219, 232, 0.3);
    }
    &:active {
      opacity: 0.7;
    }
  }
}
</style>