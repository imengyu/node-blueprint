<template>
  <textarea :modelValue="value" @update:modelValue="(v: string) => $emit('update:value', v)"></textarea>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  emits: [ 'update:value' ],
  props: {
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
  },
});
</script>

<style lang="scss">

</style>