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
import { watch, ref } from 'vue';
import Icon from '../../../Nana/Icon.vue';

const props = defineProps({
  title: {
    type: String,
    default: '',
  }
})

const show = ref(readGroupCollapse());

function readGroupCollapse() {
  const set = JSON.parse(localStorage.getItem('CollapsePropHeaderState') || '{}')
  return set[props.title] !== false;
}
function saveGroupCollapse() {
  const set = JSON.parse(localStorage.getItem('CollapsePropHeaderState') || '{}')
  set[props.title] = show.value ? undefined : false;
  localStorage.setItem('CollapsePropHeaderState', JSON.stringify(set));
}

watch(show, () => {
  saveGroupCollapse();
});
</script>

<style lang="scss">
.prop-header {
  white-space: nowrap;
  position: relative;
  padding: 10px 2px 5px 15px;
  border-bottom: 1px solid var(--mx-editor-border-color-dark);
  color: #b1b1b1;
  font-weight: bold;
  font-size: var(--mx-editor-font-size-small);
  color: var(--mx-editor-text-color);

  a {
    vertical-align: middle;
    margin-right: 5px;
  }
  svg {
    fill: var(--mx-editor-text-color);
  }
}
</style>