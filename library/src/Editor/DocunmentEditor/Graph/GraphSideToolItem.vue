<template>
  <SimpleTooltip
    :content="tooltip"
    :direction="'right'"
    :enable="enable"
  >
    <div 
      ref="button"
      :class="[
        'tool-item', 
        'button',
        'icon',
        color,
        enable ? '' : 'disabled',
        active ? 'active' : '',
      ]"
      @click="$emit('click')"
    >
      <Icon :icon="icon" />
    </div>
  </SimpleTooltip>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue';
import Icon from '@/Editor/Components/Shared/Icon.vue';
import HtmlUtils from '@/Common/Html';
import { Vector2 } from '@/Common/Base/Vector2';
import { SimpleTooltip } from 'vue-code-layout';

const button = ref<HTMLElement>();

defineEmits([ 'click' ]);
defineProps({
  icon: {
    type: String,
    default: '',
  },
  color: {
    type: String as PropType<''|'green'|'red'|'blue'|'yellow'>,
    default: '',
  },
  active: {
    type: Boolean,
    default: false,
  },
  enable: {
    type: Boolean,
    default: true,
  },
  tooltip: {
    type: String,
    default: '',
  },
})

defineExpose({
  getButtonPosition() {
    return new Vector2(
      HtmlUtils.getLeft(button.value!) + button.value!.offsetWidth,
      HtmlUtils.getTop(button.value!),
    )
  }
})
</script>