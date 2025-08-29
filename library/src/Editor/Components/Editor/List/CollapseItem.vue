<template>
  <div
    :class="[
      'collapse-item',
      openInner ? 'open' : '',
    ]"
  >
    <CodeLayoutCollapseTitle
      :title="title"
      :actions="[]"
      @click="openInner=!openInner"
    />
    <div class="content">
      <slot v-if="openInner" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { CodeLayoutCollapseTitle } from 'vue-code-layout';

const openInner = ref(false);

const emit = defineEmits([ 'update:open' ])
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  open: {
    type: Boolean,
    default: false
  },
})

watch(() => props.open, (v) => {
  openInner.value = v;
});
watch(openInner, (v) => {
  if (v !== props.open)
    emit('update:open', v);
});

onMounted(() => {
  openInner.value = props.open;
})
</script>

<style lang="scss">
.collapse-item {
  position: relative;
  display: block;
  padding: 0 0 0 8px;

  .code-layout-collapse {
    border-top: none!important;
  }

  > .content {
    padding: 0 0 0 15px;
  }

  &::after {
    position: absolute;
    content: '';
    left: 20px;
    top: 20px;
    bottom: 0px;
    width: 1px;
    opacity: 0;
    transition: opacity ease-in-out 0.3s;
    pointer-events: none;
    background-color: var(--code-layout-color-border-light);
    z-index: 20;
  }

  &:hover {
    &::after {
      opacity: 1;
    }
  }

  &.open {
    > .code-layout-collapse .collapse-title .arrow {
      transform: rotate(90deg);
    }
  }
}
</style>

