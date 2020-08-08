<template>
  <div>
    <!--菜单栏-->
    <MenuBar :menus="menuMain" />
    <!--工具栏-->
    <div class="toolbar">

      <div :class="'button icon'+(mouseLeftMove?'':' active')" title="鼠标用来选择组件" @click="mouseLeftMove=false"><i class="iconfont icon-yidong_huaban1"></i></div>
      <div :class="'button icon'+(mouseLeftMove?' active':'')" title="鼠标用来移动视图" @click="mouseLeftMove=true"><i class="iconfont icon-shou"></i></div>
      <div class="separator"></div>
      
      <div class="button icon" title="添加单元" @click="showAddBlockPanelBar($event.currentTarget)"><i class="iconfont icon-pluss-2"></i></div>
      <div class="button icon" title="删除选中" :disabled="selectedBlocks.length==0&&selectedConnectors.length==0" 
        @click="showDeleteModalClick()"><i class="iconfont icon-trash"></i></div>

      <div class="separator"></div>

      <div v-if="runningState=='editing'||runningState=='runningPaused'" class="button icon green" 
        :title="runningState=='runningPaused'?'继续运行':'开始调试'" @click="startRun">
        <i class="iconfont icon-play"></i>
      </div>
      <div v-if="runningState=='editing'" class="button icon blue" title="开始单步调试" @click="startRunAndStepNext">
        <i class="iconfont icon-play-next"></i>
      </div>
      <div v-if="runningState=='runningPaused'" class="button icon green" title="运行下一步" @click="stepNext">
        <i class="iconfont icon-play-next"></i>
      </div>
      <div v-if="runningState=='running'" class="button icon yellow" title="暂停调试" @click="pauseRun">
        <i class="iconfont icon-pause"></i>
      </div>
      <div v-if="runningState=='running'||runningState=='runningPaused'" class="button icon red" title="停止调试" @click="stopRun">
        <i class="iconfont icon-close-2"></i>
      </div>

      <div class="separator"></div>

      <div class="button icon" title="打开控制台" @click="openConsole"><i class="iconfont icon-terminal"></i></div>
    
    </div>
    <!--添加单元弹出窗口-->
    <AddPanel v-show="showAddBlockPanel" 
      ref="AddBlockPanel"
      :show="showAddBlockPanel"
      :allBlocksGrouped="allBlocksGrouped" 
      :showPos="showAddBlockPanelPos"
      :style="{ maxHeight: showAddBlockPanelMaxHeight + 'px' }"
      :filterByParamPort="filterByParamPort" 
      :filterByPort="filterByPort" 
      :filterByParamPortType="filterByParamPortType" 
      :filterByParamPortCustomType="filterByParamPortCustomType" 
      @onBlockItemClick="onBlockAddItemClick"
      @onClose="showAddBlockPanel=false" />
    
    <!--单元连接弹出提示-->
    <div class="common-tip"
      v-show="isConnecting && !isConnectingToNew"
      :style="{ left: (connectingEndPos.x - viewPort.x) + 'px', top:  (connectingEndPos.y - viewPort.y) + 'px' }">
      <span v-if="currentHoverPort==null"><i class="iconfont icon-calendar-1"></i>连接至新的单元</span>
      <span v-else-if="connectingCanConnect"><i class="iconfont icon-check- text-success"></i></span>
      <span v-else><i class="iconfont icon-close- text-error"></i>{{connectingFailedText}}</span>
    </div>
    <!--主编辑器-->
    <div class="main">
      <Split v-model="splitOff">
        <!--流图编辑器-->
        <div slot="left" id="editorHost" class="editor" :style="{ 
          cursor: (isDragView ? 'grabbing' : (mouseLeftMove ? 'grab' : 'default'))
        }">
          <canvas id="editor" oncontextmenu="return false">
            你的浏览器不支持 canvas，请升级你的浏览器
          </canvas>
          <div id="blockHost" class="flow-block-host" :style="{ 
            left: -viewPort.x + 'px', top: -viewPort.y + 'px' ,
            userSelect: (isMultiSelecting ? 'none' : 'unset'),
            transform: 'scale(' + viewZoom + ')'
          }">
          </div>
          <div class="zoom_tool">
            <a href="javascript:;" class="left iconfont icon-zoom-out" title="缩小" @click="zoomOut"></a>
            <select v-model="viewZoom" @change="zoomUpdate()">
              <option v-for="(v, i) in zoomValues" :key="i" :value="v/100">{{v}}%</option>
            </select>
            <span>{{viewScale}}%</span>
            <a href="javascript:;" class="right iconfont icon-zoom" title="放大" @click="zoomIn"></a>
          </div>
        </div>
        <!--属性栏-->
        <div slot="right" class="prop">
          <BlockProp v-if="!isMultiSelecting && !isMultiSelected && selectedBlocks.length==1" :block="selectedBlocks[0]">
          </BlockProp>
          <div v-else-if="!isMultiSelecting && !isMultiSelected && selectedConnectors.length==1">
            <div class="prop-item">
              <span>startPort: </span>
              <div class="text-warp">
                {{ selectedConnectors[0].startPort.name + '  GUID (' + 
                selectedConnectors[0].startPort.parent.guid + '-' + selectedConnectors[0].startPort.guid + ')' }}
              </div>
            </div>
            <div class="prop-item">
              <span>endPort: </span>
              <div class="text-warp">
                {{ selectedConnectors[0].endPort.name + '  GUID (' + 
                  selectedConnectors[0].endPort.parent.guid + '-' + selectedConnectors[0].endPort.guid + ')' }}
              </div>
            </div>
          </div>
        </div>
      </Split>
    </div>
    <!--对话框-->
    <Modal v-model="showDeleteModal" width="360">
      <p slot="header" style="color:#f60;text-align:center">
        <Icon type="ios-information-circle"></Icon>
        <span>确定删除选中</span>
      </p>
      <div style="text-align:center">
        你真的要删除选中的
        <span v-if="selectedBlocks.length>0"> {{ selectedBlocks.length }} 个单元</span>
        <span v-if="selectedConnectors.length>0">{{ selectedConnectors.length }} 个连接</span>
        吗？
      </div>
      <div slot="footer">
        <Button type="error" size="large" @click="deleteSelectedBlocks();showDeleteModal=false;">删除</Button>
        <Button size="large" @click="showDeleteModal=false">取消</Button>
      </div>
    </Modal>
    <Modal v-model="showDropChangesModal" width="360">
      <p slot="header" style="color:#f60;text-align:center">
        <Icon type="ios-information-circle"></Icon>
        <span>文件保存提示</span>
      </p>
      <div style="text-align:center">
        你希望丢弃当前文档的更改吗？<br>
        注意，未保存的更改将丢失！
      </div>
      <div slot="footer">
        <Button size="large" @click="showDropChangesModal=false">取消</Button>
        <Button type="error" size="large" @click="doNewFile();showDropChangesModal=false;">丢弃更改</Button>
      </div>
    </Modal>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State } from 'vuex-class'
import { Block } from '../model/Block'
import { Vector2 } from "../model/Vector2";
import { Rect } from "../model/Rect";
import { BlockRegData, BlockParameterTypeRegData, BlockParameterEnumRegData } from "../model/BlockDef";
import { EditorInterface, EditorRunningState } from "../model/Editor";
import { BlockPort, BlockParameterPort } from "../model/Port";
import { ConnectorEditor } from "../model/Connector";
import { EditorFileParser } from "../model/EditorFileParser";

import BaseBlocks from "../model/Blocks/BaseBlocks";
import CanvasUtils from "../utils/CanvasUtils";
import CommonUtils from "../utils/CommonUtils";
import BlockCategory from "../components/BlockCategory.vue";
import BlockProp from "../components/BlockProp.vue";
import AddPanel from "../components/AddPanel.vue";
import BlockServiceInstance from "../sevices/BlockService";
import ParamTypeServiceInstance from "../sevices/ParamTypeService";
import DebugWorkProviderInstance from "../model/WorkProvider/DebugWorkProvider";
import SettingsServiceInstance from "../sevices/SettingsService";
import { BlockEditor } from "../model/BlockEditor";
import { BlockBehaviorPort, BlockPortType, BlockParameteType, BlockPortDirection } from "../model/Port";
import { BlockRunner, BlockRunLoopData } from "../model/Runner";
import MenuBar, { MenuData, MenuSeparator } from "../components/MenuBar.vue";

@Component({
  components: {
    'BlockCategory': BlockCategory,
    'AddPanel': AddPanel,
    'MenuBar': MenuBar,
    'BlockProp': BlockProp,
  }
})
export default class Editor extends Vue implements EditorInterface {
  name = "App";

  toolBarHeight = 30;
  toolBarWidth = 45;

  splitOff = 0.8;

  menuMain : Array<MenuData> = [];

  initMenu() {
    this.menuMain = [
      new MenuData('文件', [
        new MenuData('新建文件', () => this.newFile()),
        new MenuData('打开...', () => this.loadFile()),
        new MenuData('保存... ', () => this.saveFile(), 'Ctrl+S'),
        new MenuData('导出JSON', () => this.newFile()),
      ]),
      new MenuData('编辑', [
        new MenuData('撤销', () => {}, 'Ctrl+Z'),
        new MenuData('重做', () => {}, 'Ctrl+Y'),
        new MenuSeparator(),
        new MenuData('剪切', () => {}, 'Ctrl+X'),
        new MenuData('复制', () => {}, 'Ctrl+C'),
        new MenuData('粘贴', () => {}, 'Ctrl+V'),
        new MenuData('重复', () => {}, 'Ctrl+D'),
        new MenuData('删除', () => {}, 'Delete'),
      ]),
      new MenuData('视图', [
        new MenuData('显示网格', (menu) => {
          this.gridShow = !this.gridShow;
          menu.checked = this.gridShow;
        }, '', this.gridShow, true),
        new MenuSeparator(),
        new MenuData('放大', () => this.zoomIn()),
        new MenuData('100%', () => { this.viewZoom = 1; this.zoomUpdate() }),
        new MenuData('缩小', () => this.zoomOut()),
        new MenuSeparator(),
        new MenuData('绘制调试信息', (menu) => {
          this.drawDebugInfo = !this.drawDebugInfo;
          menu.checked = this.drawDebugInfo;
        }, '', this.drawDebugInfo, true),
        new MenuData('切换开发者工具', () => {})
      ]),
    ];
  }

  @Watch('splitOff') 
  onSplitOffChanged() {
    this.onWindowSizeChanged();
  }
  @Watch('showAddBlockPanel') 
  onShowAddBlockPanelChanged(newV) {
    if(!newV && this.isConnectingToNew) this.endConnectToNew();
  }

  /**
   * 元素控制
   */



  editor : HTMLCanvasElement = null;
  editorHost : HTMLDivElement = null;
  ctx : CanvasRenderingContext2D = null;
  blockHost : HTMLDivElement = null;

  public getVue() : Vue { return this; }
  public getToolBarHeight() { return this.toolBarHeight; }
  public getToolBarWidth() { return this.toolBarWidth; }
  public getBlockHostElement() { return this.blockHost; }

  /**
   * 视口控制
   */

  viewRealSize = {
    w: 0,
    h: 0
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

  /**
   * 缩放控制
   */

  public zoomIn() {
    if(this.viewScale <= 190) this.zoomUpdate(this.viewScale + 10);
    else this.zoomUpdate(200);
  }
  public zoomOut() {
    if(this.viewScale >= 40) this.zoomUpdate(this.viewScale - 10);
    else this.zoomUpdate(30);
  }
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


  /**
   * 绘制控制
   */

  drawId = 0;
  drawDebugInfo = true;

  public drawStop() {
    cancelAnimationFrame(this.drawId);
  }
  public draw() {

    this.ctx.fillStyle = "rgb(93,93,93)";
	  this.ctx.clearRect(0, 0, this.viewRealSize.w, this.viewRealSize.h);

    if(this.gridShow) 
      this.drawGrid();
    this.drawConnectors();
    this.drawMultiSelBox();

    //Debug text
    if(this.drawDebugInfo){
      this.ctx.fillStyle = "#fff";
      this.ctx.strokeStyle = "#fff";
      
      this.ctx.fillText("fps : " + this.calculateFps().toFixed(2), 30, 20);
      this.ctx.fillText("viewPort : " + this.viewPort.x.toFixed(2) + " , " + this.viewPort.y.toFixed(2) + ' , ' + this.viewPort.w.toFixed(2) + " , " + this.viewPort.h.toFixed(2), 30, 40);
      this.ctx.fillText("mouseDownPos : " + this.mouseDownPos.x.toFixed(2) + " , " + this.mouseDownPos.y.toFixed(2), 30, 50);
      this.ctx.fillText("mouseDownPosInViewPort : " + this.mouseDownPosInViewPort.x.toFixed(2) + " , " + this.mouseDownPosInViewPort.y.toFixed(2), 30, 65);
      this.ctx.fillText("mouseCurrentPosInViewPort : " + this.mouseCurrentPosInViewPort.x.toFixed(2) + " , " + this.mouseCurrentPosInViewPort.y.toFixed(2), 30, 75);
      this.ctx.fillText("multiSelectRect : " + this.multiSelectRect.x + " , " + this.multiSelectRect.y +" , "+ this.multiSelectRect.w + " , " + this.multiSelectRect.h, 30, 90);
      this.ctx.fillText("isConnecting : " + this.isConnecting + " connectingEndPos: " + this.connectingEndPos.x +" , "+ this.connectingEndPos.y, 30, 100);
      this.ctx.fillText("isMultiSelecting : " + this.isMultiSelecting + " isMultiSelected: " + this.isMultiSelected, 30, 110);

      /*
      this.ctx.strokeStyle = "#f00";
      this.ctx.beginPath();
      this.ctx.moveTo(0, this.editor.height / 2);
      this.ctx.lineTo(this.editor.width, this.editor.height / 2);
      this.ctx.closePath();
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(this.editor.width / 2, 0);
      this.ctx.lineTo(this.editor.width / 2, this.editor.height);
      this.ctx.closePath();
      this.ctx.stroke();
        
      let center = this.viewPort.calcCenter();
      this.ctx.fillText("center : " + center.x + ' , ' + center.y, 30, 60);
      */
    }

    this.drawId = requestAnimationFrame(this.draw);
  }

  lastTime = 0;

  calculateFps() {
      var now = (+new Date),
          fps = 1000/(now - this.lastTime);
      this.lastTime = now;
      return fps;
  }

  gridShow = true;
  gridSize = 20;

  private drawGrid() {
    
    let showGridSize = this.viewZoom * this.gridSize;
    let gridOffx = this.viewPort.x % showGridSize;
    let gridOffy = this.viewPort.y % showGridSize;
    let count = 0;

    this.ctx.lineWidth = 0.5;
    this.ctx.strokeStyle = "rgb(52,52,52)";

    count = Math.floor(this.viewPort.x / showGridSize) ;

    for(let i = -gridOffx,
        end = i + this.viewRealSize.w; i <= end;i += showGridSize) {

      count++;

      if(count % 5 == 0) this.ctx.strokeStyle = "rgb(22,22,22)";
      else if(this.viewScale < 70) continue;
      else this.ctx.strokeStyle = "rgb(52,52,52)";

      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.viewRealSize.h);
      this.ctx.closePath();
      this.ctx.stroke();


    }
    count = Math.floor(this.viewPort.y / showGridSize);

    this.ctx.strokeStyle = "rgb(52,52,52)";

    for(let i = -gridOffy, end = i + this.viewRealSize.h; i <= end;i += showGridSize) {

      count++; 

      if(count % 5 == 0) this.ctx.strokeStyle = "rgb(22,22,22)";
      else if(this.viewScale < 70) continue;
      else this.ctx.strokeStyle = "rgb(52,52,52)";

      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.viewRealSize.w, i);
      this.ctx.closePath();
      this.ctx.stroke();      
    }

  }
  private drawMultiSelBox() {
    if(this.isMultiSelecting) {
      this.ctx.fillStyle = "rgba(36, 114, 200, 0.4)";
      this.ctx.fillRect(this.mouseDownPos.x, this.mouseDownPos.y, 
          this.mouseCurrentPos.x - this.mouseDownPos.x, this.mouseCurrentPos.y - this.mouseDownPos.y);
      this.ctx.strokeStyle = "rgba(79, 184, 254)";
      this.ctx.strokeRect(this.mouseDownPos.x, this.mouseDownPos.y, 
          this.mouseCurrentPos.x - this.mouseDownPos.x, this.mouseCurrentPos.y - this.mouseDownPos.y)
    }
  }
  private drawConnectors() {
    this.ctx.strokeStyle = "#000";
    this.ctx.lineWidth = 1.5;

    this.connectors.forEach(element => {
      element.drawPos = this.drawDebugInfo;
      element.draw(this.ctx, this.viewPort, this.viewZoom);
    });

    if(this.isConnecting) {
      if(this.connectingIsFail) this.ctx.strokeStyle = "#e9412a";
      else this.ctx.strokeStyle = "#efefef";

      this.connectingConnector.startPort = this.connectingStartPort;
      if(this.connectingStartPort.direction == 'input') 
        this.connectingConnector.drawLineInPos(this.ctx, this.viewPort, this.viewZoom, this.connectingEndPos, this.connectingStartPort.editorData.getPosition());
      else if(this.connectingStartPort.direction == 'output')
        this.connectingConnector.drawLineInPos(this.ctx, this.viewPort, this.viewZoom, this.connectingStartPort.editorData.getPosition(), this.connectingEndPos);
      
    }
  }


  // 单元管理
  //======================= 

  public allBlocksGrouped = [];
  public addBlockInPos : Vector2 = new Vector2();
  public isAddBlockInPos = false;

  onBlockAddItemClick(block : BlockRegData) {
    this.showAddBlockPanel = false;

    //检查单元是否只能有一个
    if(block.settings.oneBlockOnly) {
      if(this.getBlocksByGUID(block.guid).length > 0) {
        this.$Modal.info({
          title: '提示',
          content: '当前文档中已经有 ' + block.baseInfo.name + ' 了哦，此单元只能有一个'
        });
        return;
      }
    }

    let newBlock = new BlockEditor(this, block);
    if(this.isAddBlockInPos) { //在指定位置添加单元
      
      this.addBlockInPos.x -= newBlock.size.x / 2;
      this.addBlockInPos.y -= newBlock.size.y / 2;
      this.isAddBlockInPos = false;
      this.addBlock(newBlock, this.addBlockInPos)
    } else if(this.isConnectingToNew) { //添加单元并连接

      this.addBlock(newBlock, this.connectingEndPos);

      let port = this.endConnectToNew(newBlock);
      let pos = new Vector2();
      pos.Set(port.editorData.getPosition());
      pos.x = this.connectingEndPos.x - (pos.x - newBlock.position.x);
      pos.y = this.connectingEndPos.y - (pos.y - newBlock.position.y);

      newBlock.setPos(pos);
    } else { //在屏幕中央位置添加单元
      let center = this.viewPort.calcCenter();

      center.x -= newBlock.size.x / 2;
      center.y -= newBlock.size.y / 2;

      this.addBlock(newBlock, center);
    }
  }

  //添加单元弹出

  showAddBlockPanelPos = new Vector2();
  showAddBlockPanel = false;
  showAddBlockPanelMaxHeight = 500;

  filterByPort : BlockPortDirection= null;
  filterByParamPort : BlockPortDirection= null;
  filterByParamPortType : BlockParameteType = null;
  filterByParamPortCustomType : string = '';

  clearAddBlockPanelFilter() {
    this.filterByPort = null;
    this.filterByParamPort = null;
    this.filterByParamPortType = null;
    this.filterByParamPortCustomType = null;
    (<AddPanel>this.$refs.AddBlockPanel).clearFilter();
  }
  addBlockPanelDoFilter() {
    setTimeout(() => (<AddPanel>this.$refs.AddBlockPanel).doFilter(), 150);
  }
  public showAddBlockPanelAt(pos : Vector2) {
    this.showAddBlockPanelPos = pos;
    this.showAddBlockPanel = true;
    this.showAddBlockPanelMaxHeight = this.viewPort.h - pos.y;
    if(this.showAddBlockPanelMaxHeight > 500) this.showAddBlockPanelMaxHeight = 500;
    else if(this.showAddBlockPanelMaxHeight < 222) {
      this.showAddBlockPanelPos.y -= 222 - this.showAddBlockPanelMaxHeight;
      this.showAddBlockPanelMaxHeight = 222;
    }
    (<AddPanel>this.$refs.AddBlockPanel).focus();
  }
  showAddBlockPanelBar(e : HTMLElement) {
    this.clearAddBlockPanelFilter();
    
    if(this.showAddBlockPanel) this.showAddBlockPanel = false;
    else this.showAddBlockPanelAt(new Vector2(
      e.offsetLeft + this.toolBarWidth,
      e.offsetTop + this.toolBarHeight + 3
    ));
  }

  //删除疑问对话框

  showDeleteModal = false;

  showDeleteModalClick() {
    if(this.selectedBlocks.length > 0 || this.selectedConnectors.length > 0)
      this.showDeleteModal = true;
  }
  deleteSelectedBlocks() {
    this.selectedBlocks.forEach((block) => this.deleteBlock(block));
    this.selectedConnectors.forEach((connector) => this.unConnectConnector(connector));
    this.showDeleteModal = false;
  }


  blocks : Array<BlockEditor> = [];
  connectors : Array<ConnectorEditor> = [];

  public clearAll() {
    for(let i = this.blocks.length - 1; i >= 0; i--)
      this.deleteBlock(this.blocks[i], false);

    this.blocks = [];
    this.connectors = [];
  }

  public getBlocks() { return this.blocks;}
  public getConnectors() { return this.connectors;}
  public getBlocksByGUID(guid : string) { 
    let arr = [];
    this.blocks.forEach(element => {
      if(element.guid==guid)
        arr.push(element);
    });
    return arr;
  }
  public getOneBlockByGUID(guid : string) { 
    for (let index = 0; index < this.blocks.length; index++) {
      if(this.blocks[index].guid==guid)
        return this.blocks[index];
    }
    return null;
  }

  // 逻辑控制
  //=======================

  isMultiSelecting = false;
  isMoveBlock = false;
  isDragView = false;

  isMultiSelected = false;
  isMoveedBlock = false;

  // 鼠标逻辑控制
  //=======================

  selectedBlocks : Array<BlockEditor> = [];
  selectedConnectors : Array<ConnectorEditor> = [];
  multiSelectedBlocks : Array<BlockEditor> = [];

  multiSelectRect = new Rect();
  mouseLeftMove = false;

  mouseDowned = false;
  mouseDownPos : Vector2 = new Vector2();
  mouseDownPosInViewPort : Vector2 = new Vector2();
  mouseDownViewPortPos : Vector2 = new Vector2();
  mouseDownBlockPos : Vector2 = new Vector2();
  mouseCurrentPos : Vector2 = new Vector2();
  mouseCurrentPosInViewPort : Vector2 = new Vector2();

  public getMultiSelectedBlocks()  { 
    return this.multiSelectedBlocks; 
  }
  /**
   * 获取选中的单元
   */
  public getSelectedBlocks()  { 
    return this.selectedBlocks; 
  }
  /**
   * 取消选中所有单元
   */
  public unSelectAllBlocks() {
    for(var i=0;i<this.blocks.length;i++) 
      this.blocks[i].updateSelectStatus(false);
    this.selectedBlocks.splice(0, this.selectedBlocks.length);
  }
  /**
   * 取消选中所有链接
   */
  public unSelectAllConnectors() {
    for(let i = 0, c= this.connectors.length;i<c;i++) 
      this.connectors[i].selected = false;
     this.selectedConnectors = [];
  }

  private selectOneConnector() {
    for(let i = 0, c = this.connectors.length;i<c;i++) {
      if(this.connectors[i].hover){
        this.connectors[i].selected = true;
        if(!this.selectedConnectors.contains(this.connectors[i]))
          this.selectedConnectors.push(this.connectors[i]);
        break;
      }
    }
  }
  private testCastConnector() {
    for(let i = 0, c= this.connectors.length;i<c;i++)
      this.connectors[i].hover = (this.connectors[i].testInRect(this.mouseCurrentPosInViewPort, this.viewZoom));
  }
  private updateMousePos(e : MouseEvent) {
    this.mouseCurrentPos.x = e.x - this.toolBarWidth;
    this.mouseCurrentPos.y = e.y - this.toolBarHeight;
    this.mouseCurrentPosInViewPort.x = this.viewPort.x + e.x - this.toolBarWidth;
    this.mouseCurrentPosInViewPort.y = this.viewPort.y + e.y - this.toolBarHeight;
  }

  //单元控制事件

  public onUserSelectBlock(block : BlockEditor) {
    if(this.selectedBlocks.length > 0)
      for(var i=0;i<this.blocks.length;i++) 
        if(this.blocks[i] != block)
          this.blocks[i].updateSelectStatus(false);
    this.selectedBlocks.splice(0, this.selectedBlocks.length);
    this.selectedBlocks.push(block);
    block.updateLastPos();
  }
  public onMoveBlock(block : BlockEditor, moveOffest : Vector2) {
    if(this.selectedBlocks.length > 0) {
      this.selectedBlocks.forEach(element => {
        if(element!=block) {
          element.setPos(new Vector2(
            element.getLastPos().x + moveOffest.x,
            element.getLastPos().y + moveOffest.y
          ));
        }
      });
    }
  }
  public onMoveBlockEnd(block : BlockEditor) {
    if(this.selectedBlocks.length > 0) {
      this.selectedBlocks.forEach(element => {
        element.updateLastPos();
      });
    }
  }
  public onBlockDelete(block : BlockEditor) {
    if(this.selectedBlocks.contains(block)) 
      this.selectedBlocks.remove(block);
    block.allPorts.forEach((p) => p.unconnectAllConnector());
  }

  //链接控制事件

  private isConnecting = false;
  private isConnectingToNew = false;

  private connectingConnector = new ConnectorEditor();

  private connectingIsFail = false;
  private connectingStartPort : BlockPort = null;
  private connectingEndPos : Vector2 = new Vector2();
  private connectingCanConnect = false;
  private connectingFailedText = '不能连接';

  private connectingOtherSideRequireType : BlockPortType = 'Behavior';
  private connectingOtherSideRequireDirection : BlockPortDirection = null;
  private connectingOtherSideRequireParamType : BlockParameteType = null;
  private connectingOtherSideRequireParamCustomType : string = null;

  private currentHoverPort : BlockPort = null;

  /**
   * 连接两个端口
   */
  public connectConnector(startPort : BlockPort, endPort : BlockPort) : ConnectorEditor {
    
    //新建链接
    let connector : ConnectorEditor = null;

    //根据方向链接节点
    if(startPort.direction == 'output') {

      //如果已经链接上了，取消链接
      let connData = endPort.isConnectByPort(startPort);
      if(connData != null) {
        this.unConnectConnector(<ConnectorEditor>connData.connector);   
        this.isConnecting = false;
        startPort = null;
        return null;
      }

      connector = new ConnectorEditor();

      //如果是行为端口，只能输出一条线路。取消连接之前的线路
      if(startPort.type == 'Behavior' && startPort.connectedToPort.length >= 0)
        startPort.connectedToPort.forEach((d) => this.unConnectConnector(<ConnectorEditor>d.connector));
      //如果是参数端口，只能输入一条线路。取消连接之前的线路
      if(startPort.type == 'Parameter' && endPort.connectedFromPort.length >= 0) 
        endPort.connectedFromPort.forEach((d) => this.unConnectConnector(<ConnectorEditor>d.connector));

      startPort.connectedToPort.push({
        port: endPort,
        connector: connector
      });
      startPort.editorData.updatePortConnectStatusElement();
      endPort.connectedFromPort.push({
        port: startPort,
        connector: connector
      });
      endPort.editorData.updatePortConnectStatusElement();

      connector.startPort = startPort;
      connector.endPort = endPort;
    }else if(endPort.direction == 'output') {
  
      //如果已经链接上了，取消链接
      let connData = startPort.isConnectByPort(endPort);
      if(connData != null) {
        this.unConnectConnector(<ConnectorEditor>connData.connector);   
        this.isConnecting = false;
        startPort = null;
        return null;
      }

      connector = new ConnectorEditor();

      //如果是行为端口，只能输出一条线路。
      if(endPort.type == 'Behavior' && endPort.connectedToPort.length > 0) 
        endPort.connectedToPort.forEach((d) => this.unConnectConnector(<ConnectorEditor>d.connector));
      //如果是参数端口，只能输入一条线路。
      if(startPort.type == 'Parameter' && startPort.connectedFromPort.length > 0) 
        startPort.connectedFromPort.forEach((d) => this.unConnectConnector(<ConnectorEditor>d.connector));

      endPort.connectedToPort.push({
        port: startPort,
        connector: connector
      });
      endPort.editorData.updatePortConnectStatusElement();
      startPort.connectedFromPort.push({
        port: endPort,
        connector: connector
      });
      startPort.editorData.updatePortConnectStatusElement();

      connector.startPort = endPort;
      connector.endPort = startPort;
    }

    //添加线段
    if(connector != null) {
      connector.currentRunner = this.runner;
      this.connectors.push(connector);
    }
    
    return connector;
  }
  /**
   * 断开链接
   * @param connector 目标链接
   */
  public unConnectConnector(connector : ConnectorEditor) {
    this.connectors.remove(connector);
    this.selectedConnectors.remove(connector);
        
    connector.startPort.removeConnectToPort(connector.endPort);
    connector.startPort.editorData.updatePortConnectStatusElement();
    connector.endPort.removeConnectByPort(connector.startPort);
    connector.endPort.editorData.updatePortConnectStatusElement();

    this.setFileChanged();
  }
  public getCanConnect() { 
    return this.connectingCanConnect; 
  }
  public endConnectToNew(block ?: BlockEditor) : BlockPort {
    let port : BlockPort = null;
    if(typeof block != 'undefined') {
      if(this.connectingOtherSideRequireType == 'Behavior') 
        port = block.getOnePortByDirection(this.connectingOtherSideRequireDirection);
      else if(this.connectingOtherSideRequireType == 'Parameter') 
        port = block.getOneParamPortByDirectionAndType(this.connectingOtherSideRequireDirection,
          this.connectingOtherSideRequireParamType, this.connectingOtherSideRequireParamCustomType);

      if(port != null)
        this.connectConnector(this.connectingStartPort, port);
    }

    this.isConnectingToNew = false;
    this.isConnecting = false;
    this.connectingStartPort = null;

    return port;
  }
  public startConnect(port : BlockPort) {
    this.connectingStartPort = port;
    this.connectingStartPort.editorData.forceDotActiveState = true;
    this.connectingStartPort.editorData.updatePortConnectStatusElement();
    this.isConnecting = true;

    this.connectingOtherSideRequireType = port.type;
    this.connectingOtherSideRequireDirection = port.direction == 'input' ? 'output' : 'input';
    if(port.type == 'Parameter') {
      this.connectingOtherSideRequireParamType = (<BlockParameterPort>port).paramType;
      this.connectingOtherSideRequireParamCustomType = (<BlockParameterPort>port).paramCustomType;
    }else {
      this.connectingOtherSideRequireParamType = null;
      this.connectingOtherSideRequireParamCustomType = null;
    }
  }
  public endConnect(port : BlockPort) {

    //连接到新的节点
    if(this.currentHoverPort == null && this.connectingStartPort != null) {

      this.filterByPort = this.connectingOtherSideRequireType == 'Behavior' ? this.connectingOtherSideRequireDirection : null;
      this.filterByParamPort = this.connectingOtherSideRequireType == 'Parameter' ? this.connectingOtherSideRequireDirection : null;
      this.filterByParamPortType = this.connectingOtherSideRequireParamType;
      this.filterByParamPortCustomType = this.connectingOtherSideRequireParamCustomType;
      this.addBlockPanelDoFilter();
      this.showAddBlockPanelAt(this.viewPortPosToWindowPos(this.connectingEndPos));
      this.isConnectingToNew = true;
      return;
    }
    
    //检查
    if(this.connectingCanConnect && this.currentHoverPort != null && this.connectingStartPort != null) {
      this.connectConnector(this.connectingStartPort, this.currentHoverPort);
      this.connectingStartPort = null;
    }

    this.isConnecting = false;
    
    if(this.connectingStartPort != null) {
      this.connectingStartPort.editorData.forceDotActiveState = false;
      this.connectingStartPort.editorData.forceDotErrorState = false;
      this.connectingStartPort.editorData.updatePortConnectStatusElement();
      this.connectingStartPort = null;
    }

    this.setFileChanged();
  }
  public updateConnectEnd(posDocunment : Vector2) { 
    if(!this.isConnectingToNew)
      this.connectingEndPos.Set(posDocunment.x + this.viewPort.x - this.toolBarWidth, 
      posDocunment.y + this.viewPort.y - this.toolBarHeight); 
  }
  public updateCurrentHoverPortLeave(port : BlockPort) {
    if(this.currentHoverPort == port) {
      if(port != this.connectingStartPort) {
        this.currentHoverPort.editorData.forceDotErrorState = false;
        this.currentHoverPort.editorData.forceDotActiveState = false;
        this.currentHoverPort.editorData.updatePortConnectStatusElement();
      }
      this.connectingIsFail = false;
      this.currentHoverPort = null;
    }
  }
  public updateCurrentHoverPort(port : BlockPort) {
    if(port == this.connectingStartPort && port != null) {
      return;
    }

    if(this.currentHoverPort != null) {
      this.currentHoverPort.editorData.forceDotErrorState = false;
      this.currentHoverPort.editorData.forceDotActiveState = false;
      this.currentHoverPort.editorData.updatePortConnectStatusElement();
    }
    this.currentHoverPort = port;

    if(this.connectingStartPort == null){
      this.connectingIsFail = false;
      return;
    }

    //类型检查
    if(this.currentHoverPort.parent == this.connectingStartPort.parent){
      this.connectingCanConnect = false;
      this.connectingFailedText = '不能连接同一个单元的节点';
    }else if(this.currentHoverPort.type == this.connectingStartPort.type) {
      //方向必须不同才能链接
      this.connectingCanConnect = this.currentHoverPort.direction != this.connectingStartPort.direction;
      if(!this.connectingCanConnect) 
        this.connectingFailedText = '不能连接相同方向的节点';

      //参数类型检查
      if(this.connectingCanConnect) {
        if(this.currentHoverPort.type == 'Parameter') {
          if(this.currentHoverPort.direction == 'input')
            this.connectingCanConnect = (<BlockParameterPort>this.currentHoverPort).checkParameterAllow(<BlockParameterPort>this.connectingStartPort); 
          else if(this.connectingStartPort.direction == 'input') 
            this.connectingCanConnect = (<BlockParameterPort>this.connectingStartPort).checkParameterAllow(<BlockParameterPort>this.currentHoverPort);

          if(!this.connectingCanConnect) 
            this.connectingFailedText = (<BlockParameterPort>this.connectingStartPort).getParamType() + ' 与 ' + (<BlockParameterPort>this.currentHoverPort).getParamType() + ' 不兼容';
        
        }else if(this.currentHoverPort.type == 'Behavior') {

        }
      }
        
    }else {
      this.connectingCanConnect = false;
      this.connectingFailedText = '行为节点与参数节点不能连接';
    }

    //更新点的状态
    if(this.connectingCanConnect) {
      this.currentHoverPort.editorData.forceDotErrorState = false;
      this.currentHoverPort.editorData.forceDotActiveState = true;
      this.connectingIsFail = false;
    }else {
      this.currentHoverPort.editorData.forceDotErrorState = true;
      this.currentHoverPort.editorData.forceDotActiveState = false;
      this.connectingIsFail = true;
    }
    this.currentHoverPort.editorData.updatePortConnectStatusElement();
  }
  public getCurrentHoverPort() : BlockPort {
    return this.currentHoverPort;
  }

  //编辑器鼠标事件

  private testEventInControl(e : Event){
    let target = (<HTMLElement>e.target);
    return (target.tagName == 'INPUT' 
      || target.tagName == 'SELECT'
      || target.classList.contains('param-editor') 
      || target.classList.contains('port-delete') 
      || target.classList.contains('port')
      || target.classList.contains('custom-editor'));
  }

  private onMouseDown(e : MouseEvent) {
    this.mouseDowned = true;
    this.mouseDownPos.x = e.x - this.toolBarWidth;
    this.mouseDownPos.y = e.y - this.toolBarHeight;
    this.mouseDownPosInViewPort.x = this.viewPort.x + this.mouseDownPos.x;
    this.mouseDownPosInViewPort.y = this.viewPort.x + this.mouseDownPos.y;
    this.updateMousePos(e);

    this.isMultiSelected = false;
    this.isMoveedBlock = false;

    this.mouseDownViewPortPos.x = this.viewPort.x;
    this.mouseDownViewPortPos.y = this.viewPort.y;
    
    if(e.buttons == 1) {
      //多选
      if(this.mouseLeftMove) {
        //移动视图
        this.isDragView = true;

      } else {
        this.isMultiSelecting = true;
        this.multiSelectRect.setPos(this.mouseCurrentPosInViewPort);
      }
    }else if(e.buttons == 2) {
      //移动视图
      this.isDragView = true;
    }

    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
  }
  private onMouseUp(e : MouseEvent) {

    if(this.mouseDowned) {
      if(!this.isMultiSelected) {
        this.unSelectAllBlocks();
        this.unSelectAllConnectors();
        this.multiSelectedBlocks.empty();

        if(e.button == 0)
          this.selectOneConnector();
        else if(!this.isDragView) {
          this.isAddBlockInPos = true;
          this.addBlockInPos.Set(this.mouseDownViewPortPos);
          this.clearAddBlockPanelFilter();
          this.showAddBlockPanelAt(this.mouseCurrentPos);
        }

      }else {
        this.selectedBlocks = [];
        for(var i=0;i<this.blocks.length;i++)
          if(this.blocks[i].selected){
            this.blocks[i].updateLastPos();
            this.selectedBlocks.push(this.blocks[i]);
          }
      }

      this.mouseDowned = false;
      this.isMoveBlock = false;
      this.isMultiSelecting = false;
      this.isDragView = false;
      
      this.updateMousePos(e);
    }
    
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
  }
  private onMouseMove(e : MouseEvent) {
    this.updateMousePos(e);

    if(this.mouseDowned) { 
      if(this.isMultiSelecting) {
        //多选框的方向处理
        if(this.mouseCurrentPosInViewPort.x > this.mouseDownPosInViewPort.x) {
          this.multiSelectRect.x = this.mouseDownPosInViewPort.x;
          this.multiSelectRect.w = this.mouseCurrentPosInViewPort.x - this.mouseDownPosInViewPort.x;
        }else {
          this.multiSelectRect.x = this.mouseCurrentPosInViewPort.x;
          this.multiSelectRect.w = this.mouseDownPosInViewPort.x - this.mouseCurrentPosInViewPort.x;
        }
        if(this.mouseCurrentPosInViewPort.y > this.mouseDownPosInViewPort.y) {
          this.multiSelectRect.y = this.mouseDownPosInViewPort.y;
          this.multiSelectRect.h = this.mouseCurrentPosInViewPort.y - this.mouseDownPosInViewPort.y;
        }else {
          this.multiSelectRect.y = this.mouseCurrentPosInViewPort.y;
          this.multiSelectRect.h = this.mouseDownPosInViewPort.y - this.mouseCurrentPosInViewPort.y;
        }

        if(this.multiSelectRect.w > 0 && this.multiSelectRect.h > 0) {
          //选择块
          for(var i = 0, c = this.blocks.length; i < c; i++) {
            this.blocks[i].updateSelectStatus(this.blocks[i].getRect().testRectCross(this.multiSelectRect));
            if(this.blocks[i].selected) this.multiSelectedBlocks.push(this.blocks[i]);
            else this.multiSelectedBlocks.remove(this.blocks[i]);
          }
          //选择连接
          for(var i = 0, c = this.connectors.length; i < c; i++) {
            this.connectors[i].selected = this.connectors[i].testRectCross(this.multiSelectRect, this.viewZoom);
            if(this.connectors[i].selected && !this.selectedConnectors.contains(this.connectors[i])) 
              this.selectedConnectors.push(this.connectors[i]);
            else this.selectedConnectors.remove(this.connectors[i]);
          }
          this.isMultiSelected = true;
        }else
          this.isMultiSelected = false;
      }else if(this.isDragView) {
        //移动视图
        this.viewPort.x = this.mouseDownViewPortPos.x - (this.mouseCurrentPos.x - this.mouseDownPos.x);
        this.viewPort.y = this.mouseDownViewPortPos.y - (this.mouseCurrentPos.y - this.mouseDownPos.y);
        if(this.viewPort.x < 0) this.viewPort.x = 0;
        if(this.viewPort.y < 0) this.viewPort.y = 0;
        this.recalcViewPort();
      }
    } else {
      this.testCastConnector();
    }
  }
  private onMouseWhell(e : WheelEvent) {
    this.updateMousePos(e);

    let oldScale = this.viewScale;
    let pos = new Vector2(this.viewPort.x + this.mouseCurrentPos.x, 
      this.viewPort.y + this.mouseCurrentPos.y);
    pos.x = pos.x / this.viewZoom;
    pos.y = pos.y / this.viewZoom;

    if(e.deltaY < 0) {
      this.viewScale += 5;
      if(oldScale <= 100 && this.viewScale > 100 && !this.keyControlDown)
        this.viewScale = 100;
      if(this.viewScale > 200)
        this.viewScale = 200;
    }else if(e.deltaY > 0) {
      this.viewScale -= 5;
      if(this.viewScale < 30)
        this.viewScale = 30;
    }

    this.recalcViewPort();
    this.updateMousePos(e);

    pos.x = pos.x * this.viewZoom - this.mouseCurrentPos.x;
    pos.y = pos.y * this.viewZoom - this.mouseCurrentPos.y;
    this.viewPort.setPos(pos);
  }

  keyControlDown = false;

  //编辑器键盘事件
  private onKeyDown(e : KeyboardEvent) {
    if(this.testEventInControl(e))
      return;
    switch(e.keyCode) {
      case 17://Ctrl
        this.keyControlDown = true;
        break;
    }
  }
  private onKeyUp(e : KeyboardEvent) {
    if(this.testEventInControl(e))
      return;
    switch(e.keyCode) {
      case 17: //Ctrl
        this.keyControlDown = false;
        break;
      case 65: //A
        this.moveViewportToPos(this.mouseCurrentPosInViewPort);
        break;
      case 81: //Q
        console.log(this.viewPort.calcCenter());
        break;
      case 8://Backspace
      case 127://Delete
        this.showDeleteModalClick();
        break;

    }
  }

  // 块控制
  //=======================


  public addBlock(block : BlockEditor, position : Vector2, connectToPort ?: BlockPort) {
    this.blocks.push(block);

    block.create();
    block.setPos(position);

    this.setFileChanged();
  }
  public deleteBlock(block : BlockEditor, rm = true) {

    block.destroy();

    if (rm) this.blocks.remove(block);
    this.setFileChanged();
  }


  // 整体控制
  //=======================


  private onWindowSizeChanged() {
    let editorHost = <HTMLCanvasElement>document.getElementById("editorHost");
    this.editor.width = editorHost.offsetWidth;
    this.editor.height = editorHost.offsetHeight;

    this.viewRealSize.w = this.editor.offsetWidth;
    this.viewRealSize.h = this.editor.offsetHeight;

    this.recalcViewPort();
  }
  private init() {  
    this.editorHost = <HTMLDivElement>document.getElementById("editorHost");
    this.editor = <HTMLCanvasElement>document.getElementById("editor");
    this.blockHost = <HTMLDivElement>document.getElementById("blockHost");
    this.ctx = this.editor.getContext("2d");
    this.ctx.textBaseline = 'top';
    this.ctx.textAlign = 'left';
    this.ctx.font = 'Arial 14px';
    this.editorHost.addEventListener('mousedown', this.onMouseDown);
    this.editorHost.addEventListener('mouseup', this.onMouseUp);
    this.editorHost.addEventListener('wheel', this.onMouseWhell);
    document.addEventListener('keyup', this.onKeyUp);
    document.addEventListener('keydown', this.onKeyDown);


    this.parser = new EditorFileParser(this);

    this.loadSettings();
    this.initMenu();
    this.initEditorRunner();
    this.initEditorWorkProvider();
  
    BlockServiceInstance.init();
    BlockServiceInstance.isEditorMode = true;
    BlockServiceInstance.allBlocksGrouped = this.allBlocksGrouped;
    BaseBlocks.register();
    ParamTypeServiceInstance.init();
    BlockServiceInstance.updateBlocksList();

    setTimeout(() => {
      this.onWindowSizeChanged();
      //this.newFile();
      this.parser.loadFromString('{"blockMap":["0324C0EC-CE44-05B8-A62D-0ECE0D19DC9F","31CCFD61-0164-015A-04B1-732F0A7D6661","A81899CF-766B-F511-B179-90A81BBB088B","77885802-92C8-569B-1E7F-48938943A549","4B6EA737-9702-A383-A268-AADC332038DF","6C01D858-CF4D-D9EF-C18E-DE5DAE400702"],"blocks":[{"guidMap":0,"uid":"6b646c3678656a67","mark":"","breakpoint":"none","options":{},"position":{"x":2138.2,"y":2224}},{"guidMap":1,"uid":"6b646c3679667565","mark":"","breakpoint":"none","options":{"opType":"string"},"position":{"x":2289,"y":2212}},{"guidMap":2,"uid":"6b646c367a686871","mark":"","breakpoint":"none","options":{},"position":{"x":2114,"y":2326}},{"guidMap":3,"uid":"6b646c6266776569","mark":"","breakpoint":"none","options":{},"position":{"x":2998,"y":2213}},{"guidMap":4,"uid":"6b646c6430356f70","mark":"","breakpoint":"none","options":{},"position":{"x":2522,"y":2218}},{"guidMap":5,"uid":"6b646c6b6b667473","mark":"","breakpoint":"none","options":{},"position":{"x":2682,"y":2215}},{"guidMap":4,"uid":"6b646c6b6b726233","mark":"","breakpoint":"none","options":{},"position":{"x":2844,"y":2213}},{"guidMap":2,"uid":"6b646c6b6c636862","mark":"","breakpoint":"none","options":{},"position":{"x":2675,"y":2322.5}}],"portMap":[{"guid":"31CCFD61-0164-015A-04B1-732F0A7D6661-00000001","regData":{"name":"参数1","description":"","direction":"input","guid":"00000001","paramType":"any","paramCustomType":"","paramDefaultValue":null,"defaultConnectPort":false}},{"guid":"31CCFD61-0164-015A-04B1-732F0A7D6661-00000002","regData":{"name":"参数2","description":"","direction":"input","guid":"00000002","paramType":"any","paramCustomType":"","paramDefaultValue":null,"defaultConnectPort":false}},{"guid":"31CCFD61-0164-015A-04B1-732F0A7D6661-00000003","regData":{"name":"参数3","guid":"00000003","paramCustomType":"","paramType":"string","direction":"input","description":"","defaultConnectPort":false}},{"guid":"31CCFD61-0164-015A-04B1-732F0A7D6661-00000000","regData":{"name":"结果","description":"","direction":"output","guid":"00000000","paramType":"any","paramCustomType":"","paramDefaultValue":null,"defaultConnectPort":false}},{"guid":"A81899CF-766B-F511-B179-90A81BBB088B-00000001","regData":{"name":"","description":"","direction":"input","guid":"00000001","paramType":"string","paramCustomType":"","paramDefaultValue":"","defaultConnectPort":false}},{"guid":"A81899CF-766B-F511-B179-90A81BBB088B-00000002","regData":{"name":"","description":"","direction":"output","guid":"00000002","paramType":"string","paramCustomType":"","paramDefaultValue":null,"defaultConnectPort":false}},{"guid":"4B6EA737-9702-A383-A268-AADC332038DF-00000003","regData":{"name":"输出","description":"","direction":"input","guid":"00000003","paramType":"any","paramCustomType":"any","paramDefaultValue":null,"defaultConnectPort":false}},{"guid":"4B6EA737-9702-A383-A268-AADC332038DF-00000004","regData":{"name":"等级","description":"","direction":"input","guid":"00000004","paramType":"enum","paramCustomType":"DebugLogLevel","paramDefaultValue":"log","defaultConnectPort":false}},{"guid":"6C01D858-CF4D-D9EF-C18E-DE5DAE400702-00000003","regData":{"name":"时长","description":"延迟时长（毫秒）","direction":"input","guid":"00000003","paramType":"number","paramCustomType":"","paramDefaultValue":1000,"defaultConnectPort":false}}],"connectors":[{"startBlock":0,"startPort":"00000000","endBlock":1,"endPort":"CDEDC799"},{"startBlock":2,"startPort":"00000002","endBlock":1,"endPort":"00000002"},{"startBlock":1,"startPort":"F8E71C0D","endBlock":4,"endPort":"00000001"},{"startBlock":1,"startPort":"00000000","endBlock":4,"endPort":"00000003"},{"startBlock":4,"startPort":"00000002","endBlock":5,"endPort":"00000001"},{"startBlock":5,"startPort":"00000002","endBlock":6,"endPort":"00000001"},{"startBlock":6,"startPort":"00000002","endBlock":3,"endPort":"00000001"},{"startBlock":7,"startPort":"00000002","endBlock":6,"endPort":"00000003"}],"params":[{"blockMap":1,"guidMap":0,"dyamicAdd":false,"direction":"input","options":{},"value":"你好，我是"},{"blockMap":1,"guidMap":1,"dyamicAdd":false,"direction":"input","options":{},"value":null},{"blockMap":1,"guidMap":2,"dyamicAdd":true,"direction":"input","options":{},"value":"！"},{"blockMap":1,"guidMap":3,"dyamicAdd":false,"direction":"output","options":{},"value":null},{"blockMap":2,"guidMap":4,"dyamicAdd":false,"direction":"input","options":{},"value":"梦欤"},{"blockMap":2,"guidMap":5,"dyamicAdd":false,"direction":"output","options":{},"value":null},{"blockMap":4,"guidMap":6,"dyamicAdd":false,"direction":"input","options":{},"value":null},{"blockMap":4,"guidMap":7,"dyamicAdd":false,"direction":"input","options":{},"value":"warn"},{"blockMap":5,"guidMap":8,"dyamicAdd":false,"direction":"input","options":{},"value":1000},{"blockMap":6,"guidMap":6,"dyamicAdd":false,"direction":"input","options":{},"value":null},{"blockMap":6,"guidMap":7,"dyamicAdd":false,"direction":"input","options":{},"value":"info"},{"blockMap":7,"guidMap":4,"dyamicAdd":false,"direction":"input","options":{},"value":"延时完成"},{"blockMap":7,"guidMap":5,"dyamicAdd":false,"direction":"output","options":{},"value":null}],"ports":[],"boxs":[],"comments":[],"viewPort":{"x":2048,"y":2048,"w":1242,"h":459,"center":{"x":0,"y":0}},"scale":100}');
      //this.parser.loadFromString('{"blockMap":["0324C0EC-CE44-05B8-A62D-0ECE0D19DC9F","31CCFD61-0164-015A-04B1-732F0A7D6661"],"blocks":[{"guidMap":0,"uid":"6b646a6f6836746c","mark":"","breakpoint":"none","options":{},"position":{"x":1101,"y":1185.5}},{"guidMap":1,"uid":"6b646a6f68383737","mark":"","breakpoint":"none","options":{"opType":"any"},"position":{"x":1248,"y":1161.5}},{"guidMap":1,"uid":"6b646a6f68627476","mark":"","breakpoint":"none","options":{"opType":"any"},"position":{"x":1425,"y":1161.5}}],"portMap":[{"guid":"31CCFD61-0164-015A-04B1-732F0A7D6661-00000001","regData":{"name":"参数1","description":"","direction":"input","guid":"00000001","paramType":"any","paramCustomType":"","defaultConnectPort":false}},{"guid":"31CCFD61-0164-015A-04B1-732F0A7D6661-00000002","regData":{"name":"参数2","description":"","direction":"input","guid":"00000002","paramType":"any","paramCustomType":"","defaultConnectPort":false}},{"guid":"31CCFD61-0164-015A-04B1-732F0A7D6661-00000000","regData":{"name":"结果","description":"","direction":"output","guid":"00000000","paramType":"any","paramCustomType":"","defaultConnectPort":false}}],"connectors":[{"startBlock":0,"startPort":"00000000","endBlock":1,"endPort":"CDEDC799"},{"startBlock":1,"startPort":"F8E71C0D","endBlock":2,"endPort":"CDEDC799"},{"startBlock":1,"startPort":"00000000","endBlock":2,"endPort":"00000001"},{"startBlock":1,"startPort":"00000000","endBlock":2,"endPort":"00000002"}],"params":[{"blockMap":1,"guidMap":0,"dyamicAdd":false,"direction":"input","options":{},"value":null},{"blockMap":1,"guidMap":1,"dyamicAdd":false,"direction":"input","options":{},"value":null},{"blockMap":1,"guidMap":2,"dyamicAdd":false,"direction":"output","options":{},"value":null},{"blockMap":2,"guidMap":0,"dyamicAdd":false,"direction":"input","options":{},"value":null},{"blockMap":2,"guidMap":1,"dyamicAdd":false,"direction":"input","options":{},"value":null},{"blockMap":2,"guidMap":2,"dyamicAdd":false,"direction":"output","options":{},"value":null}],"ports":[],"boxs":[],"comments":[]}');
    }, 1000)
  }
  private destroy() {
    this.saveSettings();
    this.runner = null;
    this.editorHost.removeEventListener('mousedown', this.onMouseDown);
    this.editorHost.removeEventListener('mouseup', this.onMouseUp);
    this.editorHost.removeEventListener('wheel', this.onMouseWhell);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('keydown', this.onKeyDown);
  }

  //
  //设置加载与读取

  private loadSettings() {
    this.drawDebugInfo = SettingsServiceInstance.getSettingsBoolean('drawDebugInfo', false);
    this.gridShow = SettingsServiceInstance.getSettingsBoolean('gridShow', true);
  }
  private saveSettings() {
    SettingsServiceInstance.setSettingsBoolean('drawDebugInfo', this.drawDebugInfo);
    SettingsServiceInstance.setSettingsBoolean('gridShow', this.gridShow);
  }

  mounted() {

    document.addEventListener('resize', () => this.onWindowSizeChanged);
    window.onbeforeunload = () => {
      this.saveSettings();
      if(this.currentFileChanged)
        return "确认离开当前页面吗？未保存的数据将会丢失";
      return undefined;
    };

    this.init();
    this.onWindowSizeChanged();
    this.recalcViewPort();
    this.draw();
  }
  beforeDestroy() {
    this.drawStop();
    this.destroy();
    window.onbeforeunload = null;
    document.removeEventListener('resize', () => this.onWindowSizeChanged);
  }

  //
  //'

  initEditorWorkProvider() {
    let _this = this;
    DebugWorkProviderInstance.ModalProvider = (level : string, title :string, text: string, 
      okCallback : () => void) => {
      switch(level) {
        case 'log':
          _this.$Modal.success({
            title: title,
            content: text,
            onOk: () => okCallback()
          });
          break;
        case 'info':
          _this.$Modal.info({
            title: title,
            content: text,
            onOk: () => okCallback(),
          });
          break;
        case 'warn':
          _this.$Modal.warning({
            title: title,
            content: text,
            onOk: () => okCallback(),
          });
          break;
        case 'error':
          _this.$Modal.error({
            title: title,
            content: text,
            onOk: () => okCallback(),
          });
          break;
      }
      
    };
    DebugWorkProviderInstance.ConfirmModalProvider = (title :string, text: string, 
      okCallback : () => void, cancelCallback : () => void) => {
      _this.$Modal.confirm({
        title: title,
        content: text,
        onOk: () => okCallback(),
        onCancel: () => cancelCallback(),
      });
    };
  }

  // 文件保存写入控制
  //=======================

  private showDropChangesModal = false;

  private parser : EditorFileParser
  private currentFileChanged = false;

  private setFileChanged() { this.currentFileChanged = true; }
  private doNewFile() {
    this.currentFileChanged = true;
    this.clearAll();

    let centerPoint = this.viewPort.calcCenter();
    centerPoint.x -= (this.viewPort.w / 10);
    this.addBlock(new BlockEditor(this, BaseBlocks.getScriptBaseBlockIn()), new Vector2(
      this.viewPort.x + (this.viewPort.w / 2 - 35) - this.viewPort.w / 2.5,
      this.viewPort.y + (this.viewPort.h / 2 - 15)
    ));
  }

  public newFile() {
    if(this.currentFileChanged) this.showDropChangesModal = true;
    else this.doNewFile();
  }
  public saveFile() {
    console.log(this.parser.saveToString());
    alert('saveFile');
  }
  public loadFile() {
    
  }

  // 调试运行控制
  //=======================

  private startBlock : BlockEditor = null;
  private runner : BlockRunner = null;
  private runnerStopByBreakPoint = false;
  private runningState : EditorRunningState = 'editing';
  private runningBlock : BlockEditor = null;

  private initEditorRunner() {
    this.runner = new BlockRunner();
    this.runner.onRunnerEnd = this.onRunnerEnd.bind(this);
    this.runner.onRunnerIdle = this.onRunnerIdle.bind(this);
    this.runner.onRunnerBreakPoint = this.onRunnerBreakPoint.bind(this);
  }
  private onRunnerEnd() {
    this.runningState = 'editing';
    this.runnerStopByBreakPoint = false;
    this.runner.stepMode = false;

    setTimeout(() => {
      this.blocks.forEach(element => { 
        element.markDective(true); 
        element.markBreakPointActiveState(false); 
      });
      this.connectors.forEach(element =>  element.clearActive());
    }, 300);

    console.log('[DebugRunner] 脚本已经运行完成');
  }
  private onRunnerIdle() {
  }
  private onRunnerBreakPoint(currentPort : BlockBehaviorPort, block : Block) {
    this.runnerStopByBreakPoint = true;
    this.runningState = 'runningPaused';
    this.runningBlock = <BlockEditor>block;
    this.runningBlock.markBreakPointActiveState(true);
  }  

  public getRunningState()  { return this.runningState; }


  public startRun() {
    if(this.runningState == 'editing') {

      //断点暂停，继续运行
      if(this.runnerStopByBreakPoint) {

        this.runner.stepMode = false;
        this.runner.start();
        this.runningState = 'running';
        this.runnerStopByBreakPoint = false;

      }else {

        //查找入口单元
        this.startBlock = this.getOneBlockByGUID(BaseBlocks.getScriptBaseBlockIn().guid);
        if(this.startBlock == null) {
          this.$Modal.info({
            title: '错误',
            content: '没有找到入口单元，无法运行脚本<br>请先添加一个入口单元'
          });
          return false;
        }

        //变量初始化以仅参数
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

        //激活入口单元
        this.runner.push(this.startBlock.outputPorts['00000000'], 'connector');
        this.runner.start();
        this.runningState = 'running';

        console.log('[DebugRunner] 开始运行脚本');
      }
      return true;
    }
    return false;
  }
  public startRunAndStepNext() {
    if(this.runningState == 'editing') {
      if(this.startRun())
        this.runner.stepMode = true;
    }
  }
  public stopRun() {
    this.runner.stop();
    this.runner.clear();
    this.onRunnerEnd();
  }
  public pauseRun() {
    this.runner.stepMode = true;
  }
  public stepNext() {
    this.runner.stepMode = true;
    this.runner.start();

    if(this.runningBlock != null) {
      this.runningBlock.markBreakPointActiveState(false);
    }
  }

  public openConsole() {
    this.$Modal.info({
      title: '提示',
      content: '请按 F12 开启控制台'
    });
  }

}

</script>

