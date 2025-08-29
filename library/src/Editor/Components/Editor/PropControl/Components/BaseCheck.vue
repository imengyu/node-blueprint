<template>
  <div 
    :class="[
      'node-checkbox',
      size,
    ]" 
    @click="() => $emit('update:modelValue', modelValue ? false : true)"
  >
    <div class="checker">
      <Icon v-if="modelValue" icon="icon-select-bold" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import Icon from '../../../Nana/Icon.vue';

defineProps({
  modelValue: {
    type: [Number,Object, Boolean],
    default: null
  },
  size: {
    type: String as PropType<'normal'|'small'>,
    default: 'normal'
  },
})

defineEmits([
  'update:modelValue'
])
</script>