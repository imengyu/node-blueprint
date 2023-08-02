<template>
  <textarea
    :rows="rows"
    :cols="cols"
    :maxlength="maxlength"
    :value="value"
    @change="(e: Event) => onValueUpdate((e.target as HTMLInputElement).value)"
  />
</template>

<script lang="ts" setup>
defineProps({
  value: {
    type: String,
    default: "",
  },
  cols: {
    type: Number,
    default: undefined,
  },
  rows: {
    type: Number,
    default: undefined,
  },
  maxlength: {
    type: Number,
    default: undefined,
  },
});

const emit = defineEmits([ 'update:modelValue' ]);

function onValueUpdate(v: string) {
  emit('update:modelValue', v);
}
</script>