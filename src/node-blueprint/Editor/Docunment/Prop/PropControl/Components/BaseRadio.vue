<template>
  <div class="prop-control-base-control radio">
    <div 
      v-for="item in items"
      :key="item.value"
      class="item" 
    >
      <input 
        :id="name+item.value"
        type="radio"
        :disabled="disabled"
        :name="name"
        :value="item.value"
        :checked="modelValue==item.value"
        @change="() => onValueUpdate(item.value)"
      >
      <label :for="name+item.value">{{ item.label }}</label>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from "vue";

defineProps({
  name: {
    type: String,
    default: "",
  },
  modelValue: {},
  disabled: {
    type: Boolean,
    default: false,
  },
  items: {
    type: Object as PropType<Array<{
      value: string,
      label: string,
    }>>,
    default: () => ([] as Object),
  }
});

const emit = defineEmits([ 'update:modelValue' ]);

function onValueUpdate(v: string) {
  emit('update:modelValue', v);
}
</script>

<style lang="scss">
.prop-control-base-control.radio {
  display: flex;
  flex-direction: row;

  .item {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  input {
    position: relative;
    appearance: none;
    width: 22px;
    height: 22px;
    border-radius: 22px;
    background-color: var(--mx-editor-backgroud);
    border: 1px solid var(--mx-editor-text-color);
    margin: 0;
    margin-right: 5px;
    
    &:after {
      position: absolute;
      display: inline-block;
      top: 3px;
      left: 3px;
      width: 14px;
      height: 14px;
      content: "";
      border: none;
      text-align: center;
      border-radius: 14px;
    }

    &:checked {
      &:after {
        background-color: var(--mx-editor-text-color);
      }
    }

  }
}
</style>