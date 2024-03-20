<template>
  <Input 
    v-if="renameState"
    ref="input"
    :model-value="modelValue" 
    :placeholder="placeholder"
    :update-at="'blur'"
    :enterSubmit="true"
    @update:model-value="(s: string) => emit('update:model-value', s)"
    @blur="onBlur"
  />
  <div 
    v-else
    @click="onTextClick"
  >
    {{ modelValue }}
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue';
import Input, { type InputRef } from '../../Nana/Input/Input.vue';

const emit = defineEmits([ 'update:model-value', 'update:renameState' ])
const props = defineProps({
  renameState: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: '',
  },
})

const input = ref<InputRef>();
let lastClickTime = new Date();
let lateFocus = 0;

function onBlur() {
  if (props.renameState)
    emit('update:renameState', false);
}
function onTextClick() {
  const now = new Date();
  if (lateFocus > 0) {
    clearInterval(lateFocus);
    lateFocus = 0;
  }
  const time = now.getTime() - lastClickTime.getTime();
  if (time > 800 && time < 1800) {
    lateFocus = setTimeout(() => {
      showEdit();
      lateFocus = 0;
    }, 500);
  }
  lastClickTime = now;
}

function showEdit() {
  emit('update:renameState', true);
  nextTick(() => {
    input.value?.focus();
  });
}

</script>