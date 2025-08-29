<template>
  <input
    :type="password?'password':'text'" 
    :value="modelValue"
    :placeholder="placeholder"
    @update:modelValue="(e: string) => onValueUpdate(e)"
    @change="(e: Event) => onValueUpdate((e.target as HTMLInputElement).value)"
  >
</template>

<script lang="ts" setup>
defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
  password: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([ 'update:modelValue' ]);

function onValueUpdate(v: string) {
  emit('update:modelValue', v);
}
</script>