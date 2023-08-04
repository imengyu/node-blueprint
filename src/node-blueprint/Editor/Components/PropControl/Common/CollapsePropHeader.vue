<template>
  <div>
    <div class="prop-header">
      <a href="javascript:;" @click="show=!show">
        <Icon :icon="show ? 'icon-arrow-down-bold' : 'icon-arrow-right-bold'" />
      </a>
      {{ title }}
    </div>
    <div v-show="show" class="prop-content">
      <slot />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import Icon from '../../../Nana/Icon.vue';

defineProps({
  title: {
    type: String,
    default: '',
  }
})

const show = ref(true);
</script>

<style lang="scss">
.prop-header {
  white-space: nowrap;
  position: relative;
  padding: 10px 2px 5px 15px;
  border-bottom: 1px solid var(--mx-editor-border-color);
  color: #b1b1b1;
  font-weight: bold;
  font-size: 14px;
  color: var(--mx-editor-text-color);

  a {
    vertical-align: middle;
    margin-right: 5px;
  }
  svg {
    fill: var(--mx-editor-text-color);
  }
} 
.prop-content {
  .prop-header {
    margin-left: 10px;
  }
}
</style>