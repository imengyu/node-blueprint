<template>
  <div class="small-button" @click="$emit('click')">
    <Icon v-if="icon && iconPlace === 'before'" class="mr-1" :icon="icon" />
    {{ text }}
    <slot />
    <Icon v-if="icon && iconPlace === 'after'" class="mr-1" :icon="icon" />
  </div>
</template>

<script lang="ts" setup>
import Icon from './Icon.vue';

defineProps({
  icon: String,
  iconPlace: {
    type: String,
    default: "before"
  },
  text: String
})
</script>

<style lang="scss">
.small-button {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  text-decoration: none;
  color: #cccccc;
  user-select: none;
  color: #fff;
  cursor: pointer;
  padding: 2px 4px;

  &:hover {
    background-color: #7e7e7e;
    border-radius: 3px;
    color: #fff;
  }

  .node-icon {
    margin-right: 3px;
  }
}
</style>