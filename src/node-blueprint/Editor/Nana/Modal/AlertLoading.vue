<template>
  <Teleport :to="teleport">
    <div 
      v-if="show" 
      :class="[
        'nana-modal-loading',
        mask ? 'mask' : '',
        show ? 'show' : '',
      ]"
      :style="{
        zIndex,
      }"
    >
      <div>
        <Spin v-if="showLoading" />
        <span>{{ title }}</span>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { onMounted,  ref, watch } from 'vue';
import { getModalCurrentZIndex } from './ModalTeleport';
import Spin from '../Common/Spin.vue';

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  showLoading: {
    type: Boolean,
    default: true,
  },
  mask: {
    type: Boolean,
    default: true,
  },
  title: {
    type: String,
    default: '',
  },
  teleport: {
    type: String,
    default: '#app',
  }
});

const zIndex = ref(0);


function showPrepare() {
  zIndex.value = getModalCurrentZIndex(true);
}
watch(() => props.show, (v) => {
  if (v) {
    showPrepare();
  }
  else {
    zIndex.value = getModalCurrentZIndex(false);
  }
});
onMounted(() => {
  if (props.show) {
    showPrepare();
  }
})

</script>

<style lang="scss">
.nana-modal-loading {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  pointer-events: none;

  &.mask {
    pointer-events: all;
    background-color: rgba(0,0,0,0.2);
  }
  &.show {
    pointer-events: initial;
  }

  > div {
    width: 200px;
    height: 130px;
    box-shadow: 0 0 20px 0px rgba(0, 0, 0, 0.1);
    border: 1px solid #ddd;
    background-color: #fff;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding-top: 6px;

    span {
      margin-top: 20px;
      color: #666;
    }
  }
}
</style>