<template>
  <input 
    v-model="numberStringValue"
    type="text" 
    :class="'param-editor'+(numberIsOk?'':' input-border input-warn')" 
    style="display: inline-block;; width: 88px"
  >
  <span v-if="!numberIsOk" title="'输入数字格式不正确'">
    <i class="iconfont icon-error-1 text-warning" />
  </span>
</template>

<script lang="ts" setup>
import type { NodePort } from '@/Core/Node/NodePort';
import type { IKeyValueObject } from '@/Common/Base/BaseTypes';
import type { PropType } from 'vue';
import { onMounted, ref, watch } from 'vue';
import { stringIsInteger } from '@/Common/String';

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
})
const emit = defineEmits([ 'update:value', 'update:custom-data' ]);

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
