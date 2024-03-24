<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import type { NodePort } from '@/node-blueprint/Base/Flow/Node/NodePort';
import type { IKeyValueObject, ISaveableTypes } from '@/node-blueprint/Base/Utils/BaseTypes';
import type { NodePortEditor } from '../Flow/NodePortEditor';
import type { NodeGraphEditorContext } from '../NodeGraphEditor';
import type { NodeParamEditorCreateCallback } from '@/node-blueprint/Base/Flow/Type/NodeParamType';

export default defineComponent({
  inject: [
    'NodeGraphEditorContext'
  ],
  props: {
    port: {
      type: Object as PropType<NodePort>,
      required: true,
    },
  },
  data() {
    return {
      customEditor: null as NodeParamEditorCreateCallback|null,
    };
  },
  mounted() {
    if (this.port.parent.events.onCreatePortCustomEditor) {
      this.customEditor = this.port.parent.events.onCreatePortCustomEditor(
        this.port as NodePortEditor, 
        this.NodeGraphEditorContext as NodeGraphEditorContext,
      ) || null;
    }
  },
  render() {
    const componentRender = this.customEditor || this.port.paramType.define?.typeEditor;
    if (componentRender)
      return [
        componentRender({
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