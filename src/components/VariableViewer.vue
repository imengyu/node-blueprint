<template>
  <div>
    <span v-if="nowValGeted">{{ nowVal ? nowVal : '未定义' }}</span>
    <a :class="nowValGeted ? 'ml-3' : ''" href="javascript:;" @click="getVal">
      {{ nowValGeted ? '刷新' : '获取' }}
    </a>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { BlockGraphDocunment, BlockGraphVariable } from "../model/Define/BlockDocunment";

@Component
export default class VariableViewer extends Vue {

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