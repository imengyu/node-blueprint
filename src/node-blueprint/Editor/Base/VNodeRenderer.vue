<script lang="ts">
import { IKeyValueObject } from '@/model/BluePrintEditorBase';
import { defineComponent, h, PropType, VNode } from 'vue'

export default defineComponent({
  name: 'VNodeRenderer',
  props: {
    vnode: {
      type: Object as PropType<VNode>,
      default: null
    },
    renderChild: {
      type: Boolean,
      default: null
    },
    data: {
      type: Object as PropType<IKeyValueObject>,
      default: null
    },
  },
  render() {
    if(this.vnode) {
      const props = this.vnode.props;
      if(props)
        for(let key in this.data)
          props[key] = this.data[key];
      return this.renderChild ? 
        h('div', { style: { height: '100%'} }, [
          this.vnode
        ]) : 
        this.vnode;
    }
    return h('div');
  }
})
</script>