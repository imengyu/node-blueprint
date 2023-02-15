<template>
  <input
    v-model="numberStringValue"
    type="text"
    :class="'param-editor' + (numberIsOk ? '' : ' input-border input-warn')"
    style="display: inline-block; width: 70px"
  >
  <Tooltip v-if="!numberIsOk" class="end-icon"  content="输入数字格式不正确">
    <Icon class="text-warning" icon="icon-warning-filling" />
  </Tooltip>
</template>

<script lang="ts">
import type { NodePort } from '@/node-blueprint/Base/Flow/Node/NodePort';
import type { IKeyValueObject } from '@/node-blueprint/Base/Utils/BaseTypes';
import StringUtils from '@/node-blueprint/Base/Utils/StringUtils';
import Icon from '../../Base/Icon.vue';
import { defineComponent, type PropType } from 'vue'
import Tooltip from '../../Base/Tooltip.vue';

export default defineComponent({
  name: "NumberEditor",
  emits: ["update-value", "update-custom-data"],
  props: {
    value: {
      type: [Number,Object],
      default: null
    },
    port: Object as PropType<NodePort>,
    customData: Object as PropType<IKeyValueObject>,
  },
  data() {
    return {
      numberStringValue: "",
      numberIsOk: true,
    };
  },
  watch: {
    numberStringValue(newV: string) {
      this.checkNumber(newV);
    },
    value(newV: string) {
      if (newV)
        this.numberStringValue = "" + newV;
      else
        this.numberStringValue = '';
    },
  },
  mounted() {
    if (this.value)
      this.numberStringValue = "" + this.value;
  },
  methods: {
    checkNumber(v: string) {
      if (StringUtils.isNumber(v)) {
        this.$emit("update-value", parseFloat(v));
        this.numberIsOk = true;
      }
      else
        this.numberIsOk = false;
    }
  },
  components: { Icon, Tooltip }
})
</script>
