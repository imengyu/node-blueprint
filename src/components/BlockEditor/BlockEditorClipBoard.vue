<template>
  <div class="editorClipBoard"></div>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { BlockEditor } from "../../model/Editor/BlockEditor";
import { Connector } from "../../model/Define/Connector";
import { Vector2 } from "../../model/Vector2";

@Component
export default class BlockEditorClipBoard extends Vue {
  blockClipboard : Array<BlockEditor> = [];
  connectorsClipboard : Array<Connector> = [];
  refPointClipboard = new Vector2();

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
  getConnectorsInClipboard() { 
    return this.connectorsClipboard; 
  }
  getClipboardRefPoint() { 
    return this.refPointClipboard; 
  }
  /**
   * 写入剪贴板
   */
  writeToClipboard(arr : BlockEditor[], connectors : Connector[], refPoint ?: Vector2) {
    this.blockClipboard.empty();
    this.connectorsClipboard.empty();
    this.refPointClipboard = refPoint;

    arr.forEach((k) => this.blockClipboard.push(k));
    connectors.forEach((k) => this.connectorsClipboard.push(k));

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