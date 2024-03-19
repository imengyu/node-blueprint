<template>
  <div v-if="items" class="prop-list">
    <slot>
      <template v-for="(item,i) in items" :key="i">
        <div 
          :class="[
            'prop-list-item',
            $slots.rowHorizontal ? 'horizontal' : 'vertical',
            rowClass,
          ]"
          :draggable="dragSortable && (!childDragable || childDragable?.(item,i))"
          @contextmenu="childMouseEvent?.(item,i,'contextmenu',$event)"
          @click="childMouseEvent?.(item,i,'click',$event)"
          @dblclick="childMouseEvent?.(item,i,'dblclick',$event)"
          @dragstart="onDragStart(item,i,$event)"
          @dragend="onDragEnd()"
          @dragover="onDragOver(item,i,$event)"
          @drop="onDrop(item,i,$event)"
        >
          <Icon 
            v-if="expandable && childExpandable?.(item,i)"
            class="expand-arrow"
            :icon="expandState[i] ? 'icon-arrow-down-bold' : 'icon-arrow-right-bold'" 
            @click="expandState[i]=!expandState[i]"
          />
          <slot v-if="$slots.rowHorizontal" name="rowHorizontal" :item="item" :index="i" />
          <slot v-if="$slots.rowVertical" name="rowVertical" :item="item" :index="i" />
        </div>
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

<script setup lang="ts">
import { ref, type PropType } from 'vue';
import Icon from '../../Nana/Icon.vue';

const emit = defineEmits([ 'add', 'dragSort' ])

const props = defineProps({
  items: {
    type: Object as PropType<unknown[]>,
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
    type: Function as PropType<(item: unknown, index: number) => boolean>,
    default: null,
  },
  childDragable: {
    type: Function as PropType<(item: unknown, index: number) => boolean>,
    default: null,
  },
  childStartDrag: {
    type: Function as PropType<(item: unknown, index: number, e: DragEvent) => void>,
    default: null,
  },
  childMouseEvent: {
    type: Function as PropType<(item: unknown, index: number, type: 'click'|'dblclick'|'contextmenu', e: MouseEvent) => void>,
    default: null,
  },
  rowClass: {
    type: String,
    default: null,
  },
})

const expandState = ref<boolean[]>([]);
let draggingItemIndex = -1;

function onDragStart(item: unknown, index: number, e: DragEvent) {
  if (props.dragSortable)
    draggingItemIndex = index;
  props.childStartDrag?.(item, index, e);
}
function onDragEnd() {
  draggingItemIndex = -1;
}
function onDragOver(item: unknown, index: number, e: DragEvent) {
  if (draggingItemIndex >= 0) {
    e.preventDefault();
    e.stopPropagation();
  }
}
function onDrop(item: unknown, index: number, e: DragEvent) {
  if (draggingItemIndex >= 0) {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    emit('dragSort', props.items[draggingItemIndex], e.offsetY < target.offsetHeight / 2 ? index : (index + 1));
  }
}

</script>
