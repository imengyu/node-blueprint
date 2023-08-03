<template>
  <div
    :class="[
      'nana-input',
      disabled ? 'disabled' : '',
      size,
    ]"
  >
    <div class="nana-prefix">
      <slot name="prefix" />
    </div>

    <input 
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :readonly="readonly"
      :disabled="disabled"
      @input="onInput"
    >

    <div class="nana-suffix">
      <slot name="suffix" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text',
  },
  /**
   * 按钮大小，可选 mini，small，normal，large
   */
  size: {
    type: String as PropType<'mini'|'small'|'normal'|'large'>,
    default: 'normal',
  },
  /**
   * 是否显示密码预览按钮
   */
  showPassword: {
    type: Boolean,
    default: false,
  },
  /**
   * 默认提示
   */
  placeholder: {
    type: String,
    default: '',
  },
  /**
   * 是否只读
   */
  readonly: {
    type: Boolean,
    default: false,
  },
  /**
   * 是否禁用
   */
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([ 'update:modelValue' ])

function onInput(e: Event) {
  
  emit('update:modelValue', (e.target as HTMLInputElement).value);
}
</script>

<style lang="scss">
.nana-input {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;

  input {
    flex: 1;
  }

  &.disabled {
    
  }

}
</style>