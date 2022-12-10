<script lang="ts">
import { defineComponent, h, VNode } from 'vue';
/**
 * 24列栅格行组件。
 */
export default defineComponent({
  props: {
    /**
     * 列元素之间的间距（单位为px）
     */
    gutter: {
      type: Number,
      default: 0
    },
    /**
     * 主轴对齐方式，可选值为 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
     */
    justify: {
      type: String,
      default: undefined,
    },
    /**
     * 交叉轴对齐方式，可选值为 "center" | "flex-start" | "flex-end" | "stretch" | "baseline"
     */
    align: {
      type: String,
      default: undefined,
    },
    /**
     * 是否自动换行，默认 true
     */
    wrap: {
      type: Boolean,
      default: true
    },
  },
  render() {

    function setVnodeStyle(node: VNode, style: Record<string, unknown>) {
      if (!node.props) node.props = {};
      if (!node.props.style) node.props.style = {};

      node.props.style = {
        ...node.props.style,
        ...style,
      }
    }

    const children = this.$slots.default ? this.$slots.default() : [];
    //处理子级元素，为其增加边距
    const gutter = this.gutter || 0;
    const count = children.length;
    if (count > 0 && gutter > 0) {
      if (count > 1) {
        children.forEach((k, index) => setVnodeStyle(children[0], {
          paddingLeft: index === 0 ? 0 : (index === count - 1 ? gutter : gutter / 2),
          paddingRight: index === count - 1 ? 0 : (index === 0 ? gutter : gutter / 2),
        }));
      } else {
        setVnodeStyle(children[0], { paddingLeft: gutter / 2, paddingRight: gutter / 2 });
      }
    }

    return h('div', {
      style: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: this.wrap !== false ? 'wrap' : 'nowrap',
        justifyContent: this.justify,
        alignItems: this.align,
      }
    }, children);
  },
});
</script>
