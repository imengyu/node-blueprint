<template>
  <textarea 
    ref="editor" 
    :value="value" 
    class="custom-editor param-editor"
    :style="{
      minWidth: '30px',
      resize: 'both',
      display: 'inline-block',
    }" 
    @change="onTextareaChange"
    @mouseup="onEditorMouseUp"
  />
</template>

<script setup lang="ts">
import type { NodePort } from '@/node-blueprint/Base/Flow/Node/NodePort';
import type { IKeyValueObject } from '@/node-blueprint/Base/Utils/BaseTypes';
import { onMounted, type PropType, ref, toRefs } from 'vue'

const props = defineProps( {
  value: {
    type: String,
    default: '',
  },
  port: {
    type: Object as PropType<NodePort>,
      default: null
  },
  customData: {
    type: Object as PropType<IKeyValueObject>,
    default: null
  },
});

const emit = defineEmits([ 'update:value', 'update:custom-data'  ])

const { customData } = toRefs(props);
const editor = ref<HTMLTextAreaElement>();

onMounted(() => {
  const _editor = editor.value;
  if(customData?.value && parent && _editor) {
    _editor.style.width = (customData.value[`editor_w`] as number || 80) + 'px';
    _editor.style.height = (customData.value[`editor_h`] as number || 20) + 'px';
  }
});

function onEditorMouseUp() {
  const _editor = editor.value;
  if(customData?.value && _editor) {
    customData.value[`editor_w`] = _editor.offsetWidth;
    customData.value[`editor_h`] = _editor.offsetHeight;
    emit('update:custom-data', customData.value);
  }
}

function onTextareaChange(e: Event) {
  emit('update:value', (e.target as HTMLTextAreaElement).value)
}

</script>
