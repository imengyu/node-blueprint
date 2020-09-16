<template>
  <div>
    
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import ParamTypeServiceInstance from "../sevices/ParamTypeService";
import AllEditors from "../model/TypeEditors/AllEditors";
import { BlockParameterEditorRegData, BlockParameterEnumRegData, BlockParameterTypeRegData } from "../model/Define/BlockDef";
import { BlockParameterType } from "../model/Define/Port";
import { BlockGraphDocunment, BlockGraphVariable } from "../model/Define/BlockDocunment";

@Component
export default class VariableSetTypeEditor extends Vue {

  @Prop({ default: null }) variable : BlockGraphVariable;
  @Prop({ default: null }) graph : BlockGraphDocunment;

  private nowVal = null;
  private nowValGeted = false;

  @Watch('variable')
  onTypeChanged() { this.nowValGeted = false; }

  getVal() {
    this.nowVal = this.variable.get(this.graph.lastRunContext);
    this.nowValGeted = true;
  }

}

</script>