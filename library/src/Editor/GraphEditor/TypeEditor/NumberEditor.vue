<template>
  <input
    v-model="numberStringValue"
    type="text"
    :class="'param-editor' + (numberIsOk ? '' : ' input-border input-warn')"
    style="display: inline-block; width: 70px"
  >
  <Tooltip v-if="!numberIsOk" class="end-icon" content="输入数字格式不正确">
    <Icon class="text-warning" icon="icon-warning-filling" />
  </Tooltip>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, type PropType } from 'vue'
import type { IKeyValueObject } from '@/Common/Base/BaseTypes';
import type { NodePort } from '@/Core/Node/NodePort';
import { stringIsInteger } from '@/Common/String';
import Tooltip from '@/Editor/Components/Shared/Tooltip/Tooltip.vue';
import Icon from '@/Editor/Components/Shared/Icon.vue';

const props = defineProps({
  value: {
    type: [Number,Object],
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
const emit = defineEmits([ "update:value", "update:custom-data"]);

const numberIsOk = ref(true);
const numberStringValue = ref('');

watch(numberStringValue, (v) => {
  checkNumber(v);
})
onMounted(() => {
  numberStringValue.value = '' + props.value;
})

function checkNumber(v : string) {
  if(stringIsInteger(v)) {
    emit('update:value', BigInt(parseInt(v)));
    numberIsOk.value = true;
  }
  else 
    numberIsOk.value = false;
}
</script>
