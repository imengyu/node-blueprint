<template>
  <div
    :class="[
      'nana-input',
      disabled ? 'disabled' : '',
      focus ? 'focus' : '',
      size,
    ]"
  >
    <div class="nana-prefix">
      <slot name="prefix" />
    </div>

    <input 
      class="nana-input-inner"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :readonly="readonly"
      :disabled="disabled"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
    >

    <div class="nana-suffix">
      <slot name="suffix" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue';

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

const focus = ref(false);

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value);
}
function onFocus() {
  focus.value = true;
}
function onBlur() {
  focus.value = false;
}

</script>

<style lang="scss">
.nana-input {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;

  .nana-prefix, .nana-suffix {
    display: flex;
    align-self: center;
  }

  input {
    flex: 1;
    border: none;
    color: inherit;
    background-color: transparent;

    &:focus {
      outline: none;
    }
  }

  &.disabled {
    
  }
  &.focus {
    
  }

}
</style>