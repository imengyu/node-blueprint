<template>
  <input :modelValue="value" @update:modelValue="(v: string) => $emit('update:value', v)" />
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
  },
});
</script>

<style lang="scss">

</style>