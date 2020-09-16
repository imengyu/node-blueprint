<template>
  <div ref="editorHost" class="editor" :style="{ cursor: (isDragView ? 'grabbing' : (mouseLeftMove ? 'grab' : 'default')) }"
    @dragover="$event.preventDefault()" @drop="onDrop($event)">
    <!--单元连接弹出提示-->
    <div class="common-tip"
      v-show="isConnecting && !isConnectingToNew"
      :style="{ left: (connectingEndPos.x - viewPort.x) + 'px', top:  (connectingEndPos.y - viewPort.y) + 'px' }">
      <span v-if="currentHoverPort==null"><i class="iconfont icon-calendar-1 mr-1"></i>连接至新的单元</span>
      <span v-else-if="connectingCanConnect"><i class="iconfont icon-check- text-success"></i></span>
      <span v-else><i class="iconfont icon-close- text-danger mr-1"></i><span v-html="connectingFailedText"></span></span>
    </div>
    <!--节点提示-->
    <div class="common-tip no-mouse-event"
      v-show="isShowTooltip"
      v-html="showTooltipText"
      :style="{ 
        left: (showTooltipPos.x > 0 ? showTooltipPos.x + 'px': ''), 
        top: (showTooltipPos.y > 0 ? showTooltipPos.y + 'px' : ''),
        right: (showTooltipPos.x < 0 ? -showTooltipPos.x + 'px': ''), 
        bottom: (showTooltipPos.y < 0 ? -showTooltipPos.y + 'px' : '') ,
      }"
    >
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
      @contextmenu="onCanvasContextmenu"
      @late-tick="onLateTick"
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
      @update-set-file-changed="$emit('update-set-file-changed')"
      @show-add-block-panel-view-port-pos="(p) => $emit('show-add-block-panel-at-pos', viewPortPosToWindowPos(p))"
      @show-add-block-panel-at-pos="(p) => $emit('show-add-block-panel-at-pos', p)"
      @clear-add-block-panel-filter="$emit('clear-add-block-panel-filter')"
      @set-add-block-inpos="setAddBlockInpos"
      @on-delete-block="onDeleteBlock"
      @on-mouse-zoom-view="onMouseZoomView"
      @on-editor-key="onEditorKey"
      :toolBarHeight="toolBarHeight"
      :toolBarWidth="toolBarWidth"
      @show-tooltip="onShowTooltip"
      @hide-tooltip="onHideTooltip"
      >
    </BlockEditorWorker>
    <!--剪贴板-->
    <BlockEditorClipBoard 
      ref="editoClipboard"
      @update-clipboard-state="(v) => $emit('update-clipboard-state', v)"
      >
    </BlockEditorClipBoard>
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

import { Vector2 } from "../model/Vector2";
import { Rect } from "../model/Rect";

import BlockEditorCanvasDrawer from "./BlockEditorCanvasDrawer.vue";
import BlockEditorWorker from "./BlockEditorWorker.vue";
import BlockEditorClipBoard from "./BlockEditorClipBoard.vue";
import { BlockPort } from "../model/Define/Port";
import { BlockRunner } from "../model/WorkProvider/Runner";
import { BlockRegData, BlockPortRegData } from "../model/Define/BlockDef";
import { BlockEditorOwner, BlockGraphVariableChangeCallback, BlockPortRegDataMoveCallback, BlockPortRegDataCallback, BlockGraphPortChangeCallback, BlockGraphVariableFullChangeCallback, BlockGraphChangeCallback } from "../model/Editor/BlockEditorOwner";
import { BlockGraphDocunment, BlockDocunment } from "../model/Define/BlockDocunment";
import { BlockEditor } from "../model/Editor/BlockEditor";
import { ConnectorEditor } from "../model/Editor/ConnectorEditor";
import { EditorSettings } from "../model/Editor/EditorSettings";
import { EventHandler } from "../utils/EventHandler";
import { MenuItem } from "../model/Menu";
import CommonUtils from "../utils/CommonUtils";
import HtmlUtils from "../utils/HtmlUtils";
import ToolTipUtils from "../utils/ToolTipUtils";
import { BlockBreakPoint } from "../model/Define/Block";
import BaseBlocks from "../model/Blocks/BaseBlocks";
import BlockServiceInstance from "../sevices/BlockService";


@Component({
  components: {
    'BlockEditorCanvasDrawer': BlockEditorCanvasDrawer,
    'BlockEditorClipBoard': BlockEditorClipBoard,
    'BlockEditorWorker': BlockEditorWorker,
  }
})
export default class BlockDrawer extends Vue {

  currentGraph : BlockGraphDocunment = null;
  currentDocunment : BlockDocunment = null;

  loadedBlocks : Array<BlockEditor> = [];
  loadedConnectors : Array<ConnectorEditor> = [];

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

      //开始绘制
      this.editorCanvas.draw();
    }else {
      this.$Modal.error({
        title: '加载失败',
        content: '目标文档是运行版本，不能被编辑器打开'
      });
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
      this.$Modal.info({
        title: '提示',
        content: '当前文档中已经有 ' + blockData.baseInfo.name + ' 了哦，此单元只能有一个'
      });
      return;
    }
    //自定义检查回调
    if(typeof blockData.callbacks.onAddCheck == 'function') {
      let err = blockData.callbacks.onAddCheck(blockData, this.currentGraph);
      if(err != null) {
        this.$Modal.warning({
          title: '提示',
          content: err
        });
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
      pos.Set(port.editorData.getPosition());
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
    return new Vector2(pos.x - this.viewPort.x, pos.y - this.viewPort.y);
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

  zoomValues = [ 30, 50, 60, 80, 100, 110, 120, 130, 150, 170, 190, 200 ];
  zoomSelectValue = 100;

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

  private onMouseZoomView(e : WheelEvent) {
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
  private onEditorKey(keyCode : number) {
    let controlKeyDown = this.editorWorker.getIsControlKeyDown();
    switch(keyCode) {
      case 67://C
        this.clipboardCopySelect();
        break;
      case 86://V
        this.clipboardPaste();
        break; 
      case 88://X
        this.clipboardCutSelect();
        break; 
      case 83://S
        this.$emit('on-want-save');
        break; 
    }
  }

  private onLateTick() {
    if(this.viewRealSize.w != this.editorHost.offsetWidth || this.viewRealSize.h != this.editorHost.offsetHeight)
      this.onWindowSizeChanged();
  }

  editorHost : HTMLDivElement = null;
  editorWorker : BlockEditorWorker = null;
  editorCanvas : BlockEditorCanvasDrawer = null;
  editoClipboard : BlockEditorClipBoard = null;

  blockOwnerData : BlockEditorOwner = null;

  mounted() {
    setTimeout(() =>{

      window.addEventListener('resize', () => this.onWindowSizeChanged);

      ToolTipUtils.setTooltipProvider({
        showTooltip: (t, v) => this.onShowTooltip(t, v),
        hideTooltip: (id) => this.onHideTooltip(id),
      });

      this.editorWorker = <BlockEditorWorker>this.$refs.editorWorker;
      this.editorCanvas = <BlockEditorCanvasDrawer>this.$refs.editorCanvas;
      this.editoClipboard = <BlockEditorClipBoard>this.$refs.editoClipboard;

      this.editorHost = <HTMLDivElement>this.$refs.editorHost;
      this.editorHost.addEventListener('resize', () => this.onWindowSizeChanged);
      this.toolBarHeight = HtmlUtils.getTop(this.editorHost);
      this.toolBarWidth = HtmlUtils.getLeft(this.editorHost);

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
        getBlockHostElement: this.editorWorker.getBlockHostElement,
        getMultiSelectedBlocks: this.editorWorker.getMultiSelectedBlocks,
        unConnectConnector: this.editorWorker.unConnectConnector,
        showBlockRightMenu: this.showBlockRightMenu,
        deleteBlock: this.editorWorker.deleteBlock,
        chooseType: (p, c) => { this.$emit('choose-custom-type', p, c); },
        openGraph: (g) => { this.$emit('on-open-graph', g); },
        graphVariableChange: {
          onVariableAdd: (g, v) => this.blockOwnerData.editorEvents.onVariableAdd.invoke(g, v),
          onVariableRemove: (g, v) => this.blockOwnerData.editorEvents.onVariableRemove.invoke(g, v),
          onVariableUpdate: (g, n, v) => this.blockOwnerData.editorEvents.onVariableUpdate.invoke(g, n, v),
        },
        graphPortChange: {
          onPortAdd: (g, port) => this.blockOwnerData.editorEvents.onGraphPortAdd.invoke(g, port),
          onPortRemove: (g, port) => this.blockOwnerData.editorEvents.onGraphPortRemove.invoke(g, port),
          onPortUpdate: (g, port) => this.blockOwnerData.editorEvents.onGraphPortUpdate.invoke(g, port),
          onPortMoveUp: (g, port, index) => this.blockOwnerData.editorEvents.onGraphPortMoveUp.invoke(g, port, index),
          onPortMoveDown: (g, port, index) => this.blockOwnerData.editorEvents.onGraphPortMoveDown.invoke(g, port, index),
        },
        graphChange: {
          onVGraphUpdate: (g) => this.blockOwnerData.editorEvents.onGraphUpdate.invoke(g),
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
        getVue: () => this,
        viewPortPosToWindowPos: (v) => this.viewPortPosToWindowPos(v),
      };
      this.$emit('update-block-owner-data', this.blockOwnerData);
      this.onWindowSizeChanged();
      this.recalcViewPort();
    },200);
  }
  beforeDestroy() {
    window.removeEventListener('resize', () => this.onWindowSizeChanged);
    this.editorHost.removeEventListener('resize', () => this.onWindowSizeChanged);
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
          this.editorWorker.addBlock(block, this.editorWorker.getMouseCurrentPosInViewPort());
          break;
        }
        case 'block': {
          this.setAddBlockInpos(this.editorWorker.getMouseCurrentPosInViewPort());
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


  //弹出提示
  //========================

  isShowTooltip = false;
  showTooltipPos = new Vector2();
  showTooltipText = '';
  showTooltipId = 0;

  onShowTooltip(text : string, pos : Vector2) {
    this.isShowTooltip = !CommonUtils.isNullOrEmpty(text);
    if (CommonUtils.isDefinedAndNotNull(pos)) {
      pos.x -= this.toolBarWidth;
      pos.y -= this.toolBarHeight - 30;
      if(pos.x > this.viewRealSize.w - 200) pos.x = -20;
      if(pos.y > this.viewRealSize.h - 50) pos.y = -20;
      this.showTooltipPos = pos;
      this.showTooltipId = CommonUtils.genRandom(0, 1024);
    }
    this.showTooltipText = text;
    return this.showTooltipId;
  }
  onHideTooltip(id : number) {
    if(this.showTooltipId == id)
      this.isShowTooltip = false;
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

      //添加默认端口
      this.editorWorker.addBlock(new BlockEditor(BaseBlocks.getScriptBaseBlockIn()), new Vector2(
        this.viewPort.x + (this.viewPort.w / 2 - 35) - this.viewPort.w / 2.5,
        this.viewPort.y + (this.viewPort.h / 2 - 15)
      ));
      this.editorWorker.addBlock(new BlockEditor(BaseBlocks.getScriptBaseBlockOut()), new Vector2(
        this.viewPort.x + (this.viewPort.w / 2 - 35) + this.viewPort.w / 2.5,
        this.viewPort.y + (this.viewPort.h / 2 - 15)
      ));
    }, 200);
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
    }, 200);
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

    this.editoClipboard.clearClipboard();
    this.editoClipboard.writeToClipboard(selectedBlock, allConnectors, this.editorWorker.calcBlocksRegion(selectedBlock).calcCenter());
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
        y: targetPos.x - refPos.y,
      };

      let oldBlocks = [];
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

  public redo() { 

  }
  public undo() { 

  }
  
  //右键菜单
  //=======================

  onCanvasContextmenu() {
    let selectedConnectors = this.editorWorker.getSelectedConnectors();
    let mousePos = this.editorWorker.getMouseCurrentPos();
    if(selectedConnectors.length > 0) 
      this.showConnectorRightMenu(mousePos);
    return false;
  }

  showConnectorRightMenu(screenPos : Vector2) {
    let selectedCount = this.editorWorker.getSelecteBlockCount();
    this.$contextmenu({
      x: screenPos.x,
      y: screenPos.y,
      items: [
        { label: "断开连接", onClick: () => this.editorWorker.unconnectSelectedConnectors() },
        { label: "拉直", onClick: () => {} },
      ],
      zIndex: 100,
      customClass: 'menu-context',
    });
  }
  showBlockRightMenu(screenPos : Vector2) {
    let selectedCount = this.editorWorker.getSelecteBlockCount();
    let selectedBlocks = this.editorWorker.getSelectedBlocks();
    let menuItems = (selectedCount == 1 ? selectedBlocks[0].blockMenuSettings.items : []).concat(
      <MenuItem[]>[
        { label: "删除", onClick: () => this.deleteSelectedBlocks(), divided: true },
        { label: "剪切", onClick: () => this.clipboardCutSelect() },
        { label: "复制", onClick: () => this.clipboardCopySelect() },
        { label: "粘贴", disabled: !this.editoClipboard.getBlocksClipboardState(), 
          onClick: () => this.clipboardPaste(this.editorWorker.getMouseCurrentPosInViewPort()),
          divided: true },
        { label: "刷新节点", onClick: () => this.editorWorker.refreshSelectedBlock() },
        { label: "断开连接", onClick: () => this.editorWorker.unConnectSelectedBlock(), divided: true },
        { label: "对齐", disabled: selectedCount < 2, children: [
          { label: "左对齐", onClick: () => this.editorWorker.alignSelectedBlock('left') },
          { label: "上对齐", onClick: () => this.editorWorker.alignSelectedBlock('top') },
          { label: "右对齐", onClick: () => this.editorWorker.alignSelectedBlock('right') },
          { label: "下对齐", onClick: () => this.editorWorker.alignSelectedBlock('bottom') },
        ] },
        { label: "断点", children: [
          { label: "无", onClick: () => this.editorWorker.setSelectedBlockBreakpointState('none') },
          { label: "启用", onClick: () => this.editorWorker.setSelectedBlockBreakpointState('enable') },
          { label: "禁用", onClick: () => this.editorWorker.setSelectedBlockBreakpointState('disable') },
        ] },
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
}



</script>