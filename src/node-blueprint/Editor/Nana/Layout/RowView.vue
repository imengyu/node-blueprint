<template>
  <div 
    class="nana-flex-row"
    :style="({
      flexWrap: wrap,
      flex: flex,
      flexGrow: flexGrow,
      flexShrink: flexShrink,
      alignItems: align,
      alignSelf: alignSelf,
      justifyContent: justify,
    } as any)"
  >
    <slot />
  </div>
</template>


<script lang="ts">
import { defineComponent, h, renderSlot, type PropType } from 'vue';

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
});
</script>