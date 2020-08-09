<template>
  <div>
    <div ref="blockHost" class="flow-block-host" :style="{ 
      left: -viewPort.x + 'px', top: -viewPort.y + 'px' ,
      userSelect: (isMultiSelecting ? 'none' : 'unset'),
      transform: 'scale(' + viewZoom + ')'
    }">

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
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Rect } from "../model/Rect";
import { BlockPort, BlockPortDirection, BlockParameteType, BlockPortType, BlockParameterPort } from "../model/Define/Port";
import { ConnectorEditor } from "../model/Editor/ConnectorEditor";
import { BlockEditor } from "../model/Editor/BlockEditor";
import { Vector2 } from "../model/Vector2";
import { BlockGraphDocunment } from "../model/Define/BlockDocunment";
import { BlockRunner } from "../model/WorkProvider/Runner";
import { BlockEditorOwner } from "../model/Editor/BlockEditorOwner";

/**
 * 编辑器逻辑控制
 */
@Component
export default class BlockEditorWorker extends Vue {

  @Prop({default: null}) viewPort : Rect;
  @Prop({default: 1}) viewZoom : number;
  @Prop({default: 100}) viewScale: number;

  //

  @Prop({ default: null }) currentDocunment : BlockGraphDocunment;
  @Prop({ default: null }) blocks : Array<BlockEditor>;
  @Prop({ default: null }) connectors : Array<ConnectorEditor>;
  @Prop({ default: null }) runner : BlockRunner;
 
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

  multiSelectRect : Rect = null;
  @Prop({ default: false }) mouseLeftMove : boolean;

  mouseDowned = false;
  mouseDownPos = new Vector2();
  mouseDownPosInViewPort = new Vector2();
  mouseDownViewPortPos = new Vector2();
  mouseDownBlockPos = new Vector2();
  mouseCurrentPos = new Vector2();
  mouseCurrentPosInViewPort = new Vector2();

  public hasSelected() {
    return this.selectedBlocks.length > 0 || this.selectedConnectors.length > 0
  }
  public getMultiSelectedBlocks()  { 
    return this.multiSelectedBlocks; 
  }
  /**
   * 获取选中的单元
   */
  public getSelectedBlocks()  { 
    return this.selectedBlocks; 
  }
  public getOneSelectedBlock() {
    if(this.selectedBlocks.length == 1) 
      return this.selectedBlocks[0];
    return null;
  }
  public getOneSelectedConnector() {
    if(this.selectedConnectors.length > 0) 
      return this.selectedConnectors[0];
    return null;
  }
  /**
   * 取消选中所有单元
   */
  public unSelectAllBlocks() {
    for(var i=0;i<this.blocks.length;i++) 
      this.blocks[i].updateSelectStatus(false);
    this.selectedBlocks.splice(0, this.selectedBlocks.length);
    this.$emit('update-select-state');
  }
  /**
   * 取消选中所有链接
   */
  public unSelectAllConnectors() {
    for(let i = 0, c= this.connectors.length;i<c;i++) 
      this.connectors[i].selected = false;
    this.selectedConnectors = [];
    this.$emit('update-select-state');
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
  //=======================

  public onUserSelectBlock(block : BlockEditor) {
    if(this.selectedBlocks.length > 0)
      for(var i=0;i<this.blocks.length;i++) 
        if(this.blocks[i] != block)
          this.blocks[i].updateSelectStatus(false);
    this.selectedBlocks.splice(0, this.selectedBlocks.length);
    this.selectedBlocks.push(block);
    this.$emit('update-select-state');
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
    if(this.selectedBlocks.contains(block)) {
      this.selectedBlocks.remove(block);
      this.$emit('update-select-state');
    }
    block.allPorts.forEach((p) => p.unconnectAllConnector());
  }

  // 块控制
  //=======================

  public addBlock(block : BlockEditor, position : Vector2, connectToPort ?: BlockPort) {
    this.blocks.push(block);

    block.create(this.blockOwnerData);
    block.setPos(position);

    this.$emit('update-set-file-changed');
  }
  public deleteBlock(block : BlockEditor, rm = true) {

    block.destroy();

    this.$emit('on-delete-block', block);

    if (rm) 
      this.blocks.remove(block);

    this.$emit('update-set-file-changed');
  }

  //链接控制事件
  //=======================

  isConnecting = false;
  isConnectingToNew = false;

  connectingIsFail : boolean = false;
  connectingStartPort : BlockPort = null;
  connectingEndPos : Vector2 = null;
  connectingCanConnect : boolean = false;
  connectingFailedText : string = '';

  private connectingOtherSideRequireType : BlockPortType = 'Behavior';
  private connectingOtherSideRequireDirection : BlockPortDirection = null;
  private connectingOtherSideRequireParamType : BlockParameteType = null;
  private connectingOtherSideRequireParamCustomType : string = null;

  currentHoverPort : BlockPort = null;

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

    this.$emit('update-set-file-changed');
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
    this.isConnecting = true;

    port.editorData.forceDotActiveState = true;
    port.editorData.updatePortConnectStatusElement();

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

      this.$emit('update-add-block-panel-filter', {
        filterByPort: this.connectingOtherSideRequireType == 'Behavior' ? this.connectingOtherSideRequireDirection : null,
        filterByParamPort: this.connectingOtherSideRequireType == 'Parameter' ? this.connectingOtherSideRequireDirection : null,
        filterByParamPortType : this.connectingOtherSideRequireParamType,
        filterByParamPortCustomType : this.connectingOtherSideRequireParamCustomType
      })

      this.$emit('show-add-block-panel-view-port-pos', this.connectingEndPos);
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

    this.$emit('update-set-file-changed');
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
        this.connectingFailedText ='不能连接相同方向的节点';

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
  //=======================

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
      if(this.mouseLeftMove) //移动视图
        this.isDragView = true;
      else {
        this.isMultiSelecting = true;
        this.multiSelectRect.Set(0,0,0,0);
      }
      
    }else if(e.buttons == 2) //移动视图
      this.isDragView = true;
    

    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
  }
  private onMouseUp(e : MouseEvent) {

    if(this.mouseDowned) {
      if(!this.isMultiSelected) {
        this.unSelectAllBlocks();
        this.unSelectAllConnectors();
        this.multiSelectedBlocks.empty();
        this.multiSelectRect.Set(0,0,0,0);

        if(e.button == 0)
          this.selectOneConnector();
        else if(!this.isDragView) {
          this.$emit('set-add-block-inpos', this.mouseDownViewPortPos);
          this.$emit('clear-add-block-panel-filter');
          this.$emit('show-add-block-panel-at-pos', this.mouseCurrentPos);
        }

      }else {
        this.selectedBlocks = [];
        for(var i=0;i<this.blocks.length;i++)
          if(this.blocks[i].selected){
            this.blocks[i].updateLastPos();
            this.selectedBlocks.push(this.blocks[i]);
          }
        this.$emit('update-select-state');
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
        this.$emit('update-viewport');
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
      if(oldScale <= 100 && this.viewScale + 5 > 100 && !this.keyControlDown)
        this.$emit('update:viewScale', 100);
      else if(this.viewScale > 200)
        this.$emit('update:viewScale', 200);
      else this.$emit('update:viewScale', this.viewScale + 5);
    }else if(e.deltaY > 0) {
      if(this.viewScale - 5 < 30) this.$emit('update:viewScale', 30);
      else this.$emit('update:viewScale', this.viewScale - 5)
    }

    this.$emit('update-viewport');
    this.updateMousePos(e);

    pos.x = pos.x * this.viewZoom - this.mouseCurrentPos.x;
    pos.y = pos.y * this.viewZoom - this.mouseCurrentPos.y;
    this.viewPort.setPos(pos);
  }

  keyControlDown = false;

  //编辑器键盘事件
  //=======================

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
      case 8://Backspace
      case 127://Delete
        this.showDeleteModalClick();
        break;

    }
  }

  //删除疑问对话框
  //=============================

  showDeleteModal = false;

  showDeleteModalClick() {
    if(this.hasSelected())
      this.showDeleteModal = true;
  }
  deleteSelectedBlocks() {
    this.selectedBlocks.forEach((block) => this.deleteBlock(block));
    this.selectedConnectors.forEach((connector) => this.unConnectConnector(connector));
    this.showDeleteModal = false;
  }

  //加载
  //=============================

  mounted() {
    setTimeout(() => {
      this.blockHost = <HTMLDivElement>this.$refs.blockHost;
      this.editorHost.addEventListener('mousedown', this.onMouseDown);
      this.editorHost.addEventListener('mouseup', this.onMouseUp);
      this.editorHost.addEventListener('wheel', this.onMouseWhell);
      document.addEventListener('keyup', this.onKeyUp);
      document.addEventListener('keydown', this.onKeyDown);
      this.multiSelectRect = new Rect();
      this.connectingEndPos = new Vector2();
    }, 300);
  }
  beforeDestroy() {
    this.editorHost.removeEventListener('mousedown', this.onMouseDown);
    this.editorHost.removeEventListener('mouseup', this.onMouseUp);
    this.editorHost.removeEventListener('wheel', this.onMouseWhell);
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('keydown', this.onKeyDown);
  }

  public getBlockHostElement() { return this.blockHost }

  blockHost : HTMLDivElement;
  @Prop({ default: null }) blockOwnerData : BlockEditorOwner;
  @Prop({ default: null }) editorHost : HTMLDivElement;
  @Prop({ default: 0 }) toolBarHeight : number;
  @Prop({ default: 0 }) toolBarWidth : number;
 
  //数据共享
  //=============================

  @Watch('isDragView') update_isDragView(v) { this.$emit('update-isDragView', v); }
  @Watch('isMultiSelecting') update_isMultiSelecting(v) { this.$emit('update-isMultiSelecting', v); }
  @Watch('isConnecting') update_isConnecting(v) { this.$emit('update-isConnecting', v); }
  @Watch('isConnectingToNew') update_isConnectingToNew(v) { this.$emit('update-isConnectingToNew', v); }
  @Watch('connectingIsFail') update_connectingIsFail(v) { this.$emit('update-connectingIsFail', v); }
  @Watch('connectingFailedText') update_connectingFailedText(v) { this.$emit('update-connectingFailedText', v); }
  @Watch('connectingCanConnect') update_connectingCanConnect(v) { this.$emit('update-connectingCanConnect', v); }
  @Watch('connectingStartPort') update_connectingStartPort(v) { this.$emit('update-connectingStartPort', v); }
  @Watch('connectingEndPos') update_connectingEndPos(v) { this.$emit('update-connectingEndPos', v); }
  @Watch('multiSelectRect') update_multiSelectRect(v) { this.$emit('update-multiSelectRect', v); }
  @Watch('currentHoverPort') update_currentHoverPort(v) { this.$emit('update-currentHoverPort', v); }
}

</script>