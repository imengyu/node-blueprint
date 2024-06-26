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
      ref="inputRef"
      class="nana-input-inner"
      :draggable="false"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :readonly="readonly"
      :disabled="disabled"
      @input="onInput"
      @focus="onFocus"
      @blur="onBlur"
      @keypress="onKeyPress"
    >

    <div class="nana-suffix">
      <slot name="suffix" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue';

export interface InputRef {
  focus: () => void;
  blur: () => void;
}

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  /**
   * 更新策略 
   * * 'input' 输入后立即更新
   * * 'blur' 在失去焦点时更新
   */
  updateAt: {
    type: String as PropType<'input'|'blur'>,
    default: 'input',
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
  /**
   * 是否Enter键提交
   */
  enterSubmit: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([ 'update:modelValue', 'focus', 'blur' ])

const inputRef = ref<HTMLInputElement>();
const focus = ref(false);

function onInput(e: Event) {
  if (props.updateAt === 'input')
    emit('update:modelValue', (e.target as HTMLInputElement).value);
}
function onFocus() {
  focus.value = true;
  emit('focus');
}
function onBlur(e: Event) {
  focus.value = false;
  if (props.updateAt === 'blur')
    emit('update:modelValue', (e.target as HTMLInputElement).value);
  emit('blur');
}
function onKeyPress(e: KeyboardEvent) {
  if (props.enterSubmit && e.key === 'Enter')
    inputRef.value?.blur();
}

defineExpose({
  focus() {
    inputRef.value?.focus();
  },
  blur() {
    inputRef.value?.blur();
  },
});

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