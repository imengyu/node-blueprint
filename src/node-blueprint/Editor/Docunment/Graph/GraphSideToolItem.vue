<template>
  <div 
    ref="button"
    :class="[
      'tool-item', 
      'button',
      'icon',
      color,
      active ? 'active' : '',
    ]"
    @click="$emit('click')"
  >
    <Icon :icon="icon" />
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue';
import Icon from '../../Nana/Icon.vue';
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';

const button = ref<HTMLElement>();

defineEmits([ 'click' ]);
defineProps({
  icon: {
    type: String,
    default: '',
  },
  color: {
    type: String as PropType<''|'green'|'red'|'blue'|'yellow'>,
    default: '',
  },
  active: {
    type: Boolean,
    default: false,
  },
})

defineExpose({
  getButtonPosition() {
    return new Vector2(
      HtmlUtils.getLeft(button.value!) + button.value!.offsetWidth,
      HtmlUtils.getTop(button.value!),
    )
  }
})
</script>