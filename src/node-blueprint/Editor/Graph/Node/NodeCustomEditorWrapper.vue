<script lang="ts">
import type { Node, NodeCreateEditorFunction } from '@/node-blueprint/Base/Flow/Node/Node';
import { ref, h, type PropType, type VNode, onMounted, nextTick, defineComponent, inject } from 'vue'
import type { NodeGraphEditorInternalContext } from '../NodeGraphEditor';
import type { NodeEditor } from '../Flow/NodeEditor';

export default defineComponent({
  props: {
    createEditorFunction: {
      type: Function as PropType<NodeCreateEditorFunction>,
      default: null,
    },
    node: {
      type: Object as PropType<Node>,
      required: true,
    },
  },
  setup(props) {
    const hostRef = ref();
    const context = inject('NodeGraphEditorContext') as NodeGraphEditorInternalContext;

    onMounted(() => {
      nextTick(() => {
        if(typeof props.createEditorFunction === 'function')
          props.createEditorFunction(hostRef.value, props.node as NodeEditor, context);
      });
    });

    return () => {
      const childs = new Array<VNode>();

      if(typeof props.createEditorFunction === 'function') {
        const ret = props.createEditorFunction(undefined, props.node as NodeEditor, context);

        if (ret) {
          if (ret instanceof Array)
            childs.push(...ret);
          else
            childs.push(ret);
        }  

        return h('div', {
          class: 'node-block-custom-editor custom-editor',
          ref: hostRef
        }, childs);
      } else {
        return h('div', {
          ref: hostRef
        });
      }
    };
  },
});
</script>
