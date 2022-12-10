<template>
  <div class="dynamic-form-group mt-3">
    <h3>{{ title }}</h3>
    <Row :justify="justify" :gutter="gutter">
      <slot />
    </Row>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Row from "../BaseControls/Layout/Row.vue";

export default defineComponent({
  props: {
    /**
     * 标题
     */
    title: {
      type: String,
      default: "",
    },
    /**
     * 栅格间隔 px
     */
    gutter: {
      type: Number,
      default: null,
    },
    /**
     * flex 布局下的水平排列方式：start end center space-around space-between
     */
    justify: {
      type: String,
      default: "start",
    },
  },
  components: { Row }
});
</script>

<style lang="scss">
.dynamic-form-group {
  padding: 10px;
  background-color: #f7f7f7;

  h3 {
    padding: 12px 16px;
    color: #000000d9;
    line-height: 1.5715;
    margin: 0;
  }
}
</style>