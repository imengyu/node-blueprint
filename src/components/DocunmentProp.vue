<template>
  <div>
    <CollapsePropHeader title="文档属性">
      <div class="prop-item">
        <span>文档名称: </span>
        <input class="prop-item-editor" type="text" v-model="doc.mainGraph.name" placeholder="文档的名称" />
      </div>
      <div class="prop-item">
        <span>文档注释: </span>
        <textarea class="prop-item-editor"  v-model="doc.mainGraph.comment" placeholder="文档的注释...">
        </textarea>
      </div>
    </CollapsePropHeader>
    <CollapsePropHeader title="主图表">

      <GraphProp 
        :graph="doc.mainGraph" 
        @on-open-graph="(g)=>$emit('on-open-graph',g)"
        @choose-graph-variable-type="(v,p)=>$emit('choose-graph-variable-type',v,p)"
      ></GraphProp>
    </CollapsePropHeader>
    
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { BlockDocunment } from "../model/Define/BlockDocunment";
import GraphProp from "./GraphProp.vue";
import CollapsePropHeader from "./CollapsePropHeader.vue";

@Component({
  components: {
    'GraphProp': GraphProp,
    'CollapsePropHeader': CollapsePropHeader
  }
})
export default class DocunmentProp extends Vue {

  @Prop({ default: null }) doc : BlockDocunment;

}
</script>