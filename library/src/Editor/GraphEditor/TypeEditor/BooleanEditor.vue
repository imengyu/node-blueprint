<template>
  <div class="node-checkbox no-drag param-editor" @click="() => $emit('update:value', value ? false : true)">
    <div class="checker">
      <Icon v-if="value" icon="icon-select-bold" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import Icon from '@/Editor/Components/Shared/Icon.vue';
import type { IKeyValueObject } from '@/Common/Base/BaseTypes';
import type { NodePort } from '@/Core/Node/NodePort';
import type { PropType } from 'vue'

defineProps({
  value: {
    type: [Number,Object,Boolean],
    default: null
  },
  port: {
    type: Object as PropType<NodePort>,
      default: null
  },
  customData: {
    type: Object as PropType<IKeyValueObject>,
    default: null
  },
});
defineEmits(["update:value", "update:custom-data"]);
</script>
