<template>
  <div ref="editorHost" class="editor" :style="{ cursor: (isDragView ? 'grabbing' : (mouseLeftMove ? 'grab' : 'default')) }"
    @dragover="$event.preventDefault()" @drop="onDrop($event)">
    <!--单元连接弹出提示-->
    <div class="common-tip"
      v-show="isConnecting && !isConnectingToNew"
      :style="{ left: (connectingEndPos.x - viewPort.x + 10) + 'px', top:  (connectingEndPos.y - viewPort.y + 10) + 'px' }">
      <span v-if="currentHoverPort==null"><i class="iconfont icon-calendar-1 mr-1"></i>连接至新的单元</span>
      <span v-else-if="connectingCanConnect"><i class="iconfont icon-check- text-success"></i><span v-html="connectingSuccessText"></span></span>
      <span v-else><i class="iconfont icon-close- text-danger mr-1"></i><span v-html="connectingFailedText"></span></span>
    </div>
    <!--背景画布-->
    <BlockEditorCanvasDrawer ref="editorCanvas" 
      :viewPort="viewPort"
      :viewZoom="viewZoom"
      :viewScale="viewScale"
      :viewRealSize="viewRealSize"
      :isMultiSelecting="isMultiSelecting"
      :multiSelectRect="multiSelectRect"
      :gridShow="settings.gridShow"
      :drawDebugInfo="settings.drawDebugInfo"
      @contextmenu="onCanvasContextmenu"
      >
    </BlockEditorCanvasDrawer>
    <!--主控制区域-->
    <BlockEditorWorker ref="editorWorker"
      :viewPort="viewPort"
      :viewZoom="viewZoom"
      :viewScale.sync="viewScale"
      :editorCanvas="editorCanvas"
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
      @update-connectingSuccessText="(v) => connectingSuccessText = v"
      @update-multiSelectRect="(v) => multiSelectRect = v"
      :mouseLeftMove="mouseLeftMove"
      :currentDocunment="currentDocunment"
      :currentGraph="currentGraph"
      :runner="runner"
      :editorHost="editorHost"
      :blockOwnerData="blockOwnerData"
      :blocks="blocks"
      :connectors="connectors"
      @update-viewport="recalcViewPort"
      @update-select-state="$emit('update-select-state', hasSelected())"
      @update-add-block-panel-filter="(d) => $emit('update-add-block-panel-filter', d)"
      @update-set-file-changed="onFileChanged"
      @show-add-block-panel-view-port-pos="(p) => $emit('show-add-block-panel-at-pos', viewPort, viewPortPosToWindowPos(p))"
      @show-add-block-panel-at-pos="(p) => $emit('show-add-block-panel-at-pos', viewPort, p)"
      @clear-add-block-panel-filter="$emit('clear-add-block-panel-filter')"
      @set-add-block-inpos="setAddBlockInpos"
      @on-delete-block="onDeleteBlock"
      @on-mouse-zoom-view="onMouseZoomView"
      @on-editor-key="onEditorKey"
      @on-update-editor-host-absolute-pos="(p) => editorHostAbsolutePos.Set(p)"
      >
      <BlockEditorConnectorsDrawer ref="editorConnectorsCanvas" 
        :connectors="connectors"
        :viewPort="viewPort"
        :viewZoom="viewZoom"
        :viewScale="viewScale"
        :viewRealSize="viewRealSize"
        :isConnecting="isConnecting"
        :drawDebugInfo="settings.drawDebugInfo"
        :connectingEndPos="connectingEndPos"
        :connectingStartPort="connectingStartPort"
        :connectingIsFail="connectingIsFail">
      </BlockEditorConnectorsDrawer>

    </BlockEditorWorker>
    <div class="zoom_tool">
      <a href="javascript:;" class="left iconfont icon-zoom-out" title="缩小" @click="zoomOut()"></a>
      <select v-model="zoomSelectValue" @change="zoomUpdate(zoomSelectValue)">
        <option v-for="(v, i) in zoomValues" :key="i" :value="v">{{v}}%</option>
      </select>
      <span>{{viewScale}}%</span>
      <a href="javascript:;" class="right iconfont icon-zoom" title="放大" @click="zoomIn()"></a>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

import { Vector2 } from "../../model/Vector2";
import { Rect } from "../../model/Rect";

import BlockEditorCanvasDrawer from "./BlockEditorCanvasDrawer.vue";
import BlockEditorConnectorsDrawer from "./BlockEditorConnectorsDrawer.vue";
import BlockEditorWorker from "./BlockEditorWorker.vue";
import BlockEditorClipBoard from "./BlockEditorClipBoard.vue";
import { BlockPort, BlockPortConnectorData } from "../../model/Define/Port";
import { BlockRunner } from "../../model/Runner/Runner";
import { BlockRegData } from "../../model/Define/BlockDef";
import { BlockEditorOwner, BlockGraphVariableChangeCallback, BlockGraphPortChangeCallback, 
  BlockGraphVariableFullChangeCallback, BlockGraphChangeCallback } from "../../model/Editor/BlockEditorOwner";
import { BlockGraphDocunment, BlockDocunment } from "../../model/Define/BlockDocunment";
import { BlockBreakPoint } from "../../model/Define/Block";
import { BlockPortEditor } from "../../model/Editor/BlockPortEditor";
import { BlockEditor } from "../../model/Editor/BlockEditor";
import { ConnectorEditor } from "../../model/Editor/ConnectorEditor";
import { EditorSettings } from "../../model/Editor/EditorSettings";
import { EventHandler } from "../../utils/EventHandler";
import { MenuItem } from "../../model/Menu";
import CommonUtils from "../../utils/CommonUtils";
import HtmlUtils from "../../utils/HtmlUtils";
import ToolTipUtils from "../../utils/ToolTipUtils";
import BaseBlocks from "../../model/Blocks/BaseBlocks";
import BlockServiceInstance from "../../sevices/BlockService";
import DebugWorkProviderInstance from "@/model/WorkProvider/DebugWorkProvider";

@Component({
  components: {
    'BlockEditorCanvasDrawer': BlockEditorCanvasDrawer,
    'BlockEditorClipBoard': BlockEditorClipBoard,
    'BlockEditorWorker': BlockEditorWorker,
    'BlockEditorConnectorsDrawer': BlockEditorConnectorsDrawer,
  }
})
export default class BlockDrawer extends Vue {

  private currentGraph : BlockGraphDocunment = null;
  private currentDocunment : BlockDocunment = null;

  @Prop({default:null}) docunment : BlockDocunment;

  private loadedBlocks : Array<BlockEditor> = [];
  private loadedConnectors : Array<ConnectorEditor> = [];

  public goGraph(g : BlockGraphDocunment) {
    if(g != this.currentGraph) {
      this.currentGraph = g;
      this.currentDocunment.currentGraph = g;
      this.drawGraph(this.currentGraph);
    }
  }
  /**
   * 获取当前打开的图表
   */
  public getCurrentGraph() { return this.currentGraph; }

  /**
   * 加载绘制文档
   */
  public drawGraph(doc : BlockGraphDocunment) {
    this.unloadGraph();
    this.currentGraph = doc;
    if(this.currentGraph)
      this.loadGraph();
  }
  public loadDocunment(doc : BlockDocunment) {
    if(this.currentDocunment != null)
      this.unloadDocunment();
    this.currentDocunment = doc;
  }
  public unloadDocunment() {
    if(this.currentDocunment != null) {
      this.loadedBlocks.forEach((block) => {
        block.forceNotUnConnect = true;
        block.destroy();
      });
      this.loadedBlocks.empty();
      this.loadedConnectors.forEach((connector) => connector.inited = false);
      this.loadedConnectors.empty();
      this.currentDocunment = null;
    }
  }

  private unloadGraph() {
    if(this.currentGraph != null) {
      this.saveViewPort();
      this.blocks.forEach(element => element.hide());
      this.currentGraph = null;
    }
  }
  private loadGraph() {
    if(this.currentGraph.isEditor) {

      this.editorCanvas.drawStop();
      this.editorConnectorsCanvas.drawStop();

      this.blocks = <BlockEditor[]>this.currentGraph.blocks;
      this.connectors = <ConnectorEditor[]>this.currentGraph.connectors;

      //加载上次的视口设置

      if(this.currentGraph.viewPort != null)
        this.viewPort.setPos(this.currentGraph.viewPort.x, this.currentGraph.viewPort.y);
      else
        this.viewPort.setPos(2048, 2048);

      if(this.currentGraph.scale != null && this.currentGraph.scale != 100) {
        this.viewScale = this.currentGraph.scale;
        this.viewZoom = this.currentGraph.scale / 100;
      }
      else this.zoomUpdate(100);

      this.recalcViewPort();

      //如果是空文档，那么初始化
      if(this.blocks.length == 0) {
        if(this.currentGraph.isMainGraph) this.newFile();
        else this.newGraph();
      }

      //初始化元素的编辑器使用数据
      this.connectors.forEach((connector) => {
        if(!connector.inited && connector.startPort != null && connector.endPort != null) {
          connector.startPort.connectedToPort.push({
            port: connector.endPort,
            connector: connector
          });
          connector.endPort.connectedFromPort.push({
            port: connector.startPort,
            connector: connector
          });
          connector.inited = true;
          connector.currentRunner = this.runner;
          this.loadedConnectors.push(connector);
        }
      });
      this.blocks.forEach(element => {

        if(!element.created) {
          element.create(this.blockOwnerData);
          element.setPos(element.position);
          this.loadedBlocks.push(element);
        }else {
          element.show();
          element.setPos(element.position);
        }

        element.updateAllPortElement();
      });
      this.connectors.sort((a, b) => {
        if(a.flexableCoonIndex == b.flexableCoonIndex) return 0;
        return a.flexableCoonIndex > b.flexableCoonIndex ? 1 : -1;
      })
      
      //刷新弹性端口的连接
      setTimeout(() => {
        for(let i = 0; i < this.connectors.length; i++) {
          let connector = this.connectors[i];
          if(connector.flexableCoonIndex > 0) {
            this.editorWorker.flushConnectorFlexablePort(connector);
            if(connector.flexableCoonIndex > ConnectorEditor.flexableCoonSource)
              ConnectorEditor.flexableCoonSource = connector.flexableCoonIndex + 1;
          }
        }
      }, 400);
      setTimeout(() => {
        //开始绘制
        this.editorCanvas.draw();
        this.editorConnectorsCanvas.draw();
      }, 200);
    }else {
      DebugWorkProviderInstance.ModalProvider('warning', '加载失败', '目标文档是运行版本，不能被编辑器打开', () => {});
      this.currentGraph = null;
    }
  }

  public doDeleteGraph(graph : BlockGraphDocunment) {
    this.blockOwnerData.editorEvents.onGraphDelete.invoke(graph);

    graph.blocks.forEach((block) => (<BlockEditor>block).destroy());
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
   * 通过单元UID获取当前绘制器中单元
   */
  public getBlockByUid() { 
    return this.blocks;
  }
  /**
   * 获取当前绘制器中所有连接
   */
  public getConnectors() { return this.connectors;}
  
  onDeleteBlock(block : BlockEditor) {
    this.loadedBlocks.remove(block);
  }

  addBlockInPos : Vector2 = new Vector2();
  isAddBlockInPos = false;

  public setNoAddBlockInpos() {
    this.isAddBlockInPos = false;
  }
  public setAddBlockInpos(pos : Vector2) {
    this.isAddBlockInPos = true;
    this.addBlockInPos = pos;
  }
  public userAddBlock(blockData : BlockRegData) {
    
    //检查单元是否只能有一个
    if(blockData.settings.oneBlockOnly && this.currentGraph.getBlocksByGUID(blockData.guid).length > 0) {      
      DebugWorkProviderInstance.ModalProvider('warning', '提示', '当前文档中已经有 ' + blockData.baseInfo.name + ' 了，此单元只能有一个', () => {});
      return;
    }
    //自定义检查回调
    if(typeof blockData.callbacks.onAddCheck == 'function') {
      let err = blockData.callbacks.onAddCheck(blockData, this.currentGraph);
      if(err != null) {
        DebugWorkProviderInstance.ModalProvider('warning', '提示', err, () => {});
        return;
      }
    }

    let newBlock = new BlockEditor(blockData);
    if(this.isAddBlockInPos) { //在指定位置添加单元

      this.editorWorker.addBlock(newBlock, this.addBlockInPos)

      let pos = new Vector2(newBlock.position.x, newBlock.position.y);
      pos.x -= newBlock.size.x / 2;
      pos.y -= newBlock.size.y / 2;

      newBlock.setPos(pos);
      
    } 
    else if(this.isConnectingToNew) { //添加单元并连接

      this.editorWorker.addBlock(newBlock, this.connectingEndPos);

      let port = this.editorWorker.endConnectToNew(newBlock);
      let pos = new Vector2();
      pos.Set((<BlockPortEditor>port).editorData.getPosition());
      pos.x = this.connectingEndPos.x - (pos.x - newBlock.position.x);
      pos.y = this.connectingEndPos.y - (pos.y - newBlock.position.y);

      newBlock.setPos(pos);
    } 
    else { //在屏幕中央位置添加单元
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
    return new Vector2((pos.x - this.viewPort.x + this.elOffestPos.x) * this.viewZoom, (pos.y - this.viewPort.y + this.elOffestPos.y) * this.viewZoom);
  }
  public windowPosToViewPortPos(pos : Vector2) {
    let zoom = 1 / this.viewZoom;
    return new Vector2((this.viewPort.x + pos.x - this.elOffestPos.x) * zoom, (this.viewPort.y + pos.y - this.elOffestPos.y) * zoom);
  }
  public recalcViewPort() {
    this.viewZoom = this.viewScale / 100;
    this.zoomSelectValue = this.viewScale;
    this.viewPort.w = this.viewRealSize.w;
    this.viewPort.h = this.viewRealSize.h;
  }
  public moveViewportToPos(pos : Vector2) {
    this.viewPort.setPos(pos.x - this.viewPort.w / 2, pos.y - this.viewPort.h / 2);
  }
  public moveViewportToBlockPos(block : BlockEditor, flashBlock = false) {
    this.moveViewportToPos(new Vector2(
      block.position.x + block.size.x / 2, 
      block.position.y + block.size.y / 2));
    if(flashBlock) {
      block.markActive();
      setTimeout(() => block.markDective(true), 300);
    }
  }

  zoomValues = [ 30, 50, 60, 80, 100, 110, 120, 130, 150, 170, 190, 200 ];
  zoomSelectValue = 100;

  elOffestPos = new Vector2();
  editorHostAbsolutePos = new Vector2();

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

  public onMouseZoomView(e : WheelEvent) {
    let mouseCurrentPos = this.editorWorker.getMouseCurrentPos();
    let oldScale = this.viewScale;
    let pos = new Vector2(this.viewPort.x + mouseCurrentPos.x, this.viewPort.y + mouseCurrentPos.y);

    pos.x = pos.x / this.viewZoom;
    pos.y = pos.y / this.viewZoom;

    if(e.deltaY < 0) {    
      if(oldScale <= 100 && this.viewScale + 5 > 100 && !this.editorWorker.getIsControlKeyDown())
        this.viewScale = 100;
      else 
        this.viewScale = this.viewScale + 5;

      if(this.viewScale > 200) this.viewScale = 200;
    }else if(e.deltaY > 0) {
      this.viewScale = this.viewScale - 5;

      if(this.viewScale < 30) this.viewScale = 30;
    }

    this.recalcViewPort();
    this.editorWorker.updateMousePos(e);

    mouseCurrentPos = this.editorWorker.getMouseCurrentPos();

    pos.x = pos.x * this.viewZoom - mouseCurrentPos.x;
    pos.y = pos.y * this.viewZoom - mouseCurrentPos.y;

    this.viewPort.setPos(pos);
  }
  public onWindowSizeChanged() {
    this.viewRealSize.w = this.editorHost.offsetWidth;
    this.viewRealSize.h = this.editorHost.offsetHeight;
    this.recalcViewPort();
  }
  public onEditorKey(keyCode : number) {
    let controlKeyDown = this.editorWorker.getIsControlKeyDown();
    switch(keyCode) {
      case 67://C
        if(controlKeyDown) this.clipboardCopySelect();
        break;
      case 86://V
        if(controlKeyDown) this.clipboardPaste();
        break; 
      case 88://X
        if(controlKeyDown) this.clipboardCutSelect();
        break; 
      case 83://S
        if(controlKeyDown) this.$emit('on-want-save');
        break; 
    }
  }
  private onFileChanged() {
    if(this.docunment)
      this.docunment.fileChanged = true;
  }

  editorHost : HTMLDivElement = null;
  editorWorker : BlockEditorWorker = null;
  editorCanvas : BlockEditorCanvasDrawer = null;
  editorConnectorsCanvas : BlockEditorConnectorsDrawer = null;
  @Prop({default: null}) editoClipboard : BlockEditorClipBoard;

  blockOwnerData : BlockEditorOwner = null;
  testSizeChangeTimer : any = null;

  mounted() {

    setTimeout(() =>{
      this.currentDocunment = this.docunment;
      this.currentGraph =  null;
      this.docunment.currentEditor = this;
      let ele = <HTMLElement>this.$refs.editorHost;
      this.elOffestPos.x = HtmlUtils.getLeft(ele);
      this.elOffestPos.y = HtmlUtils.getTop(ele);

      window.addEventListener('resize', () => this.onWindowSizeChanged);
      this.testSizeChangeTimer = setInterval(() => {
        if(this.viewRealSize.w != this.editorHost.offsetWidth || this.viewRealSize.h != this.editorHost.offsetHeight)
          this.onWindowSizeChanged();
      }, 1000);

      this.editorWorker = <BlockEditorWorker>this.$refs.editorWorker;
      this.editorCanvas = <BlockEditorCanvasDrawer>this.$refs.editorCanvas;
      this.editorConnectorsCanvas = <BlockEditorConnectorsDrawer>this.$refs.editorConnectorsCanvas;

      this.editorHost = <HTMLDivElement>this.$refs.editorHost;
      this.editorHost.addEventListener('resize', () => this.onWindowSizeChanged);

      this.editorCanvas.addDebugInfoItem(() =>
        'viewPort : x' + this.viewPort.x + ' y: ' + this.viewPort.y + ' w: ' + this.viewPort.w + ' h: ' + this.viewPort.h
      );

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
        unSelectAllConnector: this.editorWorker.unSelectAllConnectors,
        getBlockHostElement: this.editorWorker.getBlockHostElement,
        getMultiSelectedBlocks: this.editorWorker.getMultiSelectedBlocks, 
        getBlocksInRect: this.editorWorker.getBlocksInRect, 
        getWorker: () => this.editorWorker,
        unConnectConnector: this.editorWorker.unConnectConnector,
        showBlockRightMenu: this.showBlockRightMenu,
        showPortRightMenu: this.showPortRightMenu,
        showConnectorRightMenu: this.showConnectorRightMenu,

        showInputRightMenu: (pos) => this.$emit('on-show-input-right-menu', pos),
        isConnectorSelected: () => {
          return this.editorWorker.getSelectedConnectors().length > 0
        },
        isAnyConnectorHover: () => this.editorWorker.isAnyConnectorHover(),
        markFileChanged: () => this.onFileChanged(),
        deleteBlock: this.editorWorker.deleteBlock,
        chooseType: (p, c, ce) => { this.$emit('choose-custom-type', p, c, ce); },
        openGraph: (g) => { this.$emit('on-open-graph', g); },
        graphVariableChange: {
          onVariableAdd: (g, v) => { this.blockOwnerData.editorEvents.onVariableAdd.invoke(g, v); this.onFileChanged() },
          onVariableRemove: (g, v) => { this.blockOwnerData.editorEvents.onVariableRemove.invoke(g, v); this.onFileChanged() },
          onVariableUpdate: (g, n, v) => { this.blockOwnerData.editorEvents.onVariableUpdate.invoke(g, n, v); this.onFileChanged() },
        },
        graphPortChange: {
          onPortAdd: (g, port) => { this.blockOwnerData.editorEvents.onGraphPortAdd.invoke(g, port); this.onFileChanged() },
          onPortRemove: (g, port) => { this.blockOwnerData.editorEvents.onGraphPortRemove.invoke(g, port); this.onFileChanged() },
          onPortUpdate: (g, port) => { this.blockOwnerData.editorEvents.onGraphPortUpdate.invoke(g, port); this.onFileChanged() },
          onPortMoveUp: (g, port, index) => { this.blockOwnerData.editorEvents.onGraphPortMoveUp.invoke(g, port, index); this.onFileChanged() },
          onPortMoveDown: (g, port, index) => { this.blockOwnerData.editorEvents.onGraphPortMoveDown.invoke(g, port, index); this.onFileChanged() },
        },
        graphChange: {
          onGraphUpdate: (g) => this.blockOwnerData.editorEvents.onGraphUpdate.invoke(g),
        },
        editorEvents: {
          onGraphPortAdd : new EventHandler<BlockGraphPortChangeCallback>(),
          onGraphPortUpdate : new EventHandler<BlockGraphPortChangeCallback>(),
          onGraphPortRemove : new EventHandler<BlockGraphPortChangeCallback>(),
          onGraphPortMoveUp : new EventHandler<BlockGraphPortChangeCallback>(),
          onGraphPortMoveDown : new EventHandler<BlockGraphPortChangeCallback>(),
          onVariableAdd: new EventHandler<BlockGraphVariableChangeCallback>(),
          onVariableRemove: new EventHandler<BlockGraphVariableChangeCallback>(),
          onVariableUpdate: new EventHandler<BlockGraphVariableFullChangeCallback>(),
          onGraphDelete: new EventHandler<BlockGraphChangeCallback>(),
          onGraphUpdate: new EventHandler<BlockGraphChangeCallback>(),
        },
        getViewZoom: () => this.viewZoom,
        getVue: () => this,
        viewPortPosToWindowPos: (v) => this.viewPortPosToWindowPos(v),
        windowPosToViewPortPos: (v) => this.windowPosToViewPortPos(v),
      };
      this.$emit('update-block-owner-data', this.blockOwnerData);
      this.onWindowSizeChanged();
      this.recalcViewPort();

      this.loadDocunment(this.currentDocunment);
      this.$emit('on-created', this);
    },200);
  }
  beforeDestroy() {
    clearInterval(this.testSizeChangeTimer);
    window.removeEventListener('resize', () => this.onWindowSizeChanged);
    this.$emit('on-destroyed', this);
  }

  //拖放
  //========================

  onDrop(e : DragEvent) {
    this.editorWorker.updateMousePos(e);

    let data = e.dataTransfer.getData('text/plain');
    if(!CommonUtils.isNullOrEmpty(data) && data.startsWith('drag:')) {
      let datav = data.split(':');
      switch(datav[1]) {
        case 'graph-variable': this.showAddVariableMenu(datav[3]); break;
        case 'graph': {
          let block = new BlockEditor(BaseBlocks.getScriptBaseGraphCall());
          block.options['graph'] = datav[2];
           let pos = this.editorWorker.getMouseCurrentPosInViewPort();
          let zoom = this.viewZoom;
          this.editorWorker.addBlock(block, new Vector2(pos.x / zoom, pos.y / zoom));
          break;
        }
        case 'block': {
          let pos = this.editorWorker.getMouseCurrentPosInViewPort();
          let zoom = this.viewZoom;
          this.setAddBlockInpos(new Vector2(pos.x / zoom, pos.y / zoom));
          this.userAddBlock(BlockServiceInstance.getRegisteredBlock(datav[2]));
          break;
        }
      }
    }
  }

  showAddVariableMenu(variableName : string) {
    let currentPos = this.editorWorker.getMouseCurrentPos();
    let currentPosInViewPort = this.editorWorker.getMouseCurrentPosInViewPort();
    this.$contextmenu({
      x: currentPos.x,
      y: currentPos.y,
      items: [
        { label: '获取变量 ' + variableName, onClick: () => {
          let block = new BlockEditor(BaseBlocks.getScriptBaseVariableGet());
          block.options['variable'] = variableName;
          this.editorWorker.addBlock(block, currentPosInViewPort);
        } },
        { label: '设置变量 ' + variableName, onClick: () => {
          let block = new BlockEditor(BaseBlocks.getScriptBaseVariableSet());
          block.options['variable'] = variableName;
          this.editorWorker.addBlock(block, currentPosInViewPort);
        } },
      ],
      zIndex: 100,
      customClass: 'menu-context',
    })
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
  connectingFailedText = '';
  connectingSuccessText = '';
  multiSelectRect = new Rect();
  currentHoverPort  : BlockPort = null;

  @Prop({default: null}) runner : BlockRunner;

  @Watch('isMultiSelecting') onIsMultiSelectingChanged(v : any) { this.$emit('update-multi-selecting', v); }

  //设置属性
  //========================

  @Prop({ default: null }) settings : EditorSettings;
  @Prop({ default: false }) mouseLeftMove : boolean;

  //公共方法
  //========================

  /**
   * 新文件
   */
  public newFile() {
    setTimeout(() => {
      this.clearAll();

      //添加默认端口
      this.editorWorker.addBlock(new BlockEditor(BaseBlocks.getScriptBaseBlockIn()), new Vector2(
        this.viewPort.x + (this.viewPort.w / 2 - 35) - this.viewPort.w / 2.5,
        this.viewPort.y + (this.viewPort.h / 2 - 15)
      ));
      this.editorWorker.addBlock(new BlockEditor(BaseBlocks.getScriptBaseBlockOut()), new Vector2(
        this.viewPort.x + (this.viewPort.w / 2 - 35) + this.viewPort.w / 2.5,
        this.viewPort.y + (this.viewPort.h / 2 - 15)
      ));

      //新文档，所以取消设置文件更改状态
      this.currentDocunment.fileChanged = false;
    }, 500);
  }
  public newGraph() {
    setTimeout(() => {
      this.clearAll();

      //添加默认端口
      this.editorWorker.addBlock(new BlockEditor(BaseBlocks.getScriptBaseGraphIn()), new Vector2(
        this.viewPort.x + (this.viewPort.w / 2 - 35) - this.viewPort.w / 2.5,
        this.viewPort.y + (this.viewPort.h / 2 - 15)
      ));
      this.editorWorker.addBlock(new BlockEditor(BaseBlocks.getScriptBaseGraphOut()), new Vector2(
        this.viewPort.x + (this.viewPort.w / 2 - 35) + this.viewPort.w / 2.5,
        this.viewPort.y + (this.viewPort.h / 2 - 15)
      ));

      this.$emit('update-set-file-changed');
    }, 500);
  }

  public enableOrdisableAllBreakPoint(status : BlockBreakPoint) {
    let loopForGraph = (graph : BlockGraphDocunment) => {
      graph.blocks.forEach((block) => {
        if(block.breakpoint != 'none')
          block.breakpoint = status;
      });
      graph.children.forEach((g) => loopForGraph(g));
    }
    loopForGraph(this.currentDocunment.mainGraph);
    this.$emit('update-set-file-changed');
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
  public showDeleteModalClick() { this.editorWorker.showDeleteModalClick(); }
  public saveViewPort() {
    this.currentGraph.viewPort = this.viewPort;
    this.currentGraph.scale = this.viewScale;
  }

  //剪贴板控制
  //=======================

  public clipboardCopySelect() { 
    let selectedBlock = this.editorWorker.getSelectedBlocks();
    let allConnectors = this.editorWorker.getBlocksAllConnector(selectedBlock);
    if(selectedBlock.length > 0) {
      this.editoClipboard.clearClipboard();
      this.editoClipboard.writeToClipboard(selectedBlock, allConnectors, this.editorWorker.calcBlocksRegion(selectedBlock).calcCenter());
      this.$message.success('已复制');
    } else {
      this.$message.warning('请选中你要复制的单元');
    }
  }
  public clipboardCutSelect() { 
    let selectedBlock = this.editorWorker.getSelectedBlocks();
    let allConnectors = this.editorWorker.getBlocksAllConnector(selectedBlock);
    this.editoClipboard.clearClipboard();
    this.editoClipboard.writeToClipboard(selectedBlock, allConnectors, this.editorWorker.calcBlocksRegion(selectedBlock).calcCenter());
    this.editorWorker.deleteSelectedBlocks();
  }
  public clipboardPaste(mouseDownPosInViewport ?: Vector2) { 
    if(this.editoClipboard.getBlocksClipboardState()) {
      let refPos = this.editoClipboard.getClipboardRefPoint();
      let blocks = this.editoClipboard.getBlocksInClipboard();
      let connectors = this.editoClipboard.getConnectorsInClipboard();
      let targetPos = mouseDownPosInViewport ? mouseDownPosInViewport : this.viewPort.calcCenter();
      let offest = {
        x: targetPos.x - refPos.x,
        y: targetPos.y - refPos.y,
      };

      let oldBlocks = new Array<{
        oldUid: string
        newBlock: BlockEditor
      }>();
      let findInOldBlocks = function(oldUid : string) : BlockEditor {
        for (let index = 0; index < oldBlocks.length; index++) {
          if(oldBlocks[index].oldUid == oldUid)
            return oldBlocks[index].newBlock;
        }
      }

      blocks.forEach((block) => {
        let newBlock = block.clone();

        this.editorWorker.addBlock(newBlock, new Vector2(block.position.x + offest.x, block.position.y + offest.y));

        //Clone values
        block.allPorts.forEach((port) => {
          let newPort = newBlock.getPortByGUID(port.guid);
          if(newPort != null)
            newPort.paramUserSetValue = port.paramUserSetValue;
        })

        //add to map
        oldBlocks.push({
          oldUid: block.uid,
          newBlock: newBlock
        });
      });

      connectors.forEach((connector) => {
        let startBlock = findInOldBlocks(connector.startPort.parent.uid);
        let endBlock = findInOldBlocks(connector.endPort.parent.uid);
        if(startBlock != null && endBlock != null) {
          let startPort = startBlock.getPortByGUID(connector.startPort.guid);
          let endPort = endBlock.getPortByGUID(connector.endPort.guid);
          if(startPort != null && endPort != null) 
            this.editorWorker.connectConnector(startPort, endPort);
        }
      });
    }
  }

  //撤销重做
  //=======================

  //TODO: 撤销重做

  public redo() { 

  }
  public undo() { 

  }
  
  //右键菜单
  //=======================

  onCanvasContextmenu(e : MouseEvent) {
    let selectedConnectors = this.editorWorker.getSelectedConnectors();
    let mousePos = new Vector2(
      e.clientX,
      e.clientY
    );
    if(selectedConnectors.length > 0) {
      this.showConnectorRightMenu(mousePos);
    }
    return false;
  }

  closeOpenedMenu() {
    document.querySelectorAll('.menu-context').forEach((e) => {
      e.parentNode.removeChild(e);
    });
  }
  showConnectorRightMenu(screenPos : Vector2) {
    this.closeOpenedMenu();

    let selectedConnectors = this.editorWorker.getSelectedConnectors();

    this.$contextmenu({
      x: screenPos.x,
      y: screenPos.y,
      items: [
        { label: "断开连接", onClick: () => this.editorWorker.unconnectSelectedConnectors() },
      ].concat(selectedConnectors.length == 1 ? [
        { label: "拉直", onClick: () => this.editorWorker.straightenConnector(selectedConnectors[0].startPort, selectedConnectors[0]) },
      ] : []),
      zIndex: 100,
      customClass: 'menu-context',
    });
  }
  showBlockRightMenu(block : BlockEditor, screenPos : Vector2) {
    this.closeOpenedMenu();

    this.editorWorker.currentSelectedBlock = block;
    let selectedCount = this.editorWorker.getSelecteBlockCount();
    let selectedBlocks = this.editorWorker.getSelectedBlocks();

    let blockMenuSettingsMenuItems : MenuItem[] = null;

    if(selectedCount == 1) {
      //修复菜单的点击事件this
      blockMenuSettingsMenuItems = selectedBlocks[0].blockMenuSettings.items;
      let loopMenuClick = (items : MenuItem[]) => {
        items.forEach((item) => {
          if(item.children) loopMenuClick(item.children);
          if(typeof item.onClick === 'function' && (<any>item.onClick)['a'] != true) {
            let old = item.onClick;
            item.onClick = function() {
              old.call(selectedBlocks[0]);
            };
            (<any>item.onClick)['a'] = true;
          }
        })
      }
      loopMenuClick(blockMenuSettingsMenuItems);
    }

    let menuItems = (selectedCount == 1 ? selectedBlocks[0].blockMenuSettings.items : []).concat(
      <MenuItem[]>[
        { label: "删除", onClick: () => this.deleteSelectedBlocks(), divided: true },
        { label: "剪切", onClick: () => this.clipboardCutSelect() },
        { label: "复制", onClick: () => this.clipboardCopySelect() },
        { label: "粘贴", disabled: !this.editoClipboard.getBlocksClipboardState(), 
          onClick: () => this.clipboardPaste(this.editorWorker.getMouseCurrentPosInViewPort()),
          divided: true },
        { label: "刷新节点", onClick: () => this.editorWorker.refreshSelectedBlock() },
        { label: "清除报错信息", onClick: () => this.editorWorker.clearErrForSelectedBlock() },
        { label: "断开连接", onClick: () => this.editorWorker.unConnectSelectedBlock(), divided: true },
        { label: "对齐", disabled: selectedCount < 2, children: [
          { label: "左对齐", onClick: () => this.editorWorker.alignSelectedBlock(block, 'left') },
          { label: "上对齐", onClick: () => this.editorWorker.alignSelectedBlock(block, 'top') },
          { label: "右对齐", onClick: () => this.editorWorker.alignSelectedBlock(block, 'right') },
          { label: "下对齐", onClick: () => this.editorWorker.alignSelectedBlock(block, 'bottom') },
          { label: "中对齐", onClick: () => this.editorWorker.alignSelectedBlock(block, 'center-x') },
          { label: "中部对齐", onClick: () => this.editorWorker.alignSelectedBlock(block, 'center-y') },
        ] },
        { label: "断点", children: [
          { label: "无", onClick: () => this.editorWorker.setSelectedBlockBreakpointState('none') },
          { label: "启用", onClick: () => this.editorWorker.setSelectedBlockBreakpointState('enable') },
          { label: "禁用", onClick: () => this.editorWorker.setSelectedBlockBreakpointState('disable') },
        ], divided: true },
        { label: "为选中项创建注释", disabled: selectedCount < 2,  onClick: () => this.editorWorker.genCommentForSelectedBlock() },
      ]
    );


    this.$contextmenu({
      x: screenPos.x,
      y: screenPos.y,
      items: menuItems,
      zIndex: 100,
      customClass: 'menu-context',
    });
  }
  showPortRightMenu(port : BlockPortEditor, screenPos : Vector2) {
    this.closeOpenedMenu();
    
    this.editorWorker.currentSelectedPort = port;
    let addCoonItem = (e : BlockPortConnectorData, isUp : boolean) => {
      menuJumpItems.push({ label: (isUp ? '上' : '下') + '级连接 ' + (<BlockPortEditor>e.port).getBlockFastInfo(), children: [
          { 
            label: '跳转到' + (isUp ? '上' : '下') + '级',
            onClick: () => {
              let block = (<BlockPortEditor>e.port).getParentBlock();
              this.editorWorker.selectSomeBlocks([ block ]);
              this.moveViewportToBlockPos(block);
            }
          },
          { label: '断开连接',  onClick: () => this.editorWorker.unConnectConnector(<ConnectorEditor>e.connector) },
          { label: '拉直连接',  onClick: () => this.editorWorker.straightenConnector(port, <ConnectorEditor>e.connector) }
        ] 
      });
    };
    let menuJumpItems : Array<MenuItem> = [];
    if(port.connectedFromPort.length > 0) 
      port.connectedFromPort.forEach((e) => addCoonItem(e, true));
    if(port.connectedToPort.length > 0) 
      port.connectedToPort.forEach((e) => addCoonItem(e, false));

    let menuItems : Array<MenuItem> = [
      { 
        label: "删除参数", onClick: () => {
          let block = port.getParentBlock();
          block.onUserDeletePort(port);
        }, disabled: !port.isDyamicAdd, divided: true 
      },
      { label: "断开所有连接", onClick: () => this.editorWorker.unConnectPort(port) },
      { 
        label: "提升为变量", 
        disabled: port.isConnected(),
        onClick: () => this.editorWorker.makePortAsVariable(port), 
        divided: true 
      },
    ];
    menuItems = menuItems.concat(menuJumpItems);

    this.$contextmenu({
      x: screenPos.x,
      y: screenPos.y,
      items: menuItems,
      zIndex: 100,
      customClass: 'menu-context',
    });
  }
}

</script>