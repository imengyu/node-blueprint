<template>
  <div>
    <div class="prop-header">
      <div>
        <a v-if="!noFold" href="javascript:;" @click="show=!show">
          <Icon :icon="show ? 'icon-arrow-down-bold' : 'icon-arrow-right-bold'" />
        </a>
        {{ title }} 
      </div> 
      <slot name="titleRight" />
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
  },
  noFold: {
    type: Boolean,
    default: false,
  },
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
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  position: relative;
  padding: 10px 15px 5px 15px;
  border-bottom: 1px solid var(--mx-editor-border-color-dark);
  background-color: var(--mx-editor-background-third-color);

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
.prop-content {
  position: relative;
}
</style>