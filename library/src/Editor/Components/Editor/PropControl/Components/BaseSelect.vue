<template>
  <select
    @change="(e: Event) => onValueUpdate(options[parseInt((e.target as HTMLSelectElement).value)].value)"
  >
    <option v-for="(it, k) in options" :key="k" :value="k" :selected="it.value === modelValue">{{ it.text }}</option>
  </select>
</template>

<script lang="ts" setup>
import type { PropType } from "vue";
import type { IDynamicFormItemSelectOption } from "./BaseSelect";

defineProps({
  modelValue: {},
  options: {
    type: Object as PropType<IDynamicFormItemSelectOption[]>,
    default: null,
  },
});

const emit = defineEmits([ 'update:modelValue' ]);

function onValueUpdate(v: unknown) {
  emit('update:modelValue', v);
}
</script>