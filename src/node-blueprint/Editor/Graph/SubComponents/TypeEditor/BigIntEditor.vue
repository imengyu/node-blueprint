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

<script lang="ts">
import type { NodePort } from '@/node-blueprint/Base/Flow/Node/NodePort';
import type { IKeyValueObject } from '@/node-blueprint/Base/Utils/BaseTypes';
import StringUtils from '@/node-blueprint/Base/Utils/StringUtils';
import { defineComponent, type PropType } from 'vue'

export default defineComponent({
  name: 'NumberEditor',
  props: {
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
  },
  emits: [ 'update:value', 'update:custom-data' ],
  data() {
    return {
      numberIsOk: true,
      numberStringValue: '',
    }
  },
  watch: {
    numberStringValue(newV: string) {
      this.checkNumber(newV);
    },
  },
  mounted() {
    this.numberStringValue = '' + this.value;
  },
  methods: {
    checkNumber(v : string) {
      if(StringUtils.isInteger(v)) {
        this.$emit('update:value', BigInt(parseInt(v)));
        this.numberIsOk = true;
      }
      else this.numberIsOk = false;
    }
  }
})
</script>
