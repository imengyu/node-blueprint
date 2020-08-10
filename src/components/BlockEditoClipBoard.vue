<template>
  <div class="editorClipBoard"></div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { BlockEditor } from "../model/Editor/BlockEditor";

@Component
export default class BlockEditoClipBoard extends Vue {
  blockClipboard : Array<BlockEditor> = [];

  /**
   * 获取单元剪贴板状态
   */
  getBlocksClipboardState() { 
    return this.blockClipboard.length == 0; 
  }
  /**
   * 获取剪贴板中的块
   */
  getBlocksInClipboard() { 
    return this.blockClipboard; 
  }
  /**
   * 写入剪贴板
   */
  writeToClipboard(arr : BlockEditor[]) {
    this.blockClipboard.empty();
    arr.forEach((k) => this.blockClipboard.push(k));
    this.$emit('update-clipboard-state', this.blockClipboard.length != 0);
  }
  /**
   * 清空剪贴板
   */
  clearClipboard() {
    this.blockClipboard.empty();
    this.$emit('update-clipboard-state', false);
  }
}

</script>