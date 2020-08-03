<template>
  <div>
    <!--工具栏-->
    <div class="toolbar">
      <div class="button icon" title="新建" @click="newFile"><i class="iconfont icon-file-1"></i></div>
      <div class="button icon" title="打开" @click="loadFile"><i class="iconfont icon-folder-"></i></div>
      <div class="button icon" title="保存" @click="saveFile"><i class="iconfont icon-save"></i></div>
      <div class="separator"></div>

      <div class="button icon" title="撤销"><i class="iconfont icon-share-" style="display: inline-block;transform: rotateY(180deg);"></i></div>
      <div class="button icon" title="重做"><i class="iconfont icon-share-"></i></div>

      <div class="separator"></div>
      <div class="button icon" title="缩小" @click="zoomOut"><i class="iconfont icon-zoom-out"></i></div>
      <div class="block">{{viewScale}}%</div>
      <div class="button icon" title="放大" @click="zoomIn"><i class="iconfont icon-zoom"></i></div>
      <div class="button" @click="zoomReset">原始大小</div>
      <div class="separator"></div>
      <div :class="'button icon'+(mouseLeftMove?'':' active')" title="鼠标用来选择组件" @click="mouseLeftMove=false"><i class="iconfont icon-yidong_huaban1"></i></div>
      <div :class="'button icon'+(mouseLeftMove?' active':'')" title="鼠标用来移动视图" @click="mouseLeftMove=true"><i class="iconfont icon-shou"></i></div>
      <div class="separator"></div>
      
      <div class="button icon" title="添加单元" @click="showAddBlockPanelTop($event.currentTarget)"><i class="iconfont icon-pluss-2"></i></div>
      <div class="button icon" title="删除选中" :disabled="selectedBlocks.length==0&&selectedConnectors.length==0" 
        @click="showDeleteModalClick()"><i class="iconfont icon-trash"></i></div>

      <div class="separator"></div>

      <div v-if="runningState=='editing'" class="button icon" title="开始调试" @click="startRun"><i class="iconfont icon-play"></i></div>
      <div v-if="runningState=='editing'" class="button icon" title="开始单步调试" @click="startRunAndStepNext"><i class="iconfont icon-play-next"></i></div>
      <div v-if="runningState=='runningPaused'" class="button icon" title="运行下一步" @click="stepNext"><i class="iconfont icon-play-next"></i></div>
      
      <div v-if="runningState=='running'" class="button icon" title="暂停调试" @click="pauseRun"><i class="iconfont icon-pause"></i></div>
      <div v-if="runningState=='running'" class="button icon" title="停止调试" @click="stopRun"><i class="iconfont running"></i></div>

      <div class="separator"></div>

      <div class="button icon" title="打开控制台" @click="openConsole"><i class="iconfont icon-terminal"></i></div>
    
    </div>
    <!--添加单元弹出窗口-->
    <AddPanel v-show="showAddBlockPanel" 
      :allBlocksGrouped="allBlocksGrouped" 
      :showPos="showAddBlockPanelPos"
      @onBlockItemClick="onBlockAddItemClick" />
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
          <div class="flow-block-host outer" :style="{ 
            left: -viewPort.x + 'px', top: -viewPort.y + 'px' ,
          }">
            <div id="blockHost" class="flow-block-host" :style="{ 
              userSelect: (isMultiSelecting ? 'none' : 'unset'),
              zoom: viewZoom
            }">

            </div>
          </div>
        </div>
        <!--属性栏-->
        <div slot="right" class="prop">

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
        <Button type="error" size="large" @click="deleteSelectedBlocks">删除</Button>
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
        <Button type="error" size="large" @click="doNewFile">丢弃更改</Button>
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
import { EditorFileParser } from "../model/Parser";

import BaseBlocks from "../model/Blocks/BaseBlocks";
import CanvasUtils from "../utils/CanvasUtils";
import CommonUtils from "../utils/CommonUtils";
import BlockCategory from "../components/BlockCategory.vue";
import AddPanel from "../components/AddPanel.vue";
import BlockServiceInstance from "../sevices/BlockService";
import ParamTypeServiceInstance from "../sevices/ParamTypeService";
import { BlockEditor } from "../model/BlockEditor";

@Component({
  components: {
    'BlockCategory': BlockCategory,
    'AddPanel': AddPanel
  }
})
export default class Editor extends Vue implements EditorInterface {
  name = "App";

  toolBarHeight = 45;
  splitOff = 0.7;

  @Watch('splitOff') 
  onSplitOffChanged() {
    this.onWindowSizeChanged();
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
  public getBlockHostElement() { return this.blockHost; }

  /**
   * 视口控制
   */

  viewRealSize = {
    w: 0,
    h: 0
  }

  viewPort : Rect = new Rect(1024, 1024, 0, 0);
  viewScale = 100;
  viewZoom = 1;

  public recalcViewPort() {
    this.viewZoom = this.viewScale / 100;
    this.viewPort.w = this.viewRealSize.w * (2 - this.viewZoom);
    this.viewPort.h = this.viewRealSize.h * (2 - this.viewZoom);
  }

  /**
   * 缩放控制
   */

  public zoomIn() {
    if(this.viewScale < 200) 
      this.viewScale += 10;
    this.recalcViewPort();
  }
  public zoomOut() {
    if(this.viewScale > 50) 
      this.viewScale -= 10;
    this.recalcViewPort();
  }
  public zoomReset() {
    this.viewScale = 100;
    this.recalcViewPort();
  }


  /**
   * 绘制控制
   */

  drawId = 0;

  public drawStop() {
    cancelAnimationFrame(this.drawId);
  }
  public draw() {

	  this.ctx.clearRect(0, 0, this.viewRealSize.w, this.viewRealSize.h);

    this.drawGrid();
    this.drawConnectors();
    this.drawMultiSelBox();

    this.ctx.fillStyle = "#000";
    this.ctx.strokeStyle = "#000";
    //Debug text
    this.ctx.fillText("viewPort : " + this.viewPort.x + "," + this.viewPort.y + ',' + this.viewPort.w + "," + this.viewPort.h, 30, 20);
    this.ctx.fillText("mouseDownPos : " + this.mouseDownPos.x + "," + this.mouseDownPos.y, 30, 30);
    this.ctx.fillText("multiSelectRect : " + this.multiSelectRect.x + " , " + this.multiSelectRect.y +" , "+ this.multiSelectRect.w + " , " + this.multiSelectRect.h, 30, 40);
    this.ctx.fillText("isConnecting : " + this.isConnecting + " connectingEndPos: " + this.connectingEndPos.x +" , "+ this.connectingEndPos.y, 30, 50);

    this.drawId = requestAnimationFrame(this.draw);
  }

  gridSize = 20;

  private drawGrid() {
    
    let showGridSize = this.viewZoom * this.gridSize;
    let gridOffx = this.viewPort.x % showGridSize;
    let gridOffy = this.viewPort.y % showGridSize;
    let count = 0;

    this.ctx.lineWidth = 1;

    count = Math.floor(this.viewPort.x / showGridSize) ;

    for(let i = -gridOffx,
        end = i + this.viewRealSize.w; i <= end;i += showGridSize) {

      count++;

      if(count % 5 == 0)this.ctx.strokeStyle = "#aaa";
      else if(this.viewScale < 70) continue;
      else this.ctx.strokeStyle = "#e8e8e8";

      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.viewRealSize.h);
      this.ctx.closePath();
      this.ctx.stroke();


    }
    count = Math.floor(this.viewPort.y / showGridSize);

    for(let i = -gridOffy, end = i + this.viewRealSize.h; i <= end;i += showGridSize) {

      count++; 

      if(count % 5 == 0) this.ctx.strokeStyle = "#aaa"; 
      else if(this.viewScale < 70) continue;
      else this.ctx.strokeStyle = "#e8e8e8";

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
      let rect = element.getRect();

      if(element.selected) this.ctx.strokeStyle = "#45b4f5";
      else if(element.hover) this.ctx.strokeStyle = "#2ec4ff";
      else this.ctx.strokeStyle = "#000";

      if(rect.testRectCross(this.viewPort)) 
        element.draw(this.ctx, this.viewPort, this.viewZoom);
    });

    if(this.isConnecting) {
      if(this.connectingIsFail) this.ctx.strokeStyle = "#e9412a";
      else this.ctx.strokeStyle = "#000";

      if(this.connectingStartPort.direction == 'input')
        CanvasUtils.drawConnectorBezierCurve(this.ctx, this.connectingEndPos, this.connectingStartPort.editorData.getPosition(), this.viewPort, this.viewZoom);
      else if(this.connectingStartPort.direction == 'output')
        CanvasUtils.drawConnectorBezierCurve(this.ctx, this.connectingStartPort.editorData.getPosition(), this.connectingEndPos, this.viewPort, this.viewZoom);
    

    }
  }


  // 单元管理
  //======================= 

  public allBlocksGrouped = [];

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

    this.addBlock(new BlockEditor(this, block), this.viewPort.calcCenter());
  }

  //添加单元弹出

  showAddBlockPanelPos = new Vector2();
  showAddBlockPanel = false;

  public showAddBlockPanelAt(pos : Vector2) {
    this.showAddBlockPanelPos = pos;
    this.showAddBlockPanel = true;
  }
  showAddBlockPanelTop(e : HTMLElement) {
    if(this.showAddBlockPanel) this.showAddBlockPanel = false;
    else this.showAddBlockPanelAt(new Vector2(
      e.offsetLeft,
      this.toolBarHeight + 3
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

  multiSelectRect = new Rect();
  mouseLeftMove = false;

  mouseDowned = false;
  mouseDownPos : Vector2 = new Vector2();
  mouseDownViewPortPos : Vector2 = new Vector2();
  mouseDownBlockPos : Vector2 = new Vector2();
  mouseCurrentPos : Vector2 = new Vector2();
  mouseCurrentPosInViewPort : Vector2 = new Vector2();

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
    for(var i=0;i<this.blocks.length;i++) this.blocks[i].updateSelectStatus(false);
    this.selectedBlocks = [];
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
      this.connectors[i].hover = (this.connectors[i].getRect().testInRect(this.mouseCurrentPosInViewPort));
  }
  private updateMousePos(e : MouseEvent) {
    this.mouseCurrentPos.x = e.x;
    this.mouseCurrentPos.y = e.y - this.toolBarHeight;
    this.mouseCurrentPosInViewPort.x = this.viewPort.x + e.x;
    this.mouseCurrentPosInViewPort.y = this.viewPort.y + e.y - this.toolBarHeight;
    this.testCastConnector();
  }

  //单元控制事件

  public onUserSelectBlock(block : BlockEditor) {
    if(!this.selectedBlocks.contains(block)) {
      this.selectedBlocks.push(block);
      block.updateLastPos();
    }
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
    block.allPorts.forEach((p) => {
      if(p.connector != null)
        this.unConnectConnector(<ConnectorEditor>p.connector);
    })
  }

  //链接控制事件

  private isConnecting = false;
  private connectingIsFail = false;
  private connectingStartPort : BlockPort = null;
  private connectingEndPos : Vector2 = new Vector2();
  private connectingCanConnect = false;

  private currentHoverPort : BlockPort = null;

  /**
   * 断开链接
   * @param connector 目标链接
   */
  public unConnectConnector(connector : ConnectorEditor) {
    this.connectors.remove(connector);
    this.selectedConnectors.remove(connector);
        
    connector.startPort.connectedPort = null;
    connector.startPort.connector = null;
    connector.startPort.editorData.updatePortConnectStatusElement();
    connector.endPort.connectedPort = null;
    connector.endPort.connector = null;
    connector.endPort.editorData.updatePortConnectStatusElement();

    this.setFileChanged();
  }
  public getCanConnect() { return this.connectingCanConnect; }
  public startConnect(port : BlockPort) {
    this.connectingStartPort = port;
    this.connectingStartPort.editorData.forceDotActiveState = true;
    this.connectingStartPort.editorData.updatePortConnectStatusElement();
    this.isConnecting = true;
  }
  public endConnect(port : BlockPort) {
    
    if(this.connectingCanConnect && this.currentHoverPort != null && this.connectingStartPort != null) {

      //已经链接上了，取消链接
      if(this.currentHoverPort.connector == this.connectingStartPort.connector 
        && this.connectingStartPort.connector != null) {
        this.unConnectConnector(<ConnectorEditor>this.currentHoverPort.connector);   
        this.isConnecting = false;
        this.connectingStartPort = null;
        return;
      }

      //新建链接
      let connector = new ConnectorEditor();

      //根据方向链接节点
      if(this.connectingStartPort.direction == 'output') {

        //如果是行为端口，只能输出一条线路。
        if(this.connectingStartPort.type == 'Behavior' 
          && this.connectingStartPort.connector != null) {
          this.connectingStartPort.connector.endPort.connector = null;
          this.connectors.remove(<ConnectorEditor>this.connectingStartPort.connector);
        }
        //如果是参数端口，只能输入一条线路。
        if(this.connectingStartPort.type == 'Parameter'
          && this.currentHoverPort.connector != null) {
          this.currentHoverPort.connector.endPort.connector = null;
          this.connectors.remove(<ConnectorEditor>this.currentHoverPort.connector);
        }

        this.connectingStartPort.connectedPort = this.currentHoverPort;
        this.connectingStartPort.connector = connector;
        this.connectingStartPort.editorData.updatePortConnectStatusElement();
        this.currentHoverPort.connector = connector;
        this.currentHoverPort.editorData.updatePortConnectStatusElement();

        connector.startPort = this.connectingStartPort;
        connector.endPort = this.currentHoverPort;
      }else if(this.currentHoverPort.direction == 'output') {

        //如果是行为端口，只能输出一条线路。
        if(this.connectingStartPort.type == 'Behavior' 
          && this.currentHoverPort.connector != null) {
          this.currentHoverPort.connector.endPort.connector = null;
          this.connectors.remove(<ConnectorEditor>this.currentHoverPort.connector);
        }
        //如果是参数端口，只能输入一条线路。
        if(this.currentHoverPort.type == 'Parameter'
          && this.connectingStartPort.connector != null) {
          this.connectingStartPort.connector.endPort.connector = null;
          this.connectors.remove(<ConnectorEditor>this.connectingStartPort.connector);
        }

        this.currentHoverPort.connector = connector;
        this.currentHoverPort.connectedPort = this.currentHoverPort;
        this.currentHoverPort.editorData.updatePortConnectStatusElement();
        this.connectingStartPort.connector = connector;
        this.connectingStartPort.editorData.updatePortConnectStatusElement();

        connector.startPort = this.currentHoverPort;
        connector.endPort = this.connectingStartPort;
      }

      this.connectingStartPort = null;

      //添加线段
      this.connectors.push(connector);
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
    this.connectingEndPos.Set(posDocunment.x + this.viewPort.x, 
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
    if(this.currentHoverPort.type == this.connectingStartPort.type) {

      //方向必须不同才能链接
      this.connectingCanConnect = this.currentHoverPort.direction != this.connectingStartPort.direction;

      //参数类型检查
      if(this.connectingCanConnect) {
        if(this.currentHoverPort.type == 'Parameter') {
          if(this.currentHoverPort.direction == 'input')
            this.connectingCanConnect = (<BlockParameterPort>this.currentHoverPort).checkParameterAllow(<BlockParameterPort>this.connectingStartPort);
          else if(this.connectingStartPort.direction == 'input')
            this.connectingCanConnect = (<BlockParameterPort>this.connectingStartPort).checkParameterAllow(<BlockParameterPort>this.currentHoverPort);
          
        }else if(this.currentHoverPort.type == 'Behavior') {

        }
      }
        
    }else this.connectingCanConnect = false;

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

  private onMouseDown(e : MouseEvent) {
    this.mouseDowned = true;
    this.mouseDownPos.x = e.x;
    this.mouseDownPos.y = e.y - this.toolBarHeight;
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
        this.selectOneConnector();
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
        //多选
        this.multiSelectRect.Set(undefined, undefined,
            this.mouseCurrentPosInViewPort.x - this.multiSelectRect.x, 
            this.mouseCurrentPosInViewPort.y - this.multiSelectRect.y);

        for(var i=0,c=this.blocks.length;i<c;i++)
          this.blocks[i].updateSelectStatus(this.blocks[i].getRect().testRectCross(this.multiSelectRect));
        for(var i=0,c=this.connectors.length;i<c;i++) {
          this.connectors[i].selected = this.connectors[i].getRect().testRectCross(this.multiSelectRect);
          if(this.connectors[i].selected && !this.selectedConnectors.contains(this.connectors[i])) 
            this.selectedConnectors.push(this.connectors[i]);
          else this.selectedConnectors.remove(this.connectors[i]);
        }

        this.isMultiSelected = true;

      }else if(this.isDragView) {
        //移动视图
        this.viewPort.x = this.mouseDownViewPortPos.x - (this.mouseCurrentPos.x - this.mouseDownPos.x);
        this.viewPort.y = this.mouseDownViewPortPos.y - (this.mouseCurrentPos.y - this.mouseDownPos.y);
        if(this.viewPort.x < 0) this.viewPort.x = 0;
        if(this.viewPort.y < 0) this.viewPort.y = 0;
        this.recalcViewPort();
      }
    } 
  }
  private onMouseWhell(e : MouseEvent) {

  }

  //编辑器键盘事件

  private onKeyUp(e : KeyboardEvent) {
    switch(e.keyCode) {
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
  public deleteBlock(block : BlockEditor) {

    block.destroy();

    this.blocks.remove(block);
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
    this.editorHost = <HTMLDivElement>document.getElementById("editor");
    this.editor = <HTMLCanvasElement>document.getElementById("editor");
    this.blockHost = <HTMLDivElement>document.getElementById("blockHost");
    this.ctx = this.editor.getContext("2d");
    this.editorHost.addEventListener('mousedown', this.onMouseDown);
    this.editorHost.addEventListener('mouseup', this.onMouseUp);
    this.editorHost.addEventListener('wheel', this.onMouseWhell);
    this.editorHost.addEventListener('keyup', this.onKeyUp);

    this.parser = new EditorFileParser(this);

    BlockServiceInstance.init();
    BlockServiceInstance.isEditorMode = true;
    BlockServiceInstance.allBlocksGrouped = this.allBlocksGrouped;
    BaseBlocks.register();
    ParamTypeServiceInstance.init();
    BlockServiceInstance.updateBlocksList();

    setTimeout(() => {
      this.onWindowSizeChanged();
      this.newFile();
    }, 1000)
  }
  private destroy() {
    this.editorHost.removeEventListener('mousedown', this.onMouseDown);
    this.editorHost.removeEventListener('mouseup', this.onMouseUp);
    this.editorHost.removeEventListener('wheel', this.onMouseWhell);
    this.editorHost.removeEventListener('keyup', this.onKeyUp);
  }

  mounted() {

    document.addEventListener('resize', () => this.onWindowSizeChanged);

    this.init();
    this.onWindowSizeChanged();
    this.recalcViewPort();
    this.draw();
  }
  beforeDestroy() {
    this.drawStop();
    this.destroy();
    document.removeEventListener('resize', () => this.onWindowSizeChanged);
  }

  // 文件保存写入控制
  //=======================

  private showDropChangesModal = false;

  private parser : EditorFileParser
  private currentFileChanged = false;

  private setFileChanged() { this.currentFileChanged = true; }
  private doNewFile() {
    this.currentFileChanged = true;
    this.blocks = [];
    this.connectors = [];

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

  runningState : EditorRunningState = 'editing';

  private startBlock : BlockEditor = null;

  public getRunningState() { return this.runningState;}

  public startRun() {
    if(this.runningState == 'editing') {

      //查找入口单元
      this.startBlock = this.getOneBlockByGUID(BaseBlocks.getScriptBaseBlockIn().guid);
      if(this.startBlock == null) {
        this.$Modal.info({
          title: '错误',
          content: '没有找到入口单元，无法运行脚本'
        });
        return false;
      }
      //激活入口单元
      

      return true;
    }
    return false;
  }
  public startRunAndStepNext() {
    if(this.runningState == 'editing') {
      if(this.startRun()) {

      }
    }
  }
  public stopRun() {
    
  }
  public pauseRun() {
    
  }
  public stepNext() {
    
  }

  public openConsole() {
    this.$Modal.info({
      title: '提示',
      content: '请按 F12 开启控制台'
    });
  }

}

</script>

