<template>
  <CodeLayoutScrollbar 
    class="tree-list"
    scroll="vertical"
    @keypress="onKeyPress"
  >
    <slot name="prefix" />
    <TreeListItem 
      v-for="child in items"
      :key="child.key"
      :item="child"
      :dsec="dsec"
      :defaultOpen="defaultOpen"
      :itemClass="itemClass"
    >
      <template #itemLeft="values : any">
        <slot name="itemLeft" v-bind="values" />
      </template>
      <template #itemRight="values : any">
        <slot name="itemRight" v-bind="values" />
      </template>
    </TreeListItem>
    <slot />
  </CodeLayoutScrollBar>
</template>

<script setup lang="ts">
import { CodeLayoutScrollbar } from 'vue-code-layout';
import TreeListItem from './TreeListItem.vue';
import { provide, type PropType } from 'vue';
import { type ITreeListItem, type TreeListContext, TreeListContextKey, type ITreeListDescItem } from './TreeList';

defineProps({
  items: {
    type: Object as PropType<ITreeListItem[]>,
    default: null,
  },
  dsec: {
    type: Object as PropType<ITreeListDescItem[]>,
    default: null,
  },
  defaultOpen: {
    type: Boolean,
    default: false,
  },
  itemClass: {
    type: String,
    default: '',
  },
});

const emit = defineEmits([ 
  "itemClick",
  "itemContextMenu",
  "itemOpen",
  "itemClose",
])

provide<TreeListContext>(TreeListContextKey, {
  itemClick(row: ITreeListItem) {
    emit('itemClick', row);
  },
  itemContextMenu(row: ITreeListItem, e: MouseEvent) {
    emit('itemContextMenu', row, e);
  },
  itemOpen(row: ITreeListItem) {
    emit('itemOpen', row);
  },
  itemClose(row: ITreeListItem) {
    emit('itemClose', row);
  },
});

function onKeyPress(e: KeyboardEvent) {
  //TODO: 列表键盘事件
}

</script>

<style lang="scss">
.tree-list {
  position: relative;
  display: block;
  height: 100%;
  font-size: 12px;

  &:hover .tree-list-item > .line {
    opacity: 1;
  }
}
.tree-list-item {
  position: relative;
  padding: 2px 10px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  color: var(--mx-editor-text-color);
  border: 1px solid transparent;
  user-select: none;
  cursor: pointer;

  > .line {
    position: absolute;
    content: '';
    top: -2px;
    bottom: 0;
    width: 1px;
    background-color: var(--code-layout-color-scrollbar-thumb-light);
    opacity: 0;
    transition: opacity ease-in-out 0.3s;
  }

  > div {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .arrow, .arrow-placeholder {
    width: 16px;
    margin-right: 4px;
  }

  &.open {
    .arrow {
      transform: rotate(90deg);
    }
  }

  svg {
    fill: currentColor;
  }

  &:hover {
    background-color: var(--mx-editor-list-item-hover-second-color);
  }
  &:focus {
    border-color: var(--code-layout-color-highlight);
    outline: none;
  }
}
</style>