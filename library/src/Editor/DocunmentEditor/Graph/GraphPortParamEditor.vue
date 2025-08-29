<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { IKeyValueObject, ISaveableTypes } from '@/node-blueprint/Base/Utils/BaseTypes';
import type { INodePortDefine } from '@/node-blueprint/Base/Flow/Node/NodePort';

export default defineComponent({
  props: {
    port: {
      type: Object as PropType<INodePortDefine>,
      required: true,
    },
  },
  render() {
    if (this.port?.paramType?.define?.typeEditor)
      return [
        this.port.paramType.define.typeEditor({
          value: this.port.paramDefaultValue ?? this.port.paramType.define.defaultValue(),
          'onUpdate:value': (v : ISaveableTypes) => {
            const port = this.port;
            port.paramDefaultValue = v;
          },
        } as unknown as IKeyValueObject)
      ];
    return [];
  },
});
</script>