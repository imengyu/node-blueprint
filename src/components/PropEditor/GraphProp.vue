<template>
  <div>
    <div class="position-relative">
      <div v-if="!graph.isMainGraph" class="prop-list-dragger" @dragstart="onGraphChildGraphDrag(graph, $event)" draggable="true"
        v-tooltip data-title="可拖拽此箭头来添加此图表的调用至图表中">
        <i class="iconfont icon-arrow-left-"></i>
      </div>
      <div class="prop-item">
        <span>图表名称</span>
        <input class="prop-item-editor" type="text" v-model="graph.name" @blur="onUpdateGraph(graph)" />
      </div>
      <div class="prop-item">
        <span>注释</span>
        <textarea class="prop-item-editor" v-model="graph.comment" placeholder="这个图表的说明文字..." @blur="onUpdateGraph(graph)">
        </textarea>
      </div>
    </div>
    <!--图表输入与输出-->
    <div v-if="!graph.isMainGraph">
      <CollapsePropHeader title="图表输入">
        <div class="prop-list">
          <div v-for="(port,i) in graph.inputPorts" :key="i" class="prop-list-item">
            <input v-if="port" type="text" v-model="port.name" style="width: calc(100% - 200px);" @blur="onUpdateGraphPort(port)" />
            <div v-if="port" class="prop-box">

              <span v-if="port.paramSetType=='dictionary'" v-tooltip data-title="映射键类型">
                {{ getTypeNameRemap(port.paramDictionaryKeyType.getType()) }}
                <a class="ml-2 iconfont icon-arrow-down-1" @click="onChooseGraphPortKeyType(port, $event)" v-tooltip data-title="选择映射键类型"></a>
              </span> 

              <VariableSetTypeEditor class="prop-item-editor" 
                v-if="port && port.paramType"
                v-model="port.paramSetType" 
                :type="port.paramType"
                :color="getTypeColor(port.paramType)"
                :color2="getTypeColor(port.paramDictionaryKeyType)"
                @change-set-type="onUpdateGraphPort(port)"></VariableSetTypeEditor>

              <span>
                {{ getTypeNameRemap(port.paramType.getType()) }}
                <a class="ml-2 iconfont icon-arrow-down-1" @click="onChooseGraphPortType(port, $event)" v-tooltip data-title="选择输入类型"></a>
              </span>

            </div>
            <a href="javascript:;" v-tooltip data-title="上移" @click="onMoveUpGraphPort(port, 'input')">
              <i class="iconfont icon-arrow-up-"></i>
            </a>
            <a href="javascript:;" v-tooltip data-title="下移" @click="onMoveDownGraphPort(port, 'input')">
              <i class="iconfont icon-arrow-down-"></i>
            </a>
            <el-popconfirm title="确定删除输入吗？" @confirm="onDeleteGraphPort(port, 'input')">
              <a slot="reference" href="javascript:;" v-tooltip data-title="删除输入">
                <i class="iconfont icon-close-1"></i>
              </a>
            </el-popconfirm>
            <div v-if="port && !port.paramType.isExecute()" class="prop-item">
              <span>输入默认值: </span>
              <VariableTypeEditor class="prop-item-editor" v-model="port.paramDefaultValue" :variableType="port.paramType" :variableSetType="port.paramSetType"></VariableTypeEditor>
            </div>
          </div> 
          <div class="prop-list-item flex-center cursor-pointer" @click="onAddGraphPort('input')">
            <i class="iconfont icon-pluss-2 mr-3"></i> 添加输入
          </div>
        </div>
      </CollapsePropHeader>
      <CollapsePropHeader title="图表输出">
        <div class="prop-list">
          <div v-for="(port,i) in graph.outputPorts" :key="i" class="prop-list-item">
            <input v-if="port" type="text" v-model="port.name" style="width: calc(100% - 190px);" @blur="onUpdateGraphPort(port)"  />
            <div v-if="port" class="prop-box">

              <span v-if="port.paramSetType=='dictionary'" v-tooltip data-title="映射键类型">
                {{ getTypeNameRemap(port.paramDictionaryKeyType.getType()) }}
                <a class="ml-2 iconfont icon-arrow-down-1" @click="onChooseGraphPortKeyType(port, $event)" v-tooltip data-title="选择映射键类型"></a>
              </span> 

              <VariableSetTypeEditor class="prop-item-editor" 
                v-if="port.paramType"
                v-model="port.paramSetType" 
                :type="port.paramType"
                :color="getTypeColor(port.paramType)"
                :color2="getTypeColor(port.paramDictionaryKeyType)"
                @change-set-type="onUpdateGraphPort(port)"></VariableSetTypeEditor>

              <span>
                {{ getTypeNameRemap(port.paramType.getType()) }}
                <a class="ml-2 iconfont icon-arrow-down-1" @click="onChooseGraphPortType(port, $event)" v-tooltip data-title="选择输出类型"></a>
              </span>

            </div>
            <a href="javascript:;" v-tooltip data-title="上移" @click="onMoveUpGraphPort(port, 'output')">
              <i class="iconfont icon-arrow-up-"></i>
            </a>
            <a href="javascript:;" v-tooltip data-title="下移" @click="onMoveDownGraphPort(port, 'output')">
              <i class="iconfont icon-arrow-down-"></i>
            </a>
            <el-popconfirm title="确定删除输出吗？" @confirm="onDeleteGraphPort(port, 'output')">
              <a slot="reference" href="javascript:;" v-tooltip data-title="删除输出">
                <i class="iconfont icon-close-1"></i>
              </a>
            </el-popconfirm>
            <div v-if="port && !port.paramType.isExecute()" class="prop-item">
              <span>输出默认值: </span>
              <VariableTypeEditor class="prop-item-editor" v-model="port.paramDefaultValue" :variableType="port.paramType" :variableSetType="port.paramSetType"></VariableTypeEditor>
            </div>
          </div> 
          <div class="prop-list-item flex-center cursor-pointer" @click="onAddGraphPort('output')">
            <i class="iconfont icon-pluss-2 mr-3"></i> 添加输出
          </div>
        </div>
      </CollapsePropHeader>
    </div>
    <!--图表变量-->
    <CollapsePropHeader title="图表变量">
      <div class="prop-list">
        <div v-for="(variable,i) in graph.variables" :key="i" class="prop-list-item">
          <div class="prop-list-dragger" @dragstart="onGraphVariableDrag(variable, $event)" draggable="true"
            v-tooltip data-title="可直接拖拽此箭头以添加变量至图表中">
            <i class="iconfont icon-arrow-left-"></i>
          </div>
          <div class="prop-item">
            <span>变量名称</span>
            <InputCanCheck 
              type="text" class="prop-item-editor" 
              :value="variable.name" placeholder="请输入变量名称" 
              :checkCallback="(o, n) => (o!=n && checkGraphVariableExists(n)) ? '已存在相同名称的变量':true"
              @update="(o,n) => {variable.name=n;onUpdateGraphVariable(o,variable)}"></InputCanCheck>
          </div>
          <div class="prop-item">
            <span>变量类型</span>
            <div class="prop-item-editor">

              <span v-if="variable.setType=='dictionary'" v-tooltip data-title="映射键类型">
                {{ getTypeNameRemap(variable.dictionaryKeyType.getType()) }}
                <a class="ml-2 iconfont icon-arrow-down-1" @click="onChooseGraphVariableKeyType(variable, $event)" v-tooltip data-title="选择映射键类型"></a>
              </span> 

              <VariableSetTypeEditor class="prop-item-editor" 
                v-model="variable.setType" 
                :type="variable.type"
                :color="getTypeColor(variable.type)"
                :color2="getTypeColor(variable.dictionaryKeyType)"
                @change-set-type="onUpdateGraphVariable(null,variable)"></VariableSetTypeEditor>

              <span>
                {{ getTypeNameRemap(variable.type) }}
                <a class="ml-2 iconfont icon-arrow-down-1" @click="onChooseGraphVariableType(variable, $event)" v-tooltip data-title="选择变量类型"></a>
              </span>

            </div>
          </div>
          <div class="prop-item">
            <span>变量默认值</span>
            <VariableTypeEditor class="prop-item-editor" v-model="variable.defaultValue" :variableType="variable.type"></VariableTypeEditor>
          </div>
          <div class="prop-item">
            <span>静态</span>
            <div class="prop-item-editor">
              <input type="checkbox" v-model="variable.static" v-tooltip data-title="指示此变量是否是全局静态分配的，反之为图表局部变量" />
            </div>
          </div>
          <div class="prop-item">
            <span>当前值</span>
            <VariableViewer class="prop-item-editor" :variable="variable" :graph="graph"></VariableViewer>
          </div>
          <el-popconfirm title="确定删除子变量吗？" @confirm="onDeleteGraphVariable(variable)">
            <a slot="reference" href="javascript:;" class="prop-delete" v-tooltip data-title="删除子变量">
              <i class="iconfont icon-close-1"></i>
            </a>
          </el-popconfirm>
        </div>
        <div class="prop-list-item flex-center cursor-pointer" @click="onAddGraphVariable">
          <i class="iconfont icon-pluss-2 mr-3"></i> 添加图表变量
        </div>
      </div>
    </CollapsePropHeader>
    <!--子图表-->
    <CollapsePropHeader title="子图表">
      <div class="prop-list">
        <div v-for="(childGraph,i) in graph.children" :key="i" class="prop-list-item">
          <div class="prop-list-dragger" @dragstart="onGraphChildGraphDrag(childGraph, $event)" draggable="true" v-tooltip data-title="可拖拽此箭头来添加此图表的调用至图表中">
            <i class="iconfont icon-arrow-left-"></i>
          </div>
          <div class="prop-item">
            <span>图表名称</span>
            <InputCanCheck type="text" 
              v-model="childGraph.name" placeholder="输入图表名称" 
              :checkCallback="(o, n) => (o != n && checkChildGraphExists(n)) ? '已存在相同名称的子图表':true"
              @blur="onUpdateGraph(childGraph)"></InputCanCheck>
          </div>
          <div class="prop-item">
            <span>图表注释</span>
            <input type="text" v-model="childGraph.comment" placeholder="这个图表的说明文字..." @blur="onUpdateGraph(childGraph)" />
          </div>
          <div class="prop-item mt-1">
            <span> </span>
            <a class="mr-5" @click="onOpenGraph(childGraph)">编辑图表</a>
          </div>
          <el-popconfirm title="确定删除子图表吗？" @confirm="onDeleteChildGraph(childGraph)">
            <a slot="reference" href="javascript:;" class="prop-delete" v-tooltip data-title="删除子图表">
              <i class="iconfont icon-close-1"></i>
            </a>
          </el-popconfirm>
        </div>
        <div class="prop-list-item flex-center cursor-pointer" @click="onAddChildGraph">
          <i class="iconfont icon-pluss-2 mr-3"></i> 添加子图表
        </div>
      </div>
    </CollapsePropHeader>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { BlockGraphDocunment, BlockGraphVariable } from "../../model/Define/BlockDocunment";
import { Vector2 } from "../../model/Vector2";
import ParamTypeServiceInstance from "../../sevices/ParamTypeService";
import { BlockParameterTypeRegData, BlockPortRegData } from "../../model/Define/BlockDef";
import {  BlockPortDirection } from "../../model/Define/Port";
import CommonUtils from "../../utils/CommonUtils";
import InputCanCheck from "../EditorComponents/InputCanCheck.vue";
import CollapsePropHeader from "../EditorComponents/CollapsePropHeader.vue";
import VariableSetTypeEditor from "../EditorComponents/VariableSetTypeEditor.vue";
import VariableTypeEditor from "../EditorComponents/VariableTypeEditor.vue";
import { BlockEditorOwner } from "../../model/Editor/BlockEditorOwner";
import VariableViewer from "../EditorComponents/VariableViewer.vue";
import HtmlUtils from "../../utils/HtmlUtils";
import DebugWorkProviderInstance from "../../model/WorkProvider/DebugWorkProvider";
import { BlockParameterBaseType, BlockParameterType, createParameterTypeFromString } from "../../model/Define/BlockParameterType";

@Component({
  components: {
    'VariableTypeEditor': VariableTypeEditor,
    'VariableViewer': VariableViewer,
    'InputCanCheck': InputCanCheck,
    'CollapsePropHeader': CollapsePropHeader,
    'VariableSetTypeEditor': VariableSetTypeEditor,
  }
})
export default class GraphProp extends Vue {
  name = "GraphProp";

  @Prop({ default: null }) graph : BlockGraphDocunment;
  @Prop({ default: false }) blockOwnerData : BlockEditorOwner;

  mounted() {
  }

  getTypeNameRemap(type : string | BlockParameterType) {
    return ParamTypeServiceInstance.getTypeNameForUserMapping(type);
  }
  //get color
  getTypeColor(name : string | BlockParameterType) {
    return ParamTypeServiceInstance.getTypeColor(name);
  }


  //变量
  //===========================

  onAddGraphVariable() {
    let v = new BlockGraphVariable();

    v.name = '变量' + this.graph.variables.length;
    v.defaultValue = null;
    v.value = null;

    this.graph.variables.push(v);
    this.blockOwnerData.graphVariableChange.onVariableAdd(this.graph, v);
  }
  onDeleteGraphVariable(v : BlockGraphVariable) {
    this.graph.variables.splice(this.graph.variables.indexOf(v), 1);
    this.blockOwnerData.graphVariableChange.onVariableRemove(this.graph, v);
  }
  onChooseGraphVariableType(v : BlockGraphVariable, e : MouseEvent) {
    this.$emit('choose-graph-variable-type', (type : BlockParameterTypeRegData) => {
      v.type = createParameterTypeFromString(type.name);
      this.onUpdateGraphVariable(v.name, v);
    }, 
    new Vector2(
      e.x - (<HTMLElement>(<HTMLElement>e.target).parentNode).offsetWidth, 
      e.y + 10), false);
  }
  onChooseGraphVariableKeyType(v : BlockGraphVariable, e : MouseEvent) {
    this.$emit('choose-graph-variable-type', (type : BlockParameterTypeRegData) => {
      if(!ParamTypeServiceInstance.checkTypeCanBeDictionaryKey(type.name)) {
        DebugWorkProviderInstance.ModalProvider('warn', '提示', '类型 ' + type.name + ' 不可作为键值，键值类型必须含有 getHashCode 函数', () => {});
        return;
      }
      v.dictionaryKeyType = type.name;
      this.onUpdateGraphVariable(v.name, v);
    }, 
    new Vector2(
      e.x - (<HTMLElement>(<HTMLElement>e.target).parentNode).offsetWidth, 
      e.y + 10), 
    false);
  }
  onUpdateGraphVariable(vNameOld : string, v : BlockGraphVariable) {
    this.blockOwnerData.graphVariableChange.onVariableUpdate(this.graph, vNameOld, v);
  }
  onGraphVariableDrag(v : BlockGraphVariable, e : DragEvent) {
    if(HtmlUtils.isEventInControl(e)) { 
      e.preventDefault(); 
      e.stopPropagation(); 
    }
    else e.dataTransfer.setData('text/plain', 'drag:graph-variable:' + this.graph.name + ':' + v.name);
  }

  checkGraphVariableExists(name : string) {
    for(let i = this.graph.variables.length - 1; i >= 0; i--)
      if(this.graph.variables[i].name == name)
        return true;
    return false;
  }

  //端口
  //===========================

  lastSetParamType : BlockParameterType = new BlockParameterType('any');
  lastSetParamKeyType : BlockParameterType = new BlockParameterType('any');

  onAddGraphPort(direction : BlockPortDirection) {
    let port : BlockPortRegData = {
      guid: (direction == 'input' ? 'PI' : 'PO') + CommonUtils.genNonDuplicateIDHEX(6),
      name: '新端口' + (direction == 'input' ? this.graph.inputPorts.length : this.graph.outputPorts.length),
      direction: direction,
      paramType: this.lastSetParamType,
      paramDictionaryKeyType: this.lastSetParamKeyType,
      paramSetType: 'variable',
      forceNoEditorControl: true,
    };
    if(direction == 'input') this.graph.inputPorts.push(port);
    else if(direction == 'output') this.graph.outputPorts.push(port);

    this.blockOwnerData.graphPortChange.onPortAdd(this.graph, port);
  }
  onDeleteGraphPort(port : BlockPortRegData, direction : BlockPortDirection) {
    if(direction == 'input')
      this.graph.inputPorts.splice(this.graph.inputPorts.indexOf(port), 1);
    else if(direction == 'output')
      this.graph.outputPorts.splice(this.graph.outputPorts.indexOf(port), 1);
    this.blockOwnerData.graphPortChange.onPortRemove(this.graph, port);
  }
  onMoveUpGraphPort(port : BlockPortRegData, direction : BlockPortDirection) {
    let index = 0;
    if(direction == 'input') {
      index = this.graph.inputPorts.indexOf(port) ;
      if(index > 0)
        CommonUtils.swapItems(this.graph.inputPorts, index, index - 1);
    } else if(direction == 'output') {
      index = this.graph.outputPorts.indexOf(port) ;
      if(index > 0)
        CommonUtils.swapItems(this.graph.outputPorts, index, index - 1);
    }
    this.blockOwnerData.graphPortChange.onPortMoveUp(this.graph, port, index);
  }
  onMoveDownGraphPort(port : BlockPortRegData, direction : BlockPortDirection) {
    let index = -1;
    if(direction == 'input') {
      index = this.graph.inputPorts.indexOf(port) ;
      if(index >= 0 && index < this.graph.inputPorts.length - 1)
        CommonUtils.swapItems(this.graph.inputPorts, index, index + 1);
    } else if(direction == 'output') {
      index = this.graph.outputPorts.indexOf(port) ;
      if(index >= 0 && index < this.graph.outputPorts.length - 1)
        CommonUtils.swapItems(this.graph.outputPorts, index, index + 1);
    }
    this.blockOwnerData.graphPortChange.onPortMoveDown(this.graph, port, index);
  }
  onUpdateGraphPort(port : BlockPortRegData) {
    this.blockOwnerData.graphPortChange.onPortUpdate(this.graph, port);
  }
  onChooseGraphPortType(port : BlockPortRegData, e : MouseEvent) {
    this.$emit('choose-graph-variable-type', (type : BlockParameterTypeRegData, isBaseType : boolean) => {
      if(isBaseType) {
        port.paramType = new BlockParameterType(<BlockParameterBaseType>type.name);
      } else {
        port.paramType = new BlockParameterType(type.prototypeName == 'enum' ? 'enum' : 'custom', type.name);
      }
      this.lastSetParamType = port.paramType;
      this.onUpdateGraphPort(port);
    }, 
    new Vector2(
      e.x - (<HTMLElement>(<HTMLElement>e.target).parentNode).offsetWidth, 
      e.y + 10), true);
  }
  onChooseGraphPortKeyType(port : BlockPortRegData, e : MouseEvent) {
    this.$emit('choose-graph-variable-type', (type : BlockParameterTypeRegData, isBaseType : boolean) => {
      if(!ParamTypeServiceInstance.checkTypeCanBeDictionaryKey(type.name)) {
        DebugWorkProviderInstance.ModalProvider('warn', '提示', '类型 ' + type.name + ' 不可作为键值，键值类型必须含有 getHashCode 函数', () => {});
        return;
      }
      if(isBaseType) {
        port.paramDictionaryKeyType = new BlockParameterType(<BlockParameterBaseType>type.name);
      } else {
        port.paramDictionaryKeyType = new BlockParameterType(type.prototypeName == 'enum' ? 'enum' : 'custom', type.name);
      }
      this.lastSetParamKeyType = port.paramDictionaryKeyType;
      this.onUpdateGraphPort(port);
    }, 
    new Vector2(
      e.x - (<HTMLElement>(<HTMLElement>e.target).parentNode).offsetWidth, 
      e.y + 10), false);
  }

  
  //子图表
  //===========================

  checkChildGraphExists(name : string) {
    if(name == this.graph.name)
      return;
    for(let i = this.graph.children.length - 1; i >= 0; i--)
      if(this.graph.children[i].name == name)
        return true;
    return false;
  }

  onGraphChildGraphDrag(v : BlockGraphDocunment, e : DragEvent) {
    if(HtmlUtils.isEventInControl(e) || v.isMainGraph) e.preventDefault();
    else e.dataTransfer.setData('text/plain', 'drag:graph:' + v.name);
  }
  onAddChildGraph() {
    let doc = new BlockGraphDocunment('新图表'+this.graph.children.length);
    doc.isEditor = true;
    doc.docunment = this.graph.docunment;
    doc.parent = this.graph;
    doc.inputPorts.push({
      name: '进入',
      guid: 'PI0',
      direction: 'input',
      paramType: createParameterTypeFromString('execute'),
      paramSetType: 'variable',
    });
    doc.outputPorts.push({
      name: '退出',
      guid: 'PO0',
      direction: 'output',
      paramType: createParameterTypeFromString('execute'),
      paramSetType: 'variable',
    });
    this.graph.children.push(doc);
  }
  onDeleteChildGraph(g : BlockGraphDocunment) {
    this.graph.children.splice(this.graph.children.indexOf(g), 1);
    this.$emit('on-delete-graph', g);
  }
  onUpdateGraph(g : BlockGraphDocunment) {
    this.blockOwnerData.graphChange.onGraphUpdate(g);
  }
  onOpenGraph(g : BlockGraphDocunment) {
    this.$emit('on-open-graph', g);
  }
}
</script>