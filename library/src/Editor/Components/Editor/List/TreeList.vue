<template>
  <ScrollRect 
    class="tree-list"
    scroll="vertical"
    @keypress="onKeyPress"
  >
    <slot name="prefix" />
    <TreeListItem 
      v-for="child in items"
      :key="child.key"
      :item="child"
      :desc="desc"
      :defaultOpen="defaultOpen"
      :itemClass="itemClass"
    >
      <template #itemLeft="values : any">
        <slot name="itemLeft" v-bind="(values as ITreeSlotProps<T>)" />
      </template>
      <template #itemRight="values : any">
        <slot name="itemRight" v-bind="(values as ITreeSlotProps<T>)" />
      </template>
    </TreeListItem>
    <slot />
    <slot v-if="!items || items.length === 0" name="empty">
      <div class="tree-list-empty">
        暂无数据
      </div>
    </slot>
  </ScrollRect>
</template>

<script setup lang="ts" generic="T extends ITreeListItem">
import TreeListItem, { type ITreeSlotProps } from './TreeListItem.vue';
import { type ITreeListItem, type TreeListContext, TreeListContextKey, type ITreeListDescItem } from './TreeList';
import { provide, type PropType } from 'vue';
import { ScrollRect } from '@imengyu/vue-scroll-rect';

defineProps({
  items: {
    type: Object as PropType<T[]>,
    default: null,
  },
  desc: {
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
]);

provide<TreeListContext>(TreeListContextKey, {
  itemClick(row: ITreeListItem) {
    emit('itemClick', row as ITreeListItem);
  },
  itemContextMenu(row: ITreeListItem, e: MouseEvent) {
    emit('itemContextMenu', row as ITreeListItem, e);
  },
  itemOpen(row: ITreeListItem) {
    emit('itemOpen', row as ITreeListItem);
  },
  itemClose(row: ITreeListItem) {
    emit('itemClose', row as ITreeListItem);
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

  .tree-list-empty {
    text-align: center;
    padding: 10px 0;
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