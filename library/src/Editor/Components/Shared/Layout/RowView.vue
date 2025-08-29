<template>
  <div 
    class="nana-flex-row"
    :style="({
      position: relative ? 'relative' : undefined,
      display: inline ? 'flex-inline' : 'flex',
      flexWrap: wrap,
      flex: fill ? 1 : undefined,
      flexGrow: flexGrow,
      flexShrink: flexShrink,
      alignItems: align,
      alignSelf: alignSelf,
      justifyContent: justify,
      width: typeof width === 'number' ? `${width}px` : width,
      height: typeof height === 'number' ? `${height}px` : height,
    } as any)"
  >
    <slot />
  </div>
</template>


<script lang="ts">
import { defineComponent, type PropType } from 'vue';

/**
 * 一个flex row布局的View，方便布局
 */
export default defineComponent({
  name: 'RowView',
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
     * 弹性布局是否填充
     * @default false
     */
    fill: {
      type: Boolean,
      default: false
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
    /**
     * 是否内联，默认 false
     */
    inline: {
      type: Boolean,
      default: false
    },
    relative: {
      type: Boolean,
      default: false
    },
    width: {
      type: [Number, String],
      default: undefined
    },
    height: {
      type: [Number, String],
      default: undefined
    },
  },
});
</script>