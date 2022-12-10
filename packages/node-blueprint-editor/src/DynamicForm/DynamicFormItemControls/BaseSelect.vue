<template>
  <select :modelValue="value" @update:modelValue="(v: string) => $emit('update:value', v)">
    <option v-for="(it, k) in options" :key="k" :value="it.value">{{ it.text }}</option>
  </select>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import { IDynamicFormItemSelectOption } from "./BaseSelect";

export default defineComponent({
  emits: [ 'update:value' ],
  props: {
    value: {
      type: String,
      default: "",
    },
    options: {
      type: Object as PropType<IDynamicFormItemSelectOption[]>,
      default: null,
    },
  },
});
</script>

<style lang="scss">

</style>