<template>
  <div>
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


    </div>
    <AddPanel v-show="showAddBlockPanel" 
      :allBlocksGrouped="allBlocksGrouped" 
      :showPos="showAddBlockPanelPos"
      @onBlockItemClick="onBlockAddItemClick" />
    <div class="main">
      <Split v-model="splitOff">
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
        <div slot="right" class="prop">

        </div>
      </Split>
    </div>
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
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State } from 'vuex-class'
import { Block } from '../model/block'
import { Vector2 } from "../model/vector2";
import { Rect } from "../model/rect";
import { BlockRegData } from "../model/blockdef";
import { EditorInterface } from "../model/editor";
import { BlockPort, BlockParameterPort } from "../model/port";
import { Connector } from "../model/connector";
import { EditorFileParser } from "../model/parser";

import BaseBlocks from "../model/blocks/baseBlocks";
import CanvasUtils from "../utils/CanvasUtils";
import CommonUtils from "../utils/CommonUtils";
import BlockCategory from "../components/BlockCategory.vue";
import AddPanel from "../components/AddPanel.vue";

export type CategoryData = {
  category: string,
  childCategories: Array<CategoryData>,
  blocks: Array<BlockRegData>
};

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
        CanvasUtils.drawConnectorBezierCurve(this.ctx, this.connectingEndPos, this.connectingStartPort.getPosition(), this.viewPort, this.viewZoom);
      else if(this.connectingStartPort.direction == 'output')
        CanvasUtils.drawConnectorBezierCurve(this.ctx, this.connectingStartPort.getPosition(), this.connectingEndPos, this.viewPort, this.viewZoom);
    

    }
  }

  // 单元管理
  //======================= 

  private allBlocks = {};
  private allBlocksGrouped : Array<CategoryData> = [];

  /**
   * 注册单元
   * @param blockdef 单元信息
   * @param updateList 是否刷新列表
   */
  public registerBlock(blockdef : BlockRegData, updateList = true) {
    if(this.getRegisteredBlock(blockdef.guid)) {
      console.warn("[registerBlock] Block guid " + blockdef.guid + " alreday registered !");
      return;
    }
    this.allBlocks[blockdef.guid] = blockdef;
    if(updateList)
      this.updateBlocksList();
  }
  public getRegisteredBlock(guid : string) {
    return this.allBlocks[guid];
  }
  public unregisterBlock(guid : string) {
    let regData : BlockRegData = this.allBlocks[guid]
    if(regData) {
      if((<any>regData).categoryObject) {
        (<CategoryData>(<any>regData).categoryObject).blocks.remove(regData);
      }
    }
    this.allBlocks[guid] = undefined;
  }

  private findOrCrateBlocksListCategoryAtCategory(path : string, parent : Array<CategoryData>) : CategoryData {
    let spIndex = path.indexOf('/');
    let categoryName = path;
    if(spIndex > 0) 
      categoryName = path.substring(0, spIndex);

    let category : CategoryData = null;
    for(let i = 0, c = parent.length; i < c; i++) {
      if(parent[i].category == categoryName){
        category = parent[i];
        break;
      }
    }

    //没有则创建
    if(category == null) {
      category = {
        category: categoryName,
        childCategories: [],
        blocks: []
      };
      parent.push(category);
    }

    //如果还有下一级，则递归查找
    if(spIndex > 0 && spIndex < path.length) 
      return this.findOrCrateBlocksListCategoryAtCategory(path.substring(spIndex + 1), category.childCategories);
    else 
      return category;
  }
  public findBlocksListCategory(path : string) : CategoryData {
    return this.findOrCrateBlocksListCategoryAtCategory(path, this.allBlocksGrouped);
  }
  /**
   * 刷新单元列表
   */
  public updateBlocksList() {
    Object.keys(this.allBlocks).forEach(key => {
      let regData : BlockRegData = this.allBlocks[key];
      let category = this.findBlocksListCategory(regData.category);

      (<any>regData).categoryObject = category;

      if(!category.blocks.contains(regData)) 
        category.blocks.push(regData);
    });
  }
  onBlockAddItemClick(block : BlockRegData) {
    this.showAddBlockPanel = false;
    this.addBlock(new Block(this, block), this.viewPort.calcCenter());
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

  blocks : Array<Block> = [];
  connectors : Array<Connector> = [];

  public getBlocks() { return this.blocks;}
  public getConnectors() { return this.connectors;}


  // 逻辑控制
  //=======================

  isMultiSelecting = false;
  isMoveBlock = false;
  isDragView = false;

  isMultiSelected = false;
  isMoveedBlock = false;

  // 鼠标逻辑控制
  //=======================

  selectedBlocks : Array<Block> = [];
  selectedConnectors : Array<Connector> = [];

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

  public onUserSelectBlock(block : Block) {
    if(!this.selectedBlocks.contains(block)) {
      this.selectedBlocks.push(block);
      block.updateLastPos();
    }
  }
  public onMoveBlock(block : Block, moveOffest : Vector2) {
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
  public onMoveBlockEnd(block : Block) {
    if(this.selectedBlocks.length > 0) {
      this.selectedBlocks.forEach(element => {
        element.updateLastPos();
      });
    }
  }
  public onBlockDelete(block : Block) {
    if(this.selectedBlocks.contains(block)) 
      this.selectedBlocks.remove(block);
    block.allPorts.forEach((p) => {
      if(p.connector != null)
        this.unConnectConnector(p.connector);
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
  public unConnectConnector(connector : Connector) {
    this.connectors.remove(connector);
    this.selectedConnectors.remove(connector);
        
    connector.startPort.connectedPort = null;
    connector.startPort.connector = null;
    connector.startPort.updatePortConnectStatusElement();
    connector.endPort.connectedPort = null;
    connector.endPort.connector = null;
    connector.endPort.updatePortConnectStatusElement();
  }
  public getCanConnect() { return this.connectingCanConnect; }
  public startConnect(port : BlockPort) {
    this.connectingStartPort = port;
    this.connectingStartPort.forceDotActiveState = true;
    this.connectingStartPort.updatePortConnectStatusElement();
    this.isConnecting = true;
  }
  public endConnect(port : BlockPort) {
    
    if(this.connectingCanConnect && this.currentHoverPort != null && this.connectingStartPort != null) {

      //已经链接上了，取消链接
      if(this.currentHoverPort.connector == this.connectingStartPort.connector 
        && this.connectingStartPort.connector != null) {
        this.unConnectConnector(this.currentHoverPort.connector);   
        this.isConnecting = false;
        this.connectingStartPort = null;
        return;
      }

      //新建链接
      let connector = new Connector();

      //根据方向链接节点
      if(this.connectingStartPort.direction == 'output') {

        if(this.connectingStartPort.connector != null) {
          this.connectingStartPort.connector.endPort.connector = null;
          this.connectors.remove(this.connectingStartPort.connector);
        }

        this.connectingStartPort.connectedPort = this.currentHoverPort;
        this.connectingStartPort.updatePortConnectStatusElement();
        this.connectingStartPort.connector = connector
        this.currentHoverPort.connector = connector;
        this.currentHoverPort.updatePortConnectStatusElement();

        connector.startPort = this.connectingStartPort;
        connector.endPort = this.currentHoverPort;
      }else if(this.currentHoverPort.direction == 'output') {

        if(this.currentHoverPort.connector != null) {
          this.currentHoverPort.connector.endPort.connector = null;
          this.connectors.remove(this.currentHoverPort.connector);
        }

        this.currentHoverPort.connectedPort = this.currentHoverPort;
        this.currentHoverPort.updatePortConnectStatusElement();
        this.currentHoverPort.connector = connector;
        this.connectingStartPort.connector = connector;
        this.connectingStartPort.updatePortConnectStatusElement();

        connector.startPort = this.currentHoverPort;
        connector.endPort = this.connectingStartPort;
      }

      this.connectingStartPort = null;

      //添加线段
      this.connectors.push(connector);
    }

    this.isConnecting = false;
    
    if(this.connectingStartPort != null) {
      this.connectingStartPort.forceDotActiveState = false;
      this.connectingStartPort.forceDotErrorState = false;
      this.connectingStartPort.updatePortConnectStatusElement();
      this.connectingStartPort = null;
    }
  }
  public updateConnectEnd(posDocunment : Vector2) { 
    this.connectingEndPos.Set(posDocunment.x + this.viewPort.x, 
      posDocunment.y + this.viewPort.y - this.toolBarHeight); 
  }
  public updateCurrentHoverPortLeave(port : BlockPort) {
    if(this.currentHoverPort == port) {
      if(port != this.connectingStartPort) {
        this.currentHoverPort.forceDotErrorState = false;
        this.currentHoverPort.forceDotActiveState = false;
        this.currentHoverPort.updatePortConnectStatusElement();
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
      this.currentHoverPort.forceDotErrorState = false;
      this.currentHoverPort.forceDotActiveState = false;
      this.currentHoverPort.updatePortConnectStatusElement();
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
      this.currentHoverPort.forceDotErrorState = false;
      this.currentHoverPort.forceDotActiveState = true;
      this.connectingIsFail = false;
    }else {
      this.currentHoverPort.forceDotErrorState = true;
      this.currentHoverPort.forceDotActiveState = false;
      this.connectingIsFail = true;
    }
    this.currentHoverPort.updatePortConnectStatusElement();
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

  // 测试
  //=======================

  private test2() {
    this.viewPort.y--;
    this.recalcViewPort();
  }  
  private test1() {
    this.viewPort.y++;
    this.recalcViewPort();
  }
  private test3() {
    this.addBlock(new Block(this, this.getRegisteredBlock("DDDB2039-9876-15D1-3410-FCD04941C750")), this.viewPort.calcCenter());
  }

  private initDebug() {
    this.registerBlock({
      guid: "DDDB2039-9876-15D1-3410-FCD04941C750",
      name: "Test block",
      description: "This is a single block. Useage: unknow.",
      logo: "",
      logoRight: "",
      logoBottom: "",
      category: '测试',
      author: 'imengyu',
      version: '2.0',
      ports : [
        {
          name: "入口",
          description: '默认入口单元',
          direction: 'input',
          guid: 'CDEDC799'
        },
        {
          name: "出口",
          description: '默认出口单元',
          direction: 'output',
          guid: 'F8E71C0D'
        },
      ],
      parameters: [],
      onCreate: () => {},
      onPortActive : (block, port) => {},
      onParameterUpdate : (block, port) => {},
    }, false);
    this.registerBlock({
      guid: "31CCFD61-0164-015A-04B1-732F0A7D6661",
      name: "相加",
      description: "相加单元，相加两个或多个参数",
      logo: "",
      logoRight: "",
      logoBottom: "",
      category: '测试/工具',
      author: 'imengyu',
      version: '2.0',
      ports : [
        {
          name: "入口",
          description: '默认入口单元',
          direction: 'input',
          guid: 'CDEDC799'
        },
        {
          name: "出口",
          description: '默认出口单元',
          direction: 'output',
          guid: 'F8E71C0D'
        },
      ],
      parameters: [
        {
          name: "参数1",
          description: '',
          direction: 'input',
          guid: '732F0A7D',
          paramType: 'any',
          paramCustomType: ''
        },
        {
          name: "参数2",
          description: '',
          direction: 'input',
          guid: '0A7D6661',
          paramType: 'any',
          paramCustomType: ''
        },
        {
          name: "结果",
          description: '',
          direction: 'output',
          guid: '42DCF7F4',
          paramType: 'any',
          paramCustomType: ''
        },
      ],
      onCreate: () => {},
      onPortActive : (block, port) => {},
      onParameterUpdate : (block, port) => {},
    }, false);
    this.updateBlocksList();
  }

  // 块控制
  //=======================


  public addBlock(block : Block, position : Vector2, connectToPort ?: any) {
    this.blocks.push(block);

    block.create();
    block.setPos(position);
    
  }
  public deleteBlock(block : Block) {
    block.destroy();
    this.blocks.remove(block);
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

    BaseBlocks.register(this);

    this.initDebug();
    setTimeout(() => {
      this.onWindowSizeChanged();
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

  private parser : EditorFileParser

  public newFile() {

  }
  public saveFile() {
    console.log(this.parser.saveToString());
    alert('saveFile');
  }
  public loadFile() {
    
  }

}

</script>

