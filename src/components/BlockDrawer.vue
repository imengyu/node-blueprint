<template>
  <div ref="editorHost" class="editor" :style="{ 
    cursor: (isDragView ? 'grabbing' : (mouseLeftMove ? 'grab' : 'default'))
  }">
    <!--单元连接弹出提示-->
    <div class="common-tip"
      v-show="isConnecting && !isConnectingToNew"
      :style="{ left: (connectingEndPos.x - viewPort.x) + 'px', top:  (connectingEndPos.y - viewPort.y) + 'px' }">
      <span v-if="currentHoverPort==null"><i class="iconfont icon-calendar-1"></i>连接至新的单元</span>
      <span v-else-if="connectingCanConnect"><i class="iconfont icon-check- text-success"></i></span>
      <span v-else><i class="iconfont icon-close- text-error"></i>{{connectingFailedText}}</span>
    </div>
    <!--背景画布-->
    <BlockEditorCanvasDrawer ref="editorCanvas" 
      :connectors="connectors"
      :viewPort="viewPort"
      :viewZoom="viewZoom"
      :viewScale="viewScale"
      :viewRealSize="viewRealSize"
      :isConnecting="isConnecting"
      :isMultiSelecting="isMultiSelecting"
      :connectingEndPos="connectingEndPos"
      :connectingStartPort="connectingStartPort"
      :connectingIsFail="connectingIsFail"
      :connectingConnector="connectingConnector"
      :multiSelectRect="multiSelectRect"
      :gridShow="settings.gridShow"
      :drawDebugInfo="settings.drawDebugInfo"
      >
    </BlockEditorCanvasDrawer>
    <!--主控制区域-->
    <BlockEditorWorker ref="editorWorker"
      :viewPort="viewPort"
      :viewZoom="viewZoom"
      :viewScale.sync="viewScale"
      @update-isDragView="(v) => isDragView = v"
      @update-isConnecting="(v) => isConnecting = v"
      @update-isConnectingToNew="(v) => isConnectingToNew = v"
      @update-isMultiSelecting="(v) => isMultiSelecting = v"
      @update-currentHoverPort="(v) => currentHoverPort = v"
      @update-connectingCanConnect="(v) => connectingCanConnect = v"
      @update-connectingEndPos="(v) => connectingEndPos = v"
      @update-connectingStartPort="(v) => connectingStartPort = v"
      @update-connectingIsFail="(v) => connectingIsFail = v"
      @update-connectingFailedText="(v) => connectingFailedText = v"
      @update-multiSelectRect="(v) => multiSelectRect = v"
      :mouseLeftMove="mouseLeftMove"
      :connectingConnector="connectingConnector"
      :currentDocunment="currentDocunment"
      :runner="runner"
      :editorHost="editorHost"
      :blockOwnerData="blockOwnerData"
      :blocks="blocks"
      :connectors="connectors"
      @update-viewport="recalcViewPort"
      @update-select-state="$emit('update-select-state', hasSelected())"
      @update-add-block-panel-filter="(d) => $emit('update-add-block-panel-filter', d)"
      @update-set-file-changed="$emit('set-file-changed')"
      @show-add-block-panel-view-port-pos="(p) => $emit('show-add-block-panel-at-pos', viewPortPosToWindowPos(p))"
      @show-add-block-panel-at-pos="(p) => $emit('show-add-block-panel-at-pos', p)"
      @clear-add-block-panel-filter="$emit('clear-add-block-panel-filter')"
      @set-add-block-inpos="setAddBlockInpos"
      @on-delete-block="onDeleteBlock"
      :toolBarHeight="toolBarHeight"
      :toolBarWidth="toolBarWidth"
      >
    </BlockEditorWorker>
    <!--剪贴板-->
    <BlockEditoClipBoard 
      ref="editoClipboard"
      @update-clipboard-state="(v) => $emit('update-clipboard-state', v)"
      >
    </BlockEditoClipBoard>
    <div class="zoom_tool">
      <a href="javascript:;" class="left iconfont icon-zoom-out" title="缩小" @click="zoomOut()"></a>
      <select v-model="viewZoom" @change="zoomUpdate()">
        <option v-for="(v, i) in zoomValues" :key="i" :value="v/100">{{v}}%</option>
      </select>
      <span>{{viewScale}}%</span>
      <a href="javascript:;" class="right iconfont icon-zoom" title="放大" @click="zoomIn()"></a>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

import { Vector2 } from "../model/Vector2";
import { Rect } from "../model/Rect";

import BlockEditorCanvasDrawer from "./BlockEditorCanvasDrawer.vue";
import BlockEditorWorker from "./BlockEditorWorker.vue";
import { BlockPort, BlockParameterPort } from "../model/Define/Port";
import { BlockRunner } from "../model/WorkProvider/Runner";
import { BlockRegData } from "../model/Define/BlockDef";
import { BlockEditorOwner } from "../model/Editor/BlockEditorOwner";
import { BlockGraphDocunment, BlockDocunment } from "../model/Define/BlockDocunment";
import { BlockEditor } from "../model/Editor/BlockEditor";
import { ConnectorEditor } from "../model/Editor/ConnectorEditor";
import BlockEditoClipBoard from "./BlockEditoClipBoard.vue";
import { EditorSettings } from "../model/Editor/EditorSettings";
import BaseBlocks from "../model/Blocks/BaseBlocks";
import CommonUtils from "../utils/CommonUtils";

@Component({
  components: {
    'BlockEditorCanvasDrawer': BlockEditorCanvasDrawer,
    'BlockEditoClipBoard': BlockEditoClipBoard,
    'BlockEditorWorker': BlockEditorWorker,
  }
})
export default class BlockDrawer extends Vue {

  currentGraph : BlockGraphDocunment = null;
  currentDocunment : BlockDocunment = null;

  loadedBlocks : Array<BlockEditor> = [];

  /**
   * 加载绘制文档
   */
  public drawGraph(doc : BlockGraphDocunment) {
    if(this.currentGraph != doc) {
      this.unloadGraph();
      this.currentGraph = doc;
      this.loadGraph();
    }
  }
  public loadDocunment(doc : BlockDocunment) {
    if(this.currentDocunment != null)
      this.unloadDocunment();
    this.currentDocunment = doc;
  }
  public unloadDocunment() {
    if(this.currentDocunment != null) {
      this.loadedBlocks.forEach((block) => block.destroy());
      this.loadedBlocks.empty();
      this.currentDocunment = null;
    }
  }


  private unloadGraph() {
    if(this.currentGraph != null) {
      this.blocks.forEach(element => element.hide());
      this.currentGraph = null;
    }
  }
  private loadGraph() {
    
    if(this.currentGraph.isEditor) {
      this.blocks = <BlockEditor[]>this.currentGraph.blocks;
      this.connectors = <ConnectorEditor[]>this.currentGraph.connectors;

      if(this.currentGraph.viewPort != null)
        this.viewPort.setPos(this.currentGraph.viewPort.x, this.currentGraph.viewPort.y);
      else
        this.viewPort.setPos(2048, 2048);

      if(this.currentGraph.scale != null && this.currentGraph.scale != 100) this.zoomUpdate(this.currentGraph.scale);
      else this.zoomUpdate(100);

      this.recalcViewPort();

      this.blocks.forEach(element => {
        if(!element.created) {
          element.create(this.blockOwnerData);
          this.loadedBlocks.push(element);
        }
      });

    }else {
      this.$Modal.error({
        title: '加载失败',
        content: '目标文档是运行版本，不能被编辑器打开'
      });
      this.currentGraph = null;
    }
  }
    

  //绘制数据控制
  //========================

  blocks : Array<BlockEditor> = [];
  connectors : Array<ConnectorEditor> = [];

  /**
   * 清空绘制数据
   */
  public clearAll() {
    this.blocks.empty();
    this.connectors.empty();
  }
  /**
   * 获取当前绘制器中所有单元
   */
  public getBlocks() { return this.blocks;}
  /**
   * 获取当前绘制器中所有连接
   */
  public getConnectors() { return this.connectors;}
  /**
   * 根据单元GUID获取当前绘制器中的所有单元
   * @param guid 单元GUID
   */
  public getBlocksByGUID(guid : string) { 
    let arr = [];
    this.blocks.forEach(element => {
      if(element.guid==guid)
        arr.push(element);
    });
    return arr;
  }
  /**
   * 根据单元GUID获取当前绘制器中的一个单元
   * @param guid 单元GUID
   */
  public getOneBlockByGUID(guid : string) { 
    for (let index = 0; index < this.blocks.length; index++) {
      if(this.blocks[index].guid==guid)
        return this.blocks[index];
    }
    return null;
  }

  onDeleteBlock(block : BlockEditor) {
    this.loadedBlocks.remove(block);
  }

  addBlockInPos : Vector2 = new Vector2();
  isAddBlockInPos = false;

  setAddBlockInpos(pos : Vector2) {
    this.isAddBlockInPos = true;
    this.addBlockInPos = pos;
  }
  public userAddBlock(blockData : BlockRegData) {
    //检查单元是否只能有一个
    if(blockData.settings.oneBlockOnly) {
      if(this.getBlocksByGUID(blockData.guid).length > 0) {
        this.$Modal.info({
          title: '提示',
          content: '当前文档中已经有 ' + blockData.baseInfo.name + ' 了哦，此单元只能有一个'
        });
        return;
      }
    }

    let newBlock = new BlockEditor(blockData);
    if(this.isAddBlockInPos) { //在指定位置添加单元
      
      this.addBlockInPos.x -= newBlock.size.x / 2;
      this.addBlockInPos.y -= newBlock.size.y / 2;
      this.isAddBlockInPos = false;
      this.editorWorker.addBlock(newBlock, this.addBlockInPos)
    } else if(this.isConnectingToNew) { //添加单元并连接

      this.editorWorker.addBlock(newBlock, this.connectingEndPos);

      let port = this.editorWorker.endConnectToNew(newBlock);
      let pos = new Vector2();
      pos.Set(port.editorData.getPosition());
      pos.x = this.connectingEndPos.x - (pos.x - newBlock.position.x);
      pos.y = this.connectingEndPos.y - (pos.y - newBlock.position.y);

      newBlock.setPos(pos);
    } else { //在屏幕中央位置添加单元
      let center = this.viewPort.calcCenter();

      center.x -= newBlock.size.x / 2;
      center.y -= newBlock.size.y / 2;

      this.editorWorker.addBlock(newBlock, center);
    }
  }
  
  //视口控制
  //========================

  viewRealSize = {
    w: 640,
    h: 800
  }

  viewPort : Rect = new Rect(2048, 2048, 0, 0);
  viewScale = 100;
  viewZoom = 1;

  public getViewPort() { return this.viewPort; }
  public getScale()  { return this.viewScale; }

  public viewPortPosToWindowPos(pos : Vector2) {
    return new Vector2(pos.x - this.viewPort.x, pos.y - this.viewPort.y);
  }
  public recalcViewPort() {
    this.viewZoom = this.viewScale / 100;
    this.viewPort.w = this.viewRealSize.w;
    this.viewPort.h = this.viewRealSize.h;
  }
  public moveViewportToPos(pos : Vector2) {
    this.viewPort.setPos(pos.x - this.viewPort.w / 2, pos.y - this.viewPort.h / 2);
  }

  zoomValues = [ 30, 50, 60, 80, 100, 110, 120, 130, 150, 170, 190, 200 ];

  //缩放控制
  //========================

  /**
   * 放大视图
   */
  public zoomIn() {
    if(this.viewScale <= 190) this.zoomUpdate(this.viewScale + 10);
    else this.zoomUpdate(200);
  }
  /**
   * 缩小视图
   */
  public zoomOut() {
    if(this.viewScale >= 40) this.zoomUpdate(this.viewScale - 10);
    else this.zoomUpdate(30);
  }
  /**
   * 刷新缩放视图大小
   * @param scale 比例(0-100)
   */
  public zoomUpdate(scale = 0) {
    let pos = new Vector2(this.viewPort.x + this.viewRealSize.w / 2, this.viewPort.y + this.viewRealSize.h / 2);
    pos.x = pos.x / this.viewZoom;
    pos.y = pos.y / this.viewZoom;

    this.viewScale = scale == 0 ? this.viewZoom * 100 : scale;
    this.recalcViewPort();

    pos.x = pos.x * this.viewZoom - this.viewRealSize.w / 2;
    pos.y = pos.y * this.viewZoom - this.viewRealSize.h / 2;
    this.viewPort.setPos(pos);
  }

  private onWindowSizeChanged() {
    this.viewRealSize.w = this.editorHost.offsetWidth;
    this.viewRealSize.h = this.editorHost.offsetHeight;
    this.recalcViewPort();
  }

  editorHost : HTMLDivElement = null;
  editorWorker : BlockEditorWorker = null;
  editorCanvas : BlockEditorCanvasDrawer = null;

  blockOwnerData : BlockEditorOwner = null;

  mounted() {
    setTimeout(() =>{

      window.addEventListener('resize', () => this.onWindowSizeChanged);

      this.editorWorker = <BlockEditorWorker>this.$refs.editorWorker;
      this.editorCanvas = <BlockEditorCanvasDrawer>this.$refs.editorCanvas;

      this.editorHost = <HTMLDivElement>this.$refs.editorHost;
      this.editorHost.addEventListener('resize', () => this.onWindowSizeChanged);
      this.toolBarHeight = CommonUtils.getTop(this.editorHost);
      this.toolBarWidth = CommonUtils.getLeft(this.editorHost);

      this.blockOwnerData = {
        onBlockDelete: this.editorWorker.onBlockDelete,
        onUserSelectBlock: this.editorWorker.onUserSelectBlock,
        onMoveBlock: this.editorWorker.onMoveBlock,
        onMoveBlockEnd: this.editorWorker.onMoveBlockEnd,
        startConnect: this.editorWorker.startConnect,
        endConnect: this.editorWorker.endConnect,
        updateCurrentHoverPort: this.editorWorker.updateCurrentHoverPort,
        updateCurrentHoverPortLeave: this.editorWorker.updateCurrentHoverPortLeave,
        updateConnectEnd: this.editorWorker.updateConnectEnd,
        unSelectAllBlocks: this.editorWorker.unSelectAllBlocks,
        getBlockHostElement: this.editorWorker.getBlockHostElement,
        getMultiSelectedBlocks: this.editorWorker.getMultiSelectedBlocks,
        unConnectConnector: this.editorWorker.unConnectConnector,
        getVue: () => this
      };

      this.onWindowSizeChanged();
      this.recalcViewPort();
    },200);
  }
  beforeDestroy() {
    window.removeEventListener('resize', () => this.onWindowSizeChanged);
    this.editorHost.removeEventListener('resize', () => this.onWindowSizeChanged);
  }

  //组件数据共享
  //========================

  isDragView = false;
  isConnecting = false;
  isConnectingToNew = false;
  isMultiSelecting = false;
  connectingCanConnect = false;
  connectingEndPos = new Vector2();
  connectingStartPort : BlockPort = null;
  connectingIsFail = false;
  connectingConnector = new ConnectorEditor();
  connectingFailedText = '';
  multiSelectRect = new Rect();
  currentHoverPort  : BlockPort = null;

  toolBarHeight = 0;
  toolBarWidth = 0;

  @Prop({default:null}) runner : BlockRunner;

  @Watch('isMultiSelecting') onIsMultiSelectingChanged(v) { this.$emit('update-multi-selecting', v); }

  //设置属性
  //========================

  @Prop({ default:null }) settings : EditorSettings;
  @Prop({ default: false }) mouseLeftMove : boolean;

  //公共方法
  //========================

  /**
   * 新文件
   */
  public newFile() {
    setTimeout(() => {
      this.clearAll();
      let centerPoint = this.viewPort.calcCenter();
      centerPoint.x -= (this.viewPort.w / 10);
      this.editorWorker.addBlock(new BlockEditor(BaseBlocks.getScriptBaseBlockIn()), new Vector2(
        this.viewPort.x + (this.viewPort.w / 2 - 35) - this.viewPort.w / 2.5,
        this.viewPort.y + (this.viewPort.h / 2 - 15)
      ));
    }, 200);
  }


  public hasSelected() { return this.editorWorker.hasSelected(); }
  public getMultiSelectedBlocks()  { return this.editorWorker.getMultiSelectedBlocks(); }
  public getSelectedBlocks()  { return this.editorWorker.getSelectedBlocks(); }
  public getOneSelectedBlock()  { return this.editorWorker.getOneSelectedBlock(); }
  public getOneSelectedConnector()  { return this.editorWorker.getOneSelectedConnector(); }
  public unSelectAllBlocks() { this.editorWorker.unSelectAllBlocks(); }
  public unSelectAllConnectors() { this.editorWorker.unSelectAllConnectors(); }
  public deleteSelectedBlocks() { this.editorWorker.deleteSelectedBlocks(); }
  public endConnectToNew() { this.editorWorker.endConnectToNew(); }
  public clearAllBlockDebugStyles() {
    this.blocks.forEach(element => { 
      element.markDective(true); 
      element.markBreakPointActiveState(false); 
    });
    this.connectors.forEach(element =>  element.clearActive());
  }
  public updateAllBlockPrams() {
    //变量初始化以仅参数赋值
    this.blocks.forEach((block) => {
      block.currentRunner = this.runner;
      
      Object.keys(block.inputParameters).forEach((guid) => {
        let params = (<BlockParameterPort>block.inputParameters[guid]);
        if(params.paramUserSetValue != null) {
          params.paramValue = params.paramUserSetValue;
          params.update();
        }
      });
    });
  }
}



</script>