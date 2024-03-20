<template>
  <div 
    ref="itemRef"
    :class="[
      'prop-list-item',
      horizontal ? 'horizontal' : 'vertical',
      dragState ? `drop-${dragState}` : '',,
      rowClass,
    ]"
    @drop="onDrop"
    @dragover="onDragOver"
    @dragenter="onDragEnter"
    @dragleave="onDragLeave"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useDragEnterLeaveFilter } from '../../Composeable/DragEnterLeaveFilter';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';

const emit = defineEmits([	
  "drop"	
])

const props = defineProps({
  horizontal: {
    type: Boolean,
    default: false,
  },
  rowClass: {
    type: String,
    default: null,
  },
  dropData: {
    type: Boolean,
    default: false,
  },
})

let itemAbsY = 0;
const itemRef = ref<HTMLElement>();
const dragEnter = ref(false);
const dragState = ref<''|'up'|'down'>('');

function onDragOver(e: DragEvent) {
  if (props.dropData) {
    e.preventDefault();
    e.stopPropagation();

    if (dragEnter.value) {
      dragState.value = e.y > itemAbsY + itemRef.value!.offsetHeight / 2 
        ? 'down' : 'up';
    }
  }
}
function onDrop(e: DragEvent) {
  emit('drop', e, dragState.value);
  dragEnter.value = false;
  dragState.value = '';
}

const {
  onDragEnter,
  onDragLeave,
} = useDragEnterLeaveFilter(
  () => {
    dragEnter.value = true;
    itemAbsY = HtmlUtils.getTop(itemRef.value!);
  },
  () => {
    dragEnter.value = false;
    dragState.value = '';
  },
);

</script>
