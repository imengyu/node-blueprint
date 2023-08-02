<template>
  <div class="node-checkbox" @click="() => $emit('update:modelValue', modelValue ? false : true)">
    <div class="checker">
      <Icon v-if="modelValue" icon="icon-select-bold" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import Icon from '../../../../Nana/Icon.vue';

defineProps({
  modelValue: {
    type: [Number,Object, Boolean],
    default: null
  },
})

defineEmits([
  'update:modelValue'
])
</script>