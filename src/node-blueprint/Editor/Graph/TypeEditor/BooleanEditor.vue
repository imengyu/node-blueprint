<template>
  <div class="node-checkbox no-drag param-editor" @click="() => $emit('update-value', value ? false : true)">
    <div class="checker">
      <Icon v-if="value" icon="icon-select-bold" />
    </div>
  </div>
</template>

<script lang="ts">
import type { NodePort } from '@/node-blueprint/Base/Flow/Node/NodePort';
import type { IKeyValueObject } from '@/node-blueprint/Base/Utils/BaseTypes';
import { defineComponent, type PropType } from 'vue'
import Icon from '../../Base/Icon.vue';

export default defineComponent({
  name: "BooleanEditor",
  emits: ["update-value", "update-custom-data"],
  props: {
    value: {
      type: [Number,Object],
      default: null
    },
    port: Object as PropType<NodePort>,
    customData: Object as PropType<IKeyValueObject>,
  },
  components: { Icon }
})
</script>
