<template>
  <div 
    v-if="show"
    class="node-float-panel"
    :style="{
      left: `${position.x}px`,
      top: `${position.y}px`,
      width: `${size.x}px`,
      height: `${size.y}px`
    }"
  >
    <div v-if="title" class="title">
      <span>{{ title }}</span>
      <Icon class="close" icon="icon-close-bold" @click="$emit('update:show', false)" />
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import Icon from '@/node-blueprint/Editor/Base/Icon.vue';
import type { PropType } from 'vue';

defineEmits([ 'update:show' ]);

defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  size: {
    type: Object as PropType<Vector2>,
    default: () => new Vector2(),
  },
  position: {
    type: Object as PropType<Vector2>,
    default: () => new Vector2(),
  },
});

</script>