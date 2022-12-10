<template>
  <div :style="{
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: `${pec}%`,
    marginLeft: offset ? `${(offset / GRID_SIZE) * 100}%` : undefined,
    maxWidth: `${pec}%`,
  }">

  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { GRID_SIZE } from '.';

/**
 * 24列栅格列组件。
 *
 * 提供了 24列栅格，通过在 Col 上添加 span 属性设置列所占的宽度百分比。
 *
 * 此外，添加 offset 属性可以设置列的偏移宽度，计算方式与 span 相同。
 */
export default defineComponent({
  props: {
    /**
     * 列元素偏移距离
     */
    offset: {
      type: Number,
      default: 0
    },
    /**
     * 列元素宽度
     */
    span: {
      type: Number,
      default: 0
    },
  },
  computed: {
    pec() : number {
      return ((this.span || 0) / GRID_SIZE) * 100;
    },
  },
  data() {
    return {
      GRID_SIZE: GRID_SIZE,
    }
  },
});
</script>
