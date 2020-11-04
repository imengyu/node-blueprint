<template>
  <div class="editor-graph-breadcrumb" @click="$emit('on-go-doc', currentDocunment)">
    <div v-for="(graph, i) in graphBreadcrumb" :key="i" :class="(i==graphBreadcrumb.length-1?'last':'')+(graph.isCurrent?' current':'')">
      <span v-if="graph.isCurrent">{{graph.text}}</span>
      <a v-else href="javascript:;" @click="$emit('on-go-graph', graph.graph)">{{graph.text}}</a>
    </div>
    <div v-if="!graphBreadcrumb || graphBreadcrumb.length == 0">
      {{currentDocunment.name}}
    </div>
    <div class="button-controls">
      <a href="javascript:;"
        @click="$emit('on-close', currentDocunment)" title="关闭文件">
        <i :class="'iconfont ' + (currentDocunment.fileChanged ? 'icon-edit-1' : 'icon-close-')" ></i>
      </a>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { BlockDocunment, BlockGraphDocunment } from "../model/Define/BlockDocunment";

@Component({
  name: 'GraphBreadcrumb'
})
export default class GraphBreadcrumb extends Vue {

  @Prop({default: null}) currentDocunment : BlockDocunment;
  @Prop({default: null}) currentGraph : BlockGraphDocunment;

  graphBreadcrumb : Array<{
    text: string,
    graph: BlockGraphDocunment,
    isCurrent: boolean,
  }> = [];

  @Watch('currentGraph')
  loadGraphBreadcrumb(v : BlockGraphDocunment) {
    if(v == null || this.currentDocunment == null) this.graphBreadcrumb.empty();
    else {
      this.graphBreadcrumb.empty();
      this.graphBreadcrumb.push({
        text: v.name,
        graph: v,
        isCurrent: true
      });
      let loop = (graph : BlockGraphDocunment) => {
        this.graphBreadcrumb.unshift({
          text: graph.name,
          graph: graph,
          isCurrent: false
        });
        if(graph.parent != null) loop(graph.parent);
      };
      if(v.parent != null) loop(v.parent);
    }
  } 

  mounted() {
    setTimeout(() => {
      this.loadGraphBreadcrumb(this.currentGraph);
    }, 500);
  }
}

</script>