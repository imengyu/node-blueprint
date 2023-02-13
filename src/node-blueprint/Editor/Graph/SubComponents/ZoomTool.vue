<template>
  <div class="node-graph-editorzoom-tool">
    <div class="button left" title="缩小" @click="zoomOut()">
      <Icon icon="icon-zoom-in" />
    </div>
    <select
      v-model="zoomSelectValue"
      @change="zoomUpdate(zoomSelectValue / 100)"
    >
      <option v-for="(v, i) in zoomValues" :key="i" :value="v">{{ v }}%</option>
    </select>
    <span>{{ Math.floor(viewPort.scale * 100) }}%</span>
    <div class="button right" title="放大" @click="zoomIn()">
      <Icon icon="icon-zoom-out" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import type { NodeGraphEditorViewport } from "../NodeGraphEditor";
import Icon from "../../Base/Icon.vue";

export default defineComponent({
  name: "ZoomTool",
  emits: ["zoom-update"],
  data() {
    return {
      zoomValues: [30, 50, 60, 80, 100, 110, 120, 130, 150, 170, 190, 200],
      zoomSelectValue: 4,
    };
  },
  props: {
    viewPort: {
      type: Object as PropType<NodeGraphEditorViewport>,
      default: null,
    },
  },
  methods: {
    /**
     * 放大视图
     */
    zoomOut() {
      const viewScale = this.viewPort.scale;
      if (viewScale > 0.4) this.zoomUpdate((viewScale * 10 - 1) / 10);
      else this.zoomUpdate(0.3);
    },
    /**
     * 缩小视图
     */
    zoomIn() {
      const viewScale = this.viewPort.scale;
      if (viewScale <= 1.9) this.zoomUpdate((viewScale * 10 + 1) / 10);
      else this.zoomUpdate(2);
    },
    /**
     * 更新视图缩放
     */
    zoomUpdate(scale: number) {
      this.viewPort.scaleAndCenter(scale);
      this.$emit("zoom-update", scale);
    },
  },
  components: { Icon },
});
</script>
