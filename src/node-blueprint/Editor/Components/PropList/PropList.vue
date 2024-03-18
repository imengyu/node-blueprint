<template>
  <div v-if="items" class="prop-list">
    <slot>
      <div 
        v-for="(item,i) in items" :key="i" 
        class="prop-list-item"
        :draggable="dragSortable"
        @dragstart="onDragStart(item,i)"
        @dragend="onDragEnd()"
        @dragover="onDragOver(item,i,$event)"
        @drop="onDrop(item,i,$event)"
      >
        <slot name="row" :item="item" :index="i" />
      </div>
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
import type { PropType } from 'vue';

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
})

let draggingItemIndex = -1;

function onDragStart(item: unknown, index: number) {
  if (props.dragSortable)
    draggingItemIndex = index;
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
