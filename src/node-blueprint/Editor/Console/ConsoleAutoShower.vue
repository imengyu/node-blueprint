<template>
  <ConsoleObjectShower
    v-if="typeof value ==='object'"
    :value="value"
    @onGoRef="(d: string,b: string,p: string) => $emit('onGoRef', d,b,p)" 
  />
  <ConsoleRefShower 
    v-else 
    :value="value"
    :isTop="true"
    @onGoRef="(d: string,b: string,p: string) => $emit('onGoRef', d,b,p)"
  />
</template>

<script lang="ts" setup>
import ConsoleObjectShower from './ConsoleObjectShower.vue';
import ConsoleRefShower from './ConsoleRefShower.vue'

defineEmits([ 'onGoRef' ]);
defineProps({
  value: {
    type: null,
    default: null,
  },
});
</script>

