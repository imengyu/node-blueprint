<script lang="ts">
import { defineComponent, h, renderSlot, type PropType } from 'vue';

/**
 * 一个flex column布局的View，方便布局
 */
export default defineComponent({
  name: 'ColumnView',
  props: {
    /**
     * 子元素在主轴上的对齐方式
     */
    justify: {
      type: String as PropType<'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'>,
      default: ''
    },
    /**
     * 当前元素在主轴上的对齐方式
     */
    alignSelf: {
      type: String as PropType<'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' | 'auto'>,
      default: ''
    },
    /**
     * 子元素在交叉轴上的对齐方式
     */
    align: {
      type: String as PropType<'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'>,
      default: ''
    },
    /**
     * 弹性布局是否换行
     * @default false
     */
    wrap: {
      type: Boolean,
      default: false
    },
    /**
     * flex参数
     */
    flex: {
      type: Number,
      default: undefined
    },
    /**
     * flexGrow参数
     */
    flexGrow: {
      type: Number,
      default: undefined
    },
    /**
     * flexShrink参数
     */
    flexShrink: {
      type: Number,
      default: undefined
    },
  },
  render() {
    return [
      h('div', {
        class: 'nana-flex-col',
        style: {
          flexWrap: this.wrap,
          flex: this.flex,
          flexGrow: this.flexGrow,
          flexShrink: this.flexShrink,
          alignItems: this.align,
          alignSelf: this.alignSelf,
          justifyContent: this.justify,
        },
      }, [ renderSlot(this.$slots, 'default') ])
    ];
  }
});
</script>