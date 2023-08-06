<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { IKeyValueObject, ISaveableTypes } from '@/node-blueprint/Base/Utils/BaseTypes';
import type { NodeVariable } from '@/node-blueprint/Base/Flow/Graph/NodeVariable';

export default defineComponent({
  props: {
    variable: {
      type: Object as PropType<NodeVariable>,
      required: true,
    },
  },
  render() {
    if (this.variable.type.define?.typeEditor)
      return [
        this.variable.type.define.typeEditor({
          customData: this.variable.customData,
          value: this.variable.defaultValue,
          'onUpdate:value': (v : ISaveableTypes) => {
            const variable = this.variable;
            variable.defaultValue = v;
          },
          'onUpdate:custom-data': (v : ISaveableTypes) => {
            const variable = this.variable;
            variable.customData = v as IKeyValueObject;
          },
        } as unknown as IKeyValueObject)
      ];
    return [];
  },
});
</script>