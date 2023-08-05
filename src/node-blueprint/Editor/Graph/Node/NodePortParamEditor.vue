<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { NodePort } from '@/node-blueprint/Base/Flow/Node/NodePort';
import type { IKeyValueObject, ISaveableTypes } from '@/node-blueprint/Base/Utils/BaseTypes';

export default defineComponent({
  props: {
    port: {
      type: Object as PropType<NodePort>,
      required: true,
    },
  },
  render() {
    if (this.port.paramType.define?.typeEditor)
      return [
        this.port.paramType.define.typeEditor({
          customData: this.port.parent.options[`port_${this.port.guid}_custom_data`] || {},
          port: this.port,
          value: this.port.getValue(),
          'onUpdate:value': (v : ISaveableTypes) => this.port.setValue(v),
          'onUpdate:custom-data': (v : ISaveableTypes) => this.$props.port.parent.options[`port_${this.port.guid}_custom_data`] = v,
        } as unknown as IKeyValueObject)
      ];
    return [];
  },
});
</script>