<template>
  <div 
    v-if="imageUrlOrIcon"
    :style="{
      backgroundImage: !imageUrlOrIcon.startsWith('icon:') && !imageUrlOrIcon.startsWith('title:') ?
        `url('${imageUrlOrIcon}')` : '',
      backgroundSize: `${size}px ${size}px`,
      width: noContainerSize ? undefined : `${size}px`,
      height: noContainerSize ? undefined : `${size}px`,
    }"
  >
    <slot>
      <Icon 
        v-if="imageUrlOrIcon.startsWith('icon:')"
        :icon="imageUrlOrIcon.substring(5)" 
        :size="size"
      />
    </slot>
  </div>
</template>

<script lang="ts" setup>
import Icon from '../../Base/Icon.vue';

defineProps({
  imageUrlOrIcon: {
    type: String,
    default: '',
  },
  size: {
    type: Number,
    required: true,
  },
  noContainerSize: {
    type: Boolean,
    default: false,
  },
});
</script>