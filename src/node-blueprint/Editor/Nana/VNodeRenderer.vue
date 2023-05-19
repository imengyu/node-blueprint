<script lang="ts">
import type { IKeyValueObject } from '@/node-blueprint/Base/Utils/BaseTypes';
import { defineComponent, h, type PropType, type VNode } from 'vue'

export default defineComponent({
  name: 'VNodeRenderer',
  props: {
    /**
     * 直接渲染指定的虚拟节点。
     */
    vnode: {
      type: Object as PropType<VNode>,
      default: null
    },
    /**
     * 渲染回调函数。
     */
    render: {
      type: Function as PropType<(data: IKeyValueObject) => VNode>,
      default: null
    },
    /**
     * 附加参数
     * * 如果指定了 vnode，则此参数将会作为vnode的props传入。
     * * 如果指定了 render，则此参数将会作为 render 的 data 参数。
     */
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
      return this.vnode;
    }
    else if (this.render)
      return this.render(this.data);
    return h('div');
  }
})
</script>