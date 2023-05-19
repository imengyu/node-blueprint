import { defineComponent, toRefs, type VNode } from 'vue';

export interface RowProps {
  /**
   * 列元素之间的间距（单位为 px）
   */
  gutter?: number;
  /**
   * 主轴对齐方式，可选值为
   */
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' | undefined;
  /**
   * 交叉轴对齐方式
   */
  align?: "center" | "flex-start" | "flex-end" | "stretch" | "baseline" | undefined;
  /**
   * 是否自动换行，默认 true
   */
  wrap?: boolean;
  /**
   * flex 属性
   */
  flex?: number|string,
}

/**
 * 24列栅格行组件。
 */
export default defineComponent({
  name: 'Row',
  props: {
    /**
     * 列元素之间的间距（单位为px）
     */
    gutter: {
      type: Number,
      default: 0
    },
    /**
     * flex属性
     */
    flex: {
      type: [Number, String],
      default: 1
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
  setup(props, ctx) {
    const { gutter, wrap, align, justify, flex } = toRefs(props);

    function setVnodeStyle(node: VNode, style: Record<string, unknown>) {
      if (!node.props) node.props = {};
      if (!node.props.style) node.props.style = {};

      node.props.style = {
        ...node.props.style,
        ...style,
      }
    }

    return () => {

      const children = ctx.slots.default ? ctx.slots.default() : [];
      //处理子级元素，为其增加边距
      const count = children.length;
      if (count > 0 && gutter.value > 0) {
        if (count > 1) {
          children.forEach((k, index) => setVnodeStyle(children[0], {
            paddingLeft: index === 0 ? 0 : (index === count - 1 ? gutter.value : gutter.value / 2),
            paddingRight: index === count - 1 ? 0 : (index === 0 ? gutter.value : gutter.value / 2),
          }));
        } else {
          setVnodeStyle(children[0], { paddingLeft: gutter.value / 2, paddingRight: gutter.value / 2 });
        }
      }

      return (
        <div
          class="nana-layout-row"
          style={{
            flex: flex.value,
            flexWrap: wrap.value !== false ? 'wrap' : 'nowrap',
            justifyContent: justify.value,
            alignItems: align.value,
          }}
        >
        { children }
      </div>);
    };
  },
});
