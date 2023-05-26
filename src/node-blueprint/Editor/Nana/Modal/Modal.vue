<template>
  <Teleport :to="teleport">
    <div
      v-if="show"
      :class="[
        'nana-modal-container',
        mask ? 'mask' : '',
        modalCloseAnim ? 'close-anim' : '',
      ]"
      :style="{
        zIndex
      }"
    >
      <div 
        class="simple-modal"
        :class="[
          !title ? 'float-title' : '',
          full ? 'full' : '',
          blur ? 'blur' : '',
          contentPadding ? 'padding' : '',
          scroll ? 'scroll' : '',
          round ? 'round' : '',
          transparent ? 'transparent' : '',
        ]"
        :style="{
          width: width,
          height: height,
          maxHeight: maxHeight,
        }"
      >
        <div class="title">
          <div class="close-placeholder" />
          <span>{{ title }}</span>
          <slot name="end-button" :close="() => runCloseAnim()" />
          <img v-if="showClose" class="close" :src="ModalClose" @click="runCloseAnim">
          <div v-else class="close-placeholder" />
        </div>
        <div class="content">
          <slot />
        </div>
        <div v-if="$slots.footer" class="footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts">
import { onMounted } from 'vue';
import { defineComponent, ref, type PropType, watch, provide } from 'vue';
import { getDefaultModalTeplport, getModalCurrentZIndex } from './ModalTeleport';
import type { ModalContext } from './Alert';
import ModalClose from './ModalClose.svg';

export default defineComponent({
  name: 'Modal',
  props: {
    show: {
      type: Boolean,
      default: false,
    },
    scroll: {
      type: Boolean,
      default: false,
    },
    transparent: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: '',
    },
    showClose: {
      type: Boolean,
      default: true,
    },
    round: {
      type: Boolean,
      default: true,
    },
    teleport: {
      type: String,
      default: () => getDefaultModalTeplport(),
    },
    contentPadding: {
      type: Boolean,
      default: true,
    },
    draggable: {
      type: Boolean,
      default: true,
    },
    resizeable: {
      type: Boolean,
      default: false,
    },
    full: {
      type: Boolean,
      default: false,
    },
    mask: {
      type: Boolean,
      default: true,
    },
    blur: {
      type: Boolean,
      default: false,
    },
    width: {
      type: [String,Number],
      default: '',
    },
    maxHeight: {
      type: [String,Number],
      default: '',
    },
    height: {
      type: [String,Number],
      default: '',
    },
    beforeClose: {
      type: Function as PropType<() => Promise<void>>,
      default: null,
    },
  },
  emits: [ 
    'update:show',
    'close'
  ],
  setup(props, ctx) {
    const modalCloseAnim = ref(false);
    const zIndex = ref(0);

    async function runCloseAnim() {
      if (props.beforeClose)
        await props.beforeClose();
      modalCloseAnim.value = true;
      setTimeout(() => {
        ctx.emit('update:show', false);
        ctx.emit('close');
      }, 250);
    }

    function showPrepare() {
      zIndex.value = getModalCurrentZIndex(true);
      modalCloseAnim.value = false;
    }

    watch(() => props.show, (v) => {
      if (v) {
        showPrepare();
      }
      else {
        zIndex.value = getModalCurrentZIndex(false);
      }
    });

    provide<ModalContext>('ModalContext', {
      close: runCloseAnim,
    });

    onMounted(() => {
      if (props.show) {
        showPrepare();
      }
    })

    return {
      ModalClose,
      modalCloseAnim,
      runCloseAnim,
      zIndex,
    };
  },
});
</script>


<style lang="scss">
@import "../Scss/Scroll.scss";

@keyframes nana-modal-out {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  60% {
    transform: scale(1.5);
    opacity: 0;
  }
  100% {
    transform: scale(3);
    opacity: 0;
  }
}
@keyframes nana-modal-in {
  0% {
    transform: scale(1.5);
    opacity: 0;
  }
  40% {
    transform: scale(1.3);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.nana-modal-container {
  position: absolute;
  z-index: 1000;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  transition: all ease-in-out 0.2s;

  &.mask {
    pointer-events: all;
    background-color: rgba(0,0,0,0.2);
  }
  &.close-anim {
    background-color: transparent;

    .simple-modal {
      animation: nana-modal-out 0.3s cubic-bezier(0.755, 0.050, 0.855, 0.060) both;
    }
  }
}
.simple-modal {
  position: relative;
  display: flex;
  flex-direction: column;
  pointer-events: all;
  border: 1px solid #b3b3b3;
  box-shadow: 0 0 15px 0 rgba(#000, 0.1);
  background-color: #fff;
  animation: nana-modal-in 0.3s cubic-bezier(0.250, 0.460, 0.450, 0.940) both;
  overflow: hidden;
  min-width: 230px;
  max-width: 100%;
  max-height: 100%;
  
  &.round {
    border-radius: 15px;
  }
  &.full {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
  &.blur {
    border: none;
    background-color: rgba(#fff, 0.6);
    box-shadow: 0 0 10px 4px rgba(#fff, 0.1);
    backdrop-filter: saturate(180%) brightness(120%) blur(20px);

    .nana-button:not(.status) {
      background-color: transparent;
    }
  }
  &.transparent {
    border: none;
    box-shadow: none;
    background-color: transparent;

    .close {
      background-color: #fff;
    }
  }
  &.scroll {

    > .content {
      height: 0;
      flex: 1;
      overflow: scroll;

      @include pc-fix-scrollbar();
    }
  }

  &.float-title .title {
    position: absolute;
    top: 0;
    right: 0;
    width: 50px;
    z-index: 1001;
    border-bottom: none;
  }

  .title {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 8px 6px 5px 6px;
    border-bottom: 1px solid #f5f5f5;
    user-select: none;

    span {
      font-size: 16px;
      font-weight: bold;
    }

    .close-placeholder {
      width: 30px;
    }
    .close {
      padding: 10px;
      width: 10px;
      height: 10px;
      cursor: pointer;
      border-radius: 4px;

      &:hover {
        background-color: #e6e6e6;
      }
    }
  }
  .content {
    position: relative;
    height: 100%;
  }
  .footer {
    padding: 10px 15px;
    background-color: #f8f8f8;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
  }

  &.padding .content {
    padding: 18px;
  }
}
</style>