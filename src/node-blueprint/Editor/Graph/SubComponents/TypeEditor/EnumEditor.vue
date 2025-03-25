<template>
  <select 
    ref="editor" 
    :value="value" 
    class="custom-editor param-editor"
    @change="onTextareaChange"
  >
    <option v-for="(option, index) in options" :key="index" :value="option">{{ option }}</option>
  </select>
</template>

<script setup lang="ts">
import type { NodePort } from '@/node-blueprint/Base/Flow/Node/NodePort';
import type { IKeyValueObject } from '@/node-blueprint/Base/Utils/BaseTypes';
import { type PropType, ref } from 'vue'

defineProps( {
  value: {
    type: String,
    default: '',
  },
  options: {
    type: Object as PropType<string[]>,
    default: null,
  },
  port: {
    type: Object as PropType<NodePort>,
    default: null,
  },
  customData: {
    type: Object as PropType<IKeyValueObject>,
    default: null,
  },
});

const emit = defineEmits([ 'update:value', 'update:custom-data'  ])
const editor = ref<HTMLSelectElement>();

function onTextareaChange(e: Event) {
  emit('update:value', (e.target as HTMLSelectElement).value)
}

</script>
