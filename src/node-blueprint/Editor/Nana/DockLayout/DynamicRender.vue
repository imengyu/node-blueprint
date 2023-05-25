<script lang="ts">
import { defineComponent, h, type PropType, type VNode } from 'vue'

export default defineComponent({
  name: 'VNodeRenderer',
  props: {
    render: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type: Function as PropType<(param: any) => (VNode|VNode[]|undefined)>,
      default: null
    },
    data: {},
  },
  render() {
    if(typeof this.render === 'function')
      return this.render(this.data);
    return h('div');
  }
})
</script>