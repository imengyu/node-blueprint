<template>
  <div
    :class="[
      'collapse-item',
      openInner ? 'open' : '',
    ]"
  >
    <span class="collapse-title" @click="openInner=!openInner">
      <Icon class="collapse-arrow" icon="icon-arrow-right-bold" />
      {{ title }}
    </span>
    <slot v-if="openInner" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import Icon from '../../Nana/Icon.vue';

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
  display: block;
  padding: 3px 2px 3px 7px;

  &.open {
    > .collapse-title .collapse-arrow {
      transform: rotate(90deg);
    }
  }

  .collapse-title {
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    user-select: none;
    cursor: pointer;

    i {
      transition: transform ease-in-out 0.2s;
    }

    &:hover {
      color: var(--mx-editor-blue-text-color);

      i {
        color: var(--mx-editor-blue-text-color);
      }
    }
  }
  .collapse-arrow {
    fill: var(--mx-editor-text-color);
    margin-right: 3px;
    transition: transform ease-in-out 0.1s;
  }
}
</style>

