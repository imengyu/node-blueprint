<template>
  <div class="nana-modal-alert">
    <slot name="icon">
      <Spin v-if="icon === 'loading'" />
      <img v-else-if="icon" :src="finalIcon">
    </slot>
    <slot name="title">
      <h1 v-if="title">{{ title }}</h1>
    </slot>
    <slot name="content">
      <p v-if="content" style="white-space:pre;">{{ content }}</p>
    </slot>
    <div class="buttons">
      <Button v-if="showCancel" :loading="loadingCancel" v-bind="cancelProps" @click="handleCancel">{{ cancelText }}</Button>
      <Button status="primary" :loading="loadingConfirm" v-bind="confirmProps" @click="handleConfirm">{{ confirmText }}</Button>
    </div>
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, ref, type PropType } from 'vue';
import Button from '../Button/Button.vue';
import Spin from '../Common/Spin.vue';
import type { ModalContext } from './Alert';
import ErrorIcon from './AlertIcons/error.svg';
import HelpIcon from './AlertIcons/help.svg';
import PromptIcon from './AlertIcons/prompt.svg';
import SuccessIcon from './AlertIcons/success.svg';
import WarningIcon from './AlertIcons/warning.svg';

const props = defineProps({
  content: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  width: {
    type: [String,Number],
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  confirmProps: {
    type: Object,
    default: null,
  },
  cancelProps: {
    type: Object,
    default: null,
  },
  cancelText: {
    type: String,
    default: '取消',
  },
  confirmText: {
    type: String,
    default: '确定',
  },
  showCancel: {
    type: Boolean,
    default: false,
  },
  onConfirm: {
    type: Function as PropType<() => Promise<void>|void>,
    default: null,
  },
  onCancel: {
    type: Function as PropType<() => Promise<void>|void>,
    default: null,
  },
});

const emit = defineEmits([
  'finishConfirm',
  'finishCancel'
]);

const modalContext = inject<ModalContext>('ModalContext');
const loadingConfirm = ref(false);
const loadingCancel = ref(false);

function handleConfirm() {
  if (props.onConfirm) {
    const ret = props.onConfirm();
    if (typeof ret === 'object') {
      loadingConfirm.value = true;
      ret.then(() => {
        loadingConfirm.value = false;
        modalContext?.close();
        emit('finishConfirm');
      }).catch(() => {
        loadingConfirm.value = false;
      })
      return;
    }
  }
  emit('finishConfirm');
  modalContext?.close();
}
function handleCancel() {
  if (props.onCancel) {
    const ret = props.onCancel();
    if (typeof ret === 'object') {
      loadingCancel.value = true;
      ret.then(() => {
        loadingCancel.value = false;
        modalContext?.close();
        emit('finishCancel');
      }).catch(() => {
        loadingCancel.value = false;
      })
      return;
    }
  }
  emit('finishCancel');
  modalContext?.close();
}

const finalIcon = computed(() => {
  switch(props.icon) {
    case 'error': return ErrorIcon;
    case 'prompt': return PromptIcon;
    case 'help': return HelpIcon;
    case 'success': return SuccessIcon;
    case 'warning': return WarningIcon;
  }
  return props.icon;
});
</script>

<style lang="scss">
.nana-modal-alert {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 15px;

  > img {
    width: 45px;
    height: 45px;
    margin-bottom: 10px;
  }
  h1 {
    font-size: 17px;
    font-weight: bold;
    margin-top: 0;
    margin-bottom: 8px;
  }
  p {
    font-size: 14px;
    margin-top: 0;
    margin-bottom: 10px;
  }
  .buttons {
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
    margin-top: 10px;

    > button {
      margin: 0 4px;
    }
  }
}
</style>