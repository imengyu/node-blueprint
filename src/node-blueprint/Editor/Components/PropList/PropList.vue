<template>
  <div v-if="items" class="prop-list">
    <slot>
      <template v-for="(item,i) in items" :key="i">
        <PropListItem 
          :horizontal="$slots.rowHorizontal!==undefined"
          :draggable="dragSortable && (!childDragable || childDragable?.(item,i))"
          :dropData="draggingItemIndex >= 0"
          @contextmenu="childMouseEvent?.(item,i,'contextmenu',$event)"
          @click="childMouseEvent?.(item,i,'click',$event)"
          @dblclick="childMouseEvent?.(item,i,'dblclick',$event)"
          @dragstart="onDragStart(item,i,$event)"
          @dragend="onDragEnd()"
          @drop="(e: DragEvent, pos: string) => onDrop(item,i,e,pos)"
        >
          <Icon 
            v-if="expandable && childExpandable?.(item,i)"
            class="expand-arrow"
            :icon="expandState[i] ? 'icon-arrow-down-bold' : 'icon-arrow-right-bold'" 
            @click="expandState[i]=!expandState[i]"
          />
          <slot v-if="$slots.rowHorizontal" name="rowHorizontal" :item="item" :index="i" />
          <slot v-if="$slots.rowVertical" name="rowVertical" :item="item" :index="i" />
        </PropListItem>
        <slot v-if="expandable && expandState[i]" name="rowExtend" :item="item" :index="i" />
      </template>
    </slot>
    <div v-if="$slots.add" class="prop-list-item add-button" @click="$emit('add')">
      <slot name="add" />
    </div>
    <div v-if="emptyText && (!items || items.length === 0)" class="prop-list-item empty-text">
      {{ emptyText }}
    </div>
  </div>
</template>

<script setup lang="ts" generic="T">
import { ref, type PropType } from 'vue';
import Icon from '../../Nana/Icon.vue';
import PropListItem from './PropListItem.vue';

const emit = defineEmits([ 'add', 'dragSort' ])

const props = defineProps({
  items: {
    type: Object as PropType<T[]>,
    default: null,
  },
  emptyText: {
    type: String,
    default: null,
  },
  dragSortable: {
    type: Boolean,
    default: false,
  },
  expandable: {
    type: Boolean,
    default: false,
  },
  childExpandable: {
    type: Function as PropType<(item: T, index: number) => boolean>,
    default: null,
  },
  childDragable: {
    type: Function as PropType<(item: T, index: number) => boolean>,
    default: null,
  },
  childStartDrag: {
    type: Function as PropType<(item: T, index: number, e: DragEvent) => void>,
    default: null,
  },
  childMouseEvent: {
    type: Function as PropType<(item: T, index: number, type: 'click'|'dblclick'|'contextmenu', e: MouseEvent) => void>,
    default: null,
  },
  rowClass: {
    type: String,
    default: null,
  },
})

const expandState = ref<boolean[]>([]);
const draggingItemIndex = ref(-1);

function onDragStart(item: T, index: number, e: DragEvent) {
  if (props.dragSortable)
    draggingItemIndex.value = index;
  props.childStartDrag?.(item, index, e);
}
function onDragEnd() {
  draggingItemIndex.value = -1;
}
function onDrop(item: T, index: number, e: DragEvent, pos: string) {
  if (draggingItemIndex.value >= 0) {
    e.preventDefault();
    e.stopPropagation();
    emit('dragSort', props.items[draggingItemIndex.value ], pos === 'up' ? index : (index + 1));
  }
}

</script>
