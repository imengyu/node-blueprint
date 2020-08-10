<template>
  <div>
    <div class="prop-header">文档属性</div>
    <div class="prop-item">
      <span>文档名称: </span>
      <input type="text" v-model="doc.mainGraph.name" placeholder="文档的名称" />
    </div>
    <div class="prop-item">
      <span>文档注释: </span>
      <textarea v-model="doc.mainGraph.comment" placeholder="文档的注释...">
      </textarea>
    </div>
    <div class="prop-header">主图表</div>

    <GraphProp 
      :graph="doc.mainGraph" 
      @on-open-graph="(g)=>$emit('on-open-graph',g)"
    ></GraphProp>
    
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { BlockDocunment } from "../model/Define/BlockDocunment";
import GraphProp from "./GraphProp.vue";

@Component({
  components: {
    'GraphProp': GraphProp
  }
})
export default class DocunmentProp extends Vue {

  @Prop({ default: null }) doc : BlockDocunment;

}
</script>