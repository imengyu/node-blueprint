<template>
  <div>
    <div class="prop-header">单元属性</div>
    <div class="prop-item">
      <span>GUID: </span>
      <input class="prop-item-editor"  type="text" v-model="block.guid" disabled="disabled" />
    </div>
    <div class="prop-item">
      <span>UID: </span>
      <input class="prop-item-editor"  type="text" v-model="block.uid" disabled="disabled" />
    </div>
    <div class="prop-item">
      <span>断点状态: </span>
      <select class="prop-item-editor"  v-model="block.breakpoint" @change="onBreakpointChange">
        <option value="none">无断点</option>
        <option value="disable">禁用断点</option>
        <option value="enable">启用断点</option>
      </select>
    </div>
    <div class="prop-item">
      <span>注释: </span>
      <textarea class="prop-item-editor"  v-model="block.mark">
      </textarea>
    </div>

  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";
import { BlockEditor } from "../../model/Editor/BlockEditor";

@Component
export default class BlockProp extends Vue {
  name = "BlockProp";

  @Prop({ default: null }) block : BlockEditor;

  
  onBreakpointChange() {
    this.block.updateBreakPointStatus();
  }

  mounted() {
  }
}
</script>