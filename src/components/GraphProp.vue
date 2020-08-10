<template>
  <div>
    <div class="prop-item">
      <span>图表名称: </span>
      <input type="text" v-model="graph.name" />
    </div>
    <div class="prop-item">
      <span>注释: </span>
      <textarea v-model="graph.comment" placeholder="这个图表的说明文字...">
      </textarea>
    </div>
    <div v-if="!isMain">
      <div class="prop-header">图表端口与参数</div>
      <div class="prop-item">
        <span>图表入端口: </span>
        
      </div>
      <div class="prop-item">
        <span>图表出端口: </span>

      </div>
      <div class="prop-item">
        <span>图表入参数: </span>
        
      </div>
      <div class="prop-item">
        <span>图表出参数: </span>

      </div>
    </div>
    <div>
      <div class="prop-header">图表变量</div>
      <div class="prop-list">
        <div v-for="(variable,i) in graph.variables" :key="i" class="prop-list-item">
          <div class="prop-item">
            <span>变量名称: </span>
            <input type="text" v-model="variable.name" />
          </div>
          <div class="prop-item">
            <span>变量类型: </span>
            <input type="text" v-model="variable.type" />
          </div>
          <div class="prop-item">
            <span>变量默认值: </span>
            <input type="text" v-model="variable.defaultValue" />
          </div>
          <a href="javascript:;" class="prop-delete" title="删除子变量" @click="onDeleteGraphVariable(childGraph)">
            <i class="iconfont icon-close-1"></i>
          </a>
        </div>
        <div class="prop-list-item flex-center cursor-pointer" @click="onAddGraphVariable">
          <i class="iconfont icon-pluss-2 mr-3"></i> 添加图表变量
        </div>
      </div>
    </div>
    <div>
      <div class="prop-header">子图表</div>
      <div class="prop-list">
        <div v-for="(childGraph,i) in graph.children" :key="i" class="prop-list-item">
          <div class="prop-item">
            <span>图表名称: </span>
            <input type="text" v-model="childGraph.name" placeholder="输入图表名称" />
          </div>
          <div class="prop-item">
            <span>图表注释: </span>
            <input type="text" v-model="childGraph.comment" placeholder="这个图表的说明文字..." />
          </div>
          <div class="prop-item mt-1">
            <span> </span>
            <a class="mr-2" @click="onOpenGraph(childGraph)">编辑图表</a>
          </div>
          <a href="javascript:;" class="prop-delete" title="删除子图表" @click="onDeleteChildGraph(childGraph)">
            <i class="iconfont icon-close-1"></i>
          </a>

        </div>
        <div class="prop-list-item flex-center cursor-pointer" @click="onAddChildGraph">
          <i class="iconfont icon-pluss-2 mr-3"></i> 添加子图表
        </div>

      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { BlockGraphDocunment } from "../model/Define/BlockDocunment";

@Component
export default class GraphProp extends Vue {
  name = "GraphProp";

  @Prop({ default: null }) graph : BlockGraphDocunment;
  @Prop({ default: false }) isMain : boolean;

  mounted() {
  }

  onAddGraphVariable() {
    let v = {
      name: '变量' + this.graph.variables.length,
      type: 'any',
      defaultValue: null,
    };
    this.graph.variables.push(v);
    this.$emit('on-add-graph-variable', v);
  }
  onDeleteGraphVariable(v) {
    this.graph.variables.splice(this.graph.variables.indexOf(v), 1);
    this.$emit('on-delete-graph-variable', v);
  }

  onAddChildGraph() {
    this.graph.children.push(new BlockGraphDocunment('新图表'+this.graph.children.length));
  }
  onDeleteChildGraph(g : BlockGraphDocunment) {
    this.graph.children.splice(this.graph.children.indexOf(g), 1);
    this.$emit('on-delete-graph', g);
  }
  onOpenGraph(g : BlockGraphDocunment) {
    this.$emit('on-open-graph', g);
  }
}
</script>