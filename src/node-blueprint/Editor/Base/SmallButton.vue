<template>
  <div class="small-button" @click="$emit('click')">
    <i v-if="icon && iconPlace==='before'" :class="'iconfont mr-1 '+icon" />
    {{ text }}
    <slot />
    <i v-if="icon && iconPlace==='after'" :class="'iconfont mr-1 '+icon" />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'SmallButton',
  emits: [ 'click' ],
  props: {
    icon: String,
    iconPlace: { 
      type:String,
      default: 'before'
    },
    text: String
  },
})
</script>

<style lang="scss">
.small-button {
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
}
</style>