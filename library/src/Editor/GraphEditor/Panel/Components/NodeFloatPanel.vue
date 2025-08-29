<template>
  <div 
    v-if="show"
    class="node-float-panel"
    :style="{
      left: `${adjustedPosition.x}px`,
      top: `${adjustedPosition.y}px`,
      width: `${size.x}px`,
      height: `${size.y}px`
    }"
    @wheel="$event.stopPropagation()"
    @contextmenu="$event.preventDefault()"
  >
    <div v-if="title" class="title">
      <span>{{ title }}</span>
      <Icon class="close" icon="icon-close-bold" @click="$emit('update:show', false)" />
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import Icon from '@/node-blueprint/Editor/Nana/Icon.vue';
import { watch, type PropType, ref } from 'vue';

defineEmits([ 'update:show' ]);

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  size: {
    type: Object as PropType<Vector2>,
    default: () => new Vector2(),
  },
  position: {
    type: Object as PropType<Vector2>,
    default: () => new Vector2(),
  },
});

const adjustedPosition = ref(new Vector2());

watch(() => props.show, (show) => {
  if (show) {
    adjustPanelPosition();
  }
})

function adjustPanelPosition() {
  if (props.position.x + props.size.x > window.innerWidth - 200)
    adjustedPosition.value.x = props.position.x - props.size.x;
  else
    adjustedPosition.value.x = props.position.x;
  if (props.position.y + props.size.y > window.innerHeight)
    adjustedPosition.value.y = window.innerHeight - props.size.y;
  else
    adjustedPosition.value.y = props.position.y;
}

</script>