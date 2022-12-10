<template>
  <input class="base-checkbox" type="checkbox" :modelValue="value" @update:modelValue="(v: string) => $emit('update:value', v)" />
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  emits: ['update:value'],
  props: {
    value: {
      type: String,
      default: "",
    },
  },
});
</script>

<style lang="scss">
.base-checkbox {
  vertical-align: middle;
  display: inline-block;
  position: relative;
  background: transparent;
  appearance: none;
  height: 18px;
  width: 18px;
  overflow: hidden;

  &:after {
    display: inline-block;
    width: 18px;
    height: 18px;
    top: 0px;
    content: "";
    background-color: #292929;
    color: #ffffff;
    border-radius: 6px;
    border: none;
    text-align: center;
    font-size: 12px;
    font-weight: bold;
    font-family: 'iconfont';

    &:hover {
      background-color: #777777;
    }

    &:active {
      background-color: #181818;
    }
  }

  &[disabled=disabled]:after {
    background-color: #8f8f8f;
    color: #e2e2e2;

    &:hover {
      background-color: #8f8f8f;
    }
  }

  &:checked:after {
    content: "\e852";
  }
}
</style>