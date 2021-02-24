<template>
  <div>
    <div ref="blockHostBackground" class="flow-block-host" :style="{ 
      left: -viewPort.x + 'px', top: -viewPort.y + 'px' ,
      userSelect: (isMultiSelecting ? 'none' : 'unset'),
      transform: 'scale(' + viewZoom + ')'
    }" oncontextmenu="return false"> 
    </div>
    <slot />
    <div ref="blockHost" class="flow-block-host" :style="{ 
      left: -viewPort.x + 'px', top: -viewPort.y + 'px' ,
      userSelect: (isMultiSelecting ? 'none' : 'unset'),
      transform: 'scale(' + viewZoom + ')'
    }" oncontextmenu="return false"> 
    </div>
    <!--对话框-->
    <el-dialog :visible.sync="showDeleteModal" title="确定删除">
      <div style="text-align:center">
        你真的要删除选中的
        <span v-if="selectedBlocks.length>0"> {{ selectedBlocks.length }} 个单元</span>
        <span v-if="selectedConnectors.length>0">{{ selectedConnectors.length }} 个连接</span>
        吗？
      </div>
      <template #footer>
        <el-button class="p-button-danger" @click="deleteSelectedBlocks();showDeleteModal=false;">删除</el-button>
        <el-button @click="showDeleteModal=false" autofocus>取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Rect } from "../../model/Rect";
import { Vector2 } from "../../model/Vector2";
import { BlockPort, BlockPortDirection } from "../../model/Define/Port";
import { ConnectorEditor } from "../../model/Editor/ConnectorEditor";
import { BlockEditor } from "../../model/Editor/BlockEditor";
import { BlockGraphDocunment, BlockDocunment } from "../../model/Define/BlockDocunment";
import { BlockRunner } from "../../model/WorkProvider/Runner";
import { BlockEditorOwner } from "../../model/Editor/BlockEditorOwner";
import { Connector } from "../../model/Define/Connector";
import { BlockBreakPoint } from "../../model/Define/Block";
import { BlockParameterSetType, BlockParameterType } from "../../model/Define/BlockParameterType";
import { BlockPortEditor } from "../../model/Editor/BlockPortEditor";
import { BlockParameterTypeConverterData } from "../../model/Define/BlockDef";
import ParamTypeServiceInstance from "../../sevices/ParamTypeService";
import BaseBlocks from "../../model/Blocks/BaseBlocks";
import MathUtils from "../../utils/MathUtils";
import HtmlUtils from "../../utils/HtmlUtils";
import CommonUtils from "../../utils/CommonUtils";
import BlockEditorCanvasDrawer from "./BlockEditorCanvasDrawer.vue";

export interface FilterByPortData {
  filterByPortDirection: BlockPortDirection,
  filterByPortType : BlockParameterType,
  filterByPortKeyType : BlockParameterType,
  filterSrcPort: BlockPort,
  filterByPortCustomType : BlockParameterSetType
}

/**
 * 编辑器逻辑控制
 */
@Component
export default class BlockEditorWorker extends Vue {

  @Prop({default: null}) viewPort : Rect;
  @Prop({default: 1}) viewZoom : number;
  @Prop({default: 100}) viewScale: number;

  //
  
  @Prop({ default: null }) currentGraph : BlockGraphDocunment;
  @Prop({ default: null }) currentDocunment : BlockDocunment;
  @Prop({ default: null }) blocks : Array<BlockEditor>;
  @Prop({ default: null }) connectors : Array<ConnectorEditor>;
  @Prop({ default: null }) runner : BlockRunner;
  @Prop({ default: null }) editorCanvas : BlockEditorCanvasDrawer;

  // 逻辑控制
  //=======================

  isMultiSelecting = false;
  isMoveBlock = false;
  isDragView = false;

  isMultiSelected = false;
  isMoveedBlock = false;

  selectedBlocks : Array<BlockEditor> = [];
  selectedConnectors : Array<ConnectorEditor> = [];
  multiSelectedBlocks : Array<BlockEditor> = [];

  // 鼠标逻辑控制
  //=======================

  isMouseMoved = false;

  multiSelectRect : Rect = null;
  @Prop({ default: false }) mouseLeftMove : boolean;

  mouseDowned = false;
  mouseDownPos = new Vector2();
  mouseDownPosInViewPort = new Vector2();
  mouseDownViewPortPos = new Vector2();
  mouseDownBlockPos = new Vector2();
  mouseCurrentPos = new Vector2();
  mouseCurrentPosInViewPort = new Vector2();

  /**
   * 获取选中的单元数
   */
  public getSelecteBlockCount() {
    return this.selectedBlocks.length;
  }
  /**
   * 获取是否有任意一个单元或连接被选中
   */
  public hasSelected() {
    return this.selectedBlocks.length > 0 || this.selectedConnectors.length > 0
  }
  /**
   * 获取多选选中的单元
   */
  public getMultiSelectedBlocks()  { 
    return this.multiSelectedBlocks; 
  }
  /**
   * 获取在区域中的单元
   * @param rectSelect 区域，坐标为视口绝对坐标
   */
  public getBlocksInRect(rectSelect : Rect) {
    let blocks = new Array<BlockEditor>();
    let rect = new Rect();

    for(var i = 0, c = this.blocks.length; i < c; i++) {
      let block = this.blocks[i];

      rect.Set(block.position.x, block.position.y, block.size.x, block.size.y);
      rect.multiply(this.viewZoom);

      if(rect.testRectCross(rectSelect)) 
          blocks.push(this.blocks[i]);     
    }

    return blocks;
  }
  /**
   * 获取选中的单元
   */
  public getSelectedBlocks()  { 
    return this.selectedBlocks; 
  }
  /**
   * 获取选中的连接线
   */
  public getSelectedConnectors()  { 
    return this.selectedConnectors; 
  }
  /**
   * 获取第一个选中的单元
   */
  public getOneSelectedBlock() {
    if(this.selectedBlocks.length == 1) 
      return this.selectedBlocks[0];
    return null;
  }
  /**
   * 获取第一个选中的连接线
   */
  public getOneSelectedConnector() {
    if(this.selectedConnectors.length > 0) 
      return this.selectedConnectors[0];
    return null;
  }
  /**
   * 选中一些单元
   */
  public selectSomeBlocks(blocks : Array<BlockEditor>) {
    this.unSelectAllBlocks();
    for(var i=0;i<blocks.length;i++)  {
      blocks[i].updateSelectStatus(true);
      this.selectedBlocks.push(blocks[i]);
    }
    this.$emit('update-select-state');
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
    this.selectedConnectors.empty();
    this.$emit('update-select-state');
  }

  private selectOneConnector() {
    for(let i = 0, c = this.connectors.length;i<c;i++) {
      if(this.connectors[i].hover){
        this.connectors[i].selected = true;
        this.selectedConnectors.push(this.connectors[i]);
        return true;
      }
    }
    return false;
  }
  private testCastConnector() {
    for(let i = 0, c= this.connectors.length;i<c;i++)
      this.connectors[i].hover = (this.connectors[i].testInConnector(this.mouseCurrentPosInViewPort, this.viewZoom));
  }
  private updateAllSelectedElements() {
    //Updste all MultiSelect eles
    this.selectedBlocks.empty();
    for(var i=0;i<this.blocks.length;i++)
      if(this.blocks[i].selected){
        this.blocks[i].updateLastPos();
        this.selectedBlocks.push(this.blocks[i]);
      }
    this.selectedConnectors.empty()
    for(let i = 0, c= this.connectors.length;i<c;i++)
      if(this.connectors[i].hover)
        this.selectedConnectors.push(this.connectors[i]);
  }
  
  //更新鼠标坐标
  public updateMousePos(e : MouseEvent) {
    this.mouseCurrentPos.x = e.clientX - this.editorHostAbsolutePos.x;
    this.mouseCurrentPos.y = e.clientY - this.editorHostAbsolutePos.y;
    this.mouseCurrentPosInViewPort.x = this.viewPort.x + (e.clientX - this.editorHostAbsolutePos.x);
    this.mouseCurrentPosInViewPort.y = this.viewPort.y + (e.clientY - this.editorHostAbsolutePos.y);
  }
  /**
   * 获取鼠标当前坐标
   */
  public getMouseCurrentPos() {
    return this.mouseCurrentPos;
  }
  /**
   * 获取鼠标当前位于视口中的坐标
   */
  public getMouseCurrentPosInViewPort() {
    return this.mouseCurrentPosInViewPort;
  }

  //单元控制事件
  //=======================

  public onUserSelectBlock(block : BlockEditor, selectSingle : boolean) {
    if(selectSingle) {
      if(this.selectedBlocks.length > 0)
        for(var i=0;i<this.blocks.length;i++) 
          if(this.blocks[i] != block)
            this.blocks[i].updateSelectStatus(false);
      this.selectedBlocks.splice(0, this.selectedBlocks.length);
    }
    if(!this.selectedBlocks.contains(block))
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
    this.$emit('update-set-file-changed');
  }
  public onBlockDelete(block : BlockEditor) {
    if(this.selectedBlocks.contains(block)) {
      this.selectedBlocks.remove(block);
      this.$emit('update-select-state');
    }
    if(!block.forceNotUnConnect)
      block.allPorts.forEach((p) => p.unconnectAllConnector());
  }

  // 块控制
  //=======================

  /**
   * 添加单元
   * @param block 要添加的单元
   * @param position 目标位置
   * @param connectToPort 添加单元时指定该单元需要连接到的端口
   */
  public addBlock(block : BlockEditor, position : Vector2, connectToPort ?: BlockPort) {
    

    block.currentGraph = this.currentGraph;
    block.createBase();
    block.create(this.blockOwnerData);
    block.setPos(position);

    this.blocks.push(block);
    this.$emit('update-set-file-changed');
  }
  /**
   * 删除单元
   * @param block 要删除的单元
   * @param rm 是否从文档中移除，默认为 true
   */
  public deleteBlock(block : BlockEditor, rm = true) {

    block.destroy();
    
    this.$emit('on-delete-block', block);

    if (rm) {
      if(block.currentGraph == this.currentGraph)
        this.blocks.remove(block);
      else
        block.currentGraph.blocks.remove(block);
    }

    block.currentGraph = null;

    this.$emit('update-set-file-changed');
  }
  /**
   * 计算一些单元的矩形区域
   * @param blocks 要计算的单元
   */
  public calcBlocksRegion(blocks : BlockEditor[]) : Rect {
    let x : number = null, y : number = null, r : number = null, b : number = null;
    blocks.forEach((block) => {
      if(x == null || block.position.x < x) x = block.position.x;
      if(y == null || block.position.y < y) y = block.position.y;

      if(r == null || block.position.x + block.size.x > r) r = block.position.x + block.size.x;
      if(b == null || block.position.y + block.size.y > b) b = block.position.y + block.size.y;
    })
    return new Rect(x, y, r - x, b - y);
  }

  //链接控制事件
  //=======================

  isConnecting = false;
  isConnectingToNew = false;

  connectingIsFail = false;
  connectingStartPort : BlockPortEditor = null;
  connectingEndPos : Vector2 = null;
  connectingCanConnect = false;
  connectingShouldAddConverter = false;
  connectingNextAddConverter : BlockParameterTypeConverterData  = null;
  connectingFailedText = '';
  connectingSuccessText = '';

  private connectingOtherSideRequireType : BlockParameterType = null;
  private connectingOtherSideRequireKeyType : BlockParameterType = null;
  private connectingOtherSideRequireDirection : BlockPortDirection = null;
  private connectingOtherSideRequireParamSetType : BlockParameterSetType = null;
  private connectingSrcPort : BlockPort = null;

  currentHoverPort : BlockPortEditor = null;

  public currentSelectedBlock : BlockEditor = null;
  public currentSelectedPort : BlockPortEditor = null;

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
      if(startPort.paramType.isExecute() && startPort.connectedToPort.length >= 0)
        startPort.connectedToPort.forEach((d) => this.unConnectConnector(<ConnectorEditor>d.connector));
      //如果是参数端口，只能输入一条线路。取消连接之前的线路
      if(!startPort.paramType.isExecute() && endPort.connectedFromPort.length >= 0) 
        endPort.connectedFromPort.forEach((d) => this.unConnectConnector(<ConnectorEditor>d.connector));

      startPort.connectedToPort.push({
        port: endPort,
        connector: connector
      });
      (<BlockPortEditor>startPort).editorData.updatePortConnectStatusElement();
      (<BlockEditor>startPort.parent).invokeOnPortConnect(startPort, endPort);
      endPort.connectedFromPort.push({
        port: startPort,
        connector: connector
      });
      (<BlockPortEditor>endPort).editorData.updatePortConnectStatusElement();
      (<BlockEditor>endPort.parent).invokeOnPortConnect(endPort, startPort);

      connector.startPort = <BlockPortEditor>startPort;
      connector.endPort = <BlockPortEditor>endPort;
    }
    else if(endPort.direction == 'output') {

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
      if(endPort.paramType.isExecute() && endPort.connectedToPort.length > 0) 
        endPort.connectedToPort.forEach((d) => this.unConnectConnector(<ConnectorEditor>d.connector));
      //如果是参数端口，只能输入一条线路。
      if(!startPort.paramType.isExecute() && startPort.connectedFromPort.length > 0) 
        startPort.connectedFromPort.forEach((d) => this.unConnectConnector(<ConnectorEditor>d.connector));

      endPort.connectedToPort.push({
        port: startPort,
        connector: connector
      });
      (<BlockPortEditor>endPort).editorData.updatePortConnectStatusElement();
      (<BlockEditor>endPort.parent).invokeOnPortConnect(endPort, startPort);
      startPort.connectedFromPort.push({
        port: endPort,
        connector: connector
      });
      (<BlockPortEditor>startPort).editorData.updatePortConnectStatusElement();
      (<BlockEditor>startPort.parent).invokeOnPortConnect(startPort, endPort);

      connector.startPort = <BlockPortEditor>endPort;
      connector.endPort = <BlockPortEditor>startPort;
    }

    //添加线段
    if(connector != null) {
      connector.currentRunner = this.runner;
      this.connectors.push(connector);

      //更新弹性端口
      if(startPort.direction == 'input') 
        connector.flexableCoonIndex = (<BlockEditor>startPort.parent).testAndChangeFlexablePortType(startPort, endPort) ? ConnectorEditor.flexableCoonSource++ : 0;
      else if(endPort.direction == 'input') 
        connector.flexableCoonIndex = (<BlockEditor>endPort.parent).testAndChangeFlexablePortType(endPort, startPort) ? ConnectorEditor.flexableCoonSource++ : 0;
    }

    this.$emit('update-set-file-changed');
    
    return connector;
  }
  /**
   * 断开链接
   * @param connector 目标链接
   */
  public unConnectConnector(connector : ConnectorEditor) {
    this.connectors.remove(connector);
    this.selectedConnectors.remove(connector);

    if(connector.startPort != null) {
      connector.startPort.removeConnectToPort(connector.endPort);
      if(connector.endPort.editorData != null)
        connector.startPort.editorData.updatePortConnectStatusElement();
      (<BlockEditor>connector.startPort.parent).invokeOnPortUnConnect(connector.startPort);
    }
    if(connector.endPort != null) {
      connector.endPort.removeConnectByPort(connector.startPort);
      if(connector.endPort.editorData != null)
        connector.endPort.editorData.updatePortConnectStatusElement();
      (<BlockEditor>connector.endPort.parent).invokeOnPortUnConnect(connector.endPort);
    }

    this.$emit('update-set-file-changed');
  }

  //连接两个端口
  private connectConnectorWithConverter() {

    //创建转换器
    let convBlock = new BlockEditor(BaseBlocks.getScriptBaseConvertBlock());
    
    convBlock.options['coverterFrom'] = this.connectingNextAddConverter.fromType.toString();
    convBlock.options['coverterTo'] = this.connectingNextAddConverter.toType.toString();

    this.addBlock(
      convBlock, 
      MathUtils.calcVectorCenter(this.connectingStartPort.editorData.getPosition(), this.currentHoverPort.editorData.getPosition()) //计算两个端点的中心位置
    );

    //将两个端口连接至转换器上

    let startPot = this.connectingStartPort.direction === 'output' ? this.connectingStartPort : this.currentHoverPort;
    let endPot = this.currentHoverPort.direction === 'input' ? this.currentHoverPort : this.connectingStartPort;

    this.connectConnector(startPot, convBlock.getPortByGUID('INPUT'));
    this.connectConnector(convBlock.getPortByGUID('OUTPUT'), endPot);
  }

  /**
   * 刷新连接线所属端口的弹性端口数据
   */
  public flushConnectorFlexablePort(connector : ConnectorEditor) {
    let startPort = connector.startPort;
    let endPort = connector.endPort;
    (<BlockEditor>endPort.parent).testAndChangeFlexablePortType(endPort, startPort);
  }
  /**
   * 获取当前用户是否可以连接
   */
  public getCanConnect() { 
    return this.connectingCanConnect; 
  }
  public endConnectToNew(block ?: BlockEditor) : BlockPortEditor {
    let port : BlockPortEditor = null;
    if(typeof block != 'undefined') {
      port = <BlockPortEditor>block.getOnePortByDirectionAndType(this.connectingOtherSideRequireDirection,
          this.connectingOtherSideRequireType, this.connectingOtherSideRequireKeyType, this.connectingOtherSideRequireParamSetType, true);
      if(port != null)
        this.connectConnector(this.connectingStartPort, port);
    }

    this.isConnectingToNew = false;
    this.isConnecting = false;
    
    if(this.connectingStartPort != null) {
      (<BlockPortEditor>this.connectingStartPort).editorData.forceDotActiveState = false;
      (<BlockPortEditor>this.connectingStartPort).editorData.updatePortConnectStatusElement();
      this.connectingStartPort = null;
    }

    return port;
  }
  public startConnect(port : BlockPortEditor) {

    this.connectingStartPort = port;
    this.isConnecting = true;

    port.editorData.forceDotActiveState = true;
    port.editorData.updatePortConnectStatusElement();

    this.connectingOtherSideRequireDirection = port.direction == 'input' ? 'output' : 'input';
    this.connectingOtherSideRequireType = port.paramType;
    this.connectingOtherSideRequireKeyType = port.paramDictionaryKeyType;
    this.connectingOtherSideRequireParamSetType = port.paramSetType;
    this.connectingSrcPort = port;
  }
  public endConnect(port : BlockPort) {

    //连接到新的节点
    if(this.currentHoverPort == null && this.connectingStartPort != null) {

      this.$emit('update-add-block-panel-filter', <FilterByPortData>{
        filterByPortDirection: this.connectingOtherSideRequireDirection,
        filterByPortType : this.connectingOtherSideRequireType,
        filterByPortKeyType : this.connectingOtherSideRequireKeyType,
        filterSrcPort: this.connectingSrcPort,
        filterByPortCustomType : this.connectingOtherSideRequireParamSetType
      })

      this.$emit('show-add-block-panel-view-port-pos', this.connectingEndPos);
      this.isConnectingToNew = true;
      this.$emit('update-set-file-changed');
      return;
    }
    
    //检查
    if(this.connectingCanConnect && this.currentHoverPort != null && this.connectingStartPort != null) {

      //连接是否需要添加一个转换器
      if(this.connectingShouldAddConverter)
        this.connectConnectorWithConverter();
      else
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
      this.connectingEndPos.Set(posDocunment.x + this.viewPort.x - this.editorHostAbsolutePos.x, 
      posDocunment.y + this.viewPort.y - this.editorHostAbsolutePos.y); 
  }
  public updateCurrentHoverPortLeave(port : BlockPortEditor) {
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
  public updateCurrentHoverPort(port : BlockPortEditor) {
    if(port == this.connectingStartPort && port != null) {
      return;
    }

    if(this.currentHoverPort != null) {
      this.currentHoverPort.editorData.forceDotErrorState = false;
      this.currentHoverPort.editorData.forceDotActiveState = false;
      this.currentHoverPort.editorData.updatePortConnectStatusElement();
    }

    this.currentHoverPort = port;
    this.connectingShouldAddConverter = false;
    this.connectingNextAddConverter = null;
    this.connectingSuccessText = '';

    if(this.connectingStartPort == null){
      this.connectingIsFail = false;
      return;
    }

    //类型检查
    if(this.currentHoverPort.parent == this.connectingStartPort.parent){
      this.connectingCanConnect = false;
      this.connectingFailedText = '不能连接同一个单元的节点';
    }
    else{
      //方向必须不同才能链接
      this.connectingCanConnect = this.currentHoverPort.direction != this.connectingStartPort.direction;
      if(!this.connectingCanConnect) 
        this.connectingFailedText ='不能连接相同方向的节点';

      //参数类型检查
      if(this.connectingCanConnect) {

        if(this.currentHoverPort.direction == 'input') {
          this.connectingCanConnect = this.currentHoverPort.checkTypeAllow(this.connectingStartPort); 

          if(this.currentHoverPort.connectedFromPort.length > 0) 
            this.connectingSuccessText = '将会替换已有连接';
        }
        else if(this.connectingStartPort.direction == 'input') {
          this.connectingCanConnect = this.connectingStartPort.checkTypeAllow(this.currentHoverPort);

          if(this.connectingStartPort.connectedFromPort.length > 0) 
            this.connectingSuccessText = '将会替换已有连接';
        }

        //如果不能连接
        if(!this.connectingCanConnect) {
          let startPot = this.connectingStartPort.direction === 'output' ? this.connectingStartPort : this.currentHoverPort;
          let endPot = this.currentHoverPort.direction === 'input' ? this.currentHoverPort : this.connectingStartPort;
          //检查类型有没有转换器
          let converter = ParamTypeServiceInstance.getTypeCoverter(startPot.paramType, endPot.paramType);
          if(converter) {
            //有转换器
            if(this.connectingStartPort.paramSetType != this.connectingStartPort.paramSetType) 
              this.connectingFailedText = '端口集合类型不同，不能转换';
            else if(converter.allowSetType !== this.connectingStartPort.paramSetType)
              this.connectingFailedText = '转换器不支持端口集合类型';
            else {
              //设置转换器，在连接的时候会进行添加
              this.connectingShouldAddConverter = true;
              this.connectingNextAddConverter = converter;
              this.connectingCanConnect = true;
              this.connectingSuccessText = '转换 ' + 
                ParamTypeServiceInstance.getTypeNameForUserMapping(startPot.paramType) + 
                ' 至 ' + ParamTypeServiceInstance.getTypeNameForUserMapping(endPot.paramType);
            }
          } else  {
            //没有转换器，不兼容连接
            this.connectingFailedText = this.connectingStartPort.getTypeFriendlyString() + ' 与 ' + 
              this.currentHoverPort.getTypeFriendlyString() + ' 不兼容';
          }
        }
        else {
          //调用单元自己的检查函数检查是否可用连接
          let err = null;
          if(this.currentHoverPort.direction == 'input') {
            err = this.currentHoverPort.parent.onPortConnectCheck.invoke(this.currentHoverPort.parent, this.currentHoverPort, this.connectingStartPort); 
            this.connectingCanConnect = !CommonUtils.isDefinedAndNotNull(err);
          }else if(this.connectingStartPort.direction == 'input') {
            err = this.connectingStartPort.parent.onPortConnectCheck.invoke(this.connectingStartPort.parent, this.connectingStartPort, this.currentHoverPort); 
            this.connectingCanConnect = !CommonUtils.isDefinedAndNotNull(err);
          }
          //如果不能连接，则显示错误
          if(!this.connectingCanConnect) 
            this.connectingFailedText = err;
        }
      }
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
  /**
   * 获取当前鼠标悬浮的端口
   */
  public getCurrentHoverPort() : BlockPortEditor {
    return this.currentHoverPort;
  }
  /**
   * 取消连接单元所有的连接线
   * @param block 单元
   */
  public unConnectBlock(block : BlockEditor) {
    block.allPorts.forEach((p) => p.unconnectAllConnector());

    this.$emit('update-set-file-changed');
  }
  /**
   * 拉直连接线
   * @param port 参考端口
   * @param connector 要拉直的连接线
   */
  public straightenConnector(port : BlockPortEditor, connector : ConnectorEditor) {
    let refPos = port.editorData.getPosition();
    let block : BlockEditor;
    let oldPos : Vector2;

    if(connector.startPort == port) {
      block = connector.endPort.getParentBlock();
      oldPos = connector.endPort.editorData.getPosition();
    }
    else if(connector.endPort == port)  {
      block = connector.startPort.getParentBlock();
      oldPos = connector.startPort.editorData.getPosition();
    }

    if(block) {
      let offPos = oldPos.y - block.position.y;
      block.setPos(new Vector2(block.position.x, refPos.y - offPos));
    }

    this.$emit('update-set-file-changed');
  }
  /**
   * 获取当前鼠标是否悬浮在某个连接线上
   */
  public isAnyConnectorHover() {
    for(let i = 0, c= this.connectors.length;i<c;i++)
      if(this.connectors[i].hover)
        return true;
    return false;
  }

  //单元的操作
  //=======================

  /**
   * 取消选择选中的连接线
   */
  public unconnectSelectedConnectors() {
    this.selectedConnectors.forEach((c) => {
      this.unConnectConnector(c);
    });
    this.$emit('update-set-file-changed');
  }
  /**
   * 取消选择选中的单元
   */
  public unConnectSelectedBlock() {
    this.selectedBlocks.forEach((b) => this.unConnectBlock(b));
    this.$emit('update-set-file-changed');
  }
  /**
   * 断开端口的连接
   * @param block 要断开的端口
   */
  public unConnectPort(port : BlockPortEditor) {
    port.connectedToPort.forEach((b) => this.unConnectConnector(<ConnectorEditor>b.connector));
    port.connectedFromPort.forEach((b) => this.unConnectConnector(<ConnectorEditor>b.connector));
    this.$emit('update-set-file-changed');
  }
  /**
   * 刷新单元
   * @param block 要刷新的单元
   */
  public refreshBlock(block : BlockEditor) {
  }
  /**
   * 刷新选中的单元
   */
  public refreshSelectedBlock() {
    this.selectedBlocks.forEach((b) => this.refreshBlock(b));
  }

  /**
   * 对齐选中的单元
   * @param baseBlock 用来参考位置的单元
   * @param align 对齐轴
   */
  public alignSelectedBlock(baseBlock : BlockEditor, align : 'left'|'top'|'right'|'bottom'|'center-x'|'center-y') {
    switch(align) {
      case 'left':
        this.selectedBlocks.forEach((b) => b.setPos(new Vector2(baseBlock.position.x, b.position.y)));
        break;
      case 'top':
        this.selectedBlocks.forEach((b) => b.setPos(new Vector2(b.position.x, baseBlock.position.y)));
        break;
      case 'center-x': {
        let center = baseBlock.position.x + baseBlock.size.x / 2;
        this.selectedBlocks.forEach((b) => b.setPos(new Vector2(center + b.size.x / 2, b.position.y)));
        break;
      }
      case 'center-y': {
        let center = baseBlock.position.y + baseBlock.size.y / 2;
        this.selectedBlocks.forEach((b) => b.setPos(new Vector2(b.position.x, center + b.size.y / 2)));
        break;
      }
      case 'right': {
        let right = baseBlock.position.x + baseBlock.size.x;
        this.selectedBlocks.forEach((b) => b.setPos(new Vector2(right - baseBlock.size.x, b.position.y)));
        break;
      }
      case 'bottom': {
        let bottom = baseBlock.position.y + baseBlock.size.y;
        this.selectedBlocks.forEach((b) => b.setPos(new Vector2(b.position.x, bottom - baseBlock.size.y)));
        break;
      }
    }
    this.$emit('update-set-file-changed');
  }
  /**
   * 设置选中单元的断点状态
   * @param state 断点的状态 
   */
  public setSelectedBlockBreakpointState(state : BlockBreakPoint) {
    this.selectedBlocks.forEach((b) => {
      b.breakpoint = state;
      b.updateBreakPointStatus();
    });
    this.$emit('update-set-file-changed');
  }
  /**
   * 获取单元的所有连接线
   * @param block 要获取的单元
   */
  public getBlocksAllConnector(block : BlockEditor[])  { 
    let conn : Array<Connector> = []; 
    block.forEach((b) => {
      b.allPorts.forEach((p) => {
        if(p.connectedFromPort.length > 0)
          p.connectedFromPort.forEach((c) => {
            if(!conn.contains(c.connector))
              conn.push(c.connector);
          });
        if(p.connectedToPort.length > 0)
          p.connectedToPort.forEach((c) => {
            if(!conn.contains(c.connector))
              conn.push(c.connector);
          }); 
      });
    });
    return conn;
  }
  /**
   * 将端口提升为变量
   * @param port 端口
   */
  public makePortAsVariable(port : BlockPortEditor)  { 
    
  }
  /**
   * 为选中的单元创建一个注释块
   */
  public genCommentForSelectedBlock() {
    if(this.selectedBlocks.length > 0) {
      let rect = this.calcBlocksRegion(this.selectedBlocks);
      let block = new BlockEditor(BaseBlocks.getScriptBaseCommentBlock());
      block.position.Set(rect.x - 15, rect.y - 15);
      block.size.Set(rect.w + 30, rect.h + 30);

      this.addBlock(block, block.position);
    }
  }

  //编辑器鼠标事件
  //=======================

  editorHostAbsolutePos = new Vector2();

  private testEventInControl(e : Event){
    let target = (<HTMLElement>e.target);
    return (HtmlUtils.isEventInControl(e)
      || target.classList.contains('flow-block-no-move') 
      || target.classList.contains('param-editor') 
      || target.classList.contains('port-delete') 
      || target.classList.contains('port')
      || target.classList.contains('custom-editor'));
  }

  private onMouseDown(e : MouseEvent) {
    if(this.testEventInControl(e))
      return;

    this.editorHostAbsolutePos.x = HtmlUtils.getLeft(this.editorHost);
    this.editorHostAbsolutePos.y = HtmlUtils.getTop(this.editorHost);
    this.$emit('on-update-editor-host-absolute-pos', this.editorHostAbsolutePos);

    this.mouseDowned = true;
    this.mouseDownPos.x = e.x - this.editorHostAbsolutePos.x;
    this.mouseDownPos.y = e.y - this.editorHostAbsolutePos.y;
    this.updateMousePos(e);
    this.mouseDownPosInViewPort.Set(this.mouseCurrentPosInViewPort);

    this.isMultiSelected = false;
    this.isMoveedBlock = false;
    this.isMouseMoved = false;

    this.mouseDownViewPortPos.x = this.viewPort.x;
    this.mouseDownViewPortPos.y = this.viewPort.y;
    
    if(e.buttons == 1) {
      //多选
      if(this.mouseLeftMove) this.isDragView = true; //移动视图
      else {
        this.isMultiSelecting = true;
        this.multiSelectRect.Set(0,0,0,0);
      }
      
    }else if(e.buttons == 2) //移动视图
      this.isDragView = true;
    
    document.addEventListener('mouseup', <any>this.onMouseUpFn);
    document.addEventListener('mousemove', <any>this.onMouseMoveFn);
  }
  private onMouseUp(e : MouseEvent) {
    

    this.updateMousePos(e);

    document.removeEventListener('mouseup', <any>this.onMouseUpFn);
    document.removeEventListener('mousemove', <any>this.onMouseMoveFn);

    if(this.mouseDowned) {
      if(!this.isMultiSelected) {
        
        this.unSelectAllBlocks();
        this.unSelectAllConnectors();
        this.multiSelectedBlocks.empty();
        this.multiSelectRect.Set(0,0,0,0);

        if(this.selectOneConnector()) {
          this.$emit('update-select-state');
        } else {
          if(e.button == 2 && !this.isMouseMoved) {
            this.$emit('set-add-block-inpos', this.mouseCurrentPosInViewPort);
            this.$emit('clear-add-block-panel-filter');
            this.$emit('show-add-block-panel-at-pos', this.mouseCurrentPos);
          }
        }

      }else {   
        this.updateAllSelectedElements();
        this.$emit('update-select-state');
      }

      this.mouseDowned = false;
      this.isMoveBlock = false;
      this.isMultiSelecting = false;
      this.isDragView = false;
      this.isMouseMoved = false;
    }

  }
  private onMouseMoveAndDown(e : MouseEvent) {
    this.updateMousePos(e);

    if(!this.mouseCurrentPos.equal(this.mouseDownPos))
      this.isMouseMoved = true;

    if(this.mouseDowned && this.isMouseMoved) { 
      if(this.isMultiSelecting) {

        //多选框的方向处理
        {
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
        }

        if(this.multiSelectRect.w > 0 && this.multiSelectRect.h > 0) {
          let rect = new Rect();
          //选择单元
          for(var i = 0, c = this.blocks.length; i < c; i++) {

            let block = this.blocks[i];

            rect.Set(block.position.x, block.position.y, block.size.x, block.size.y);
            rect.multiply(this.viewZoom);

            this.blocks[i].updateSelectStatus(rect.testRectCross(this.multiSelectRect));

            if(this.blocks[i].selected) this.multiSelectedBlocks.push(this.blocks[i]);
            else this.multiSelectedBlocks.remove(this.blocks[i]);
          }
          this.isMultiSelected = true;
        }else this.isMultiSelected = false;

      } else if(this.isDragView) {
        //移动视图
        this.viewPort.x = this.mouseDownViewPortPos.x - (this.mouseCurrentPos.x - this.mouseDownPos.x);
        this.viewPort.y = this.mouseDownViewPortPos.y - (this.mouseCurrentPos.y - this.mouseDownPos.y);
        if(this.viewPort.x < 0) this.viewPort.x = 0;
        if(this.viewPort.y < 0) this.viewPort.y = 0;
        this.$emit('update-viewport');
      }
    }
  }
  private onMouseMove(e : MouseEvent) {
    if(!this.mouseDowned) {
      this.updateMousePos(e);
      this.testCastConnector();
    }
  }
  private onMouseWhell(e : WheelEvent) {  
    this.updateMousePos(e);
    this.$emit('on-mouse-zoom-view', e);
  }

  keyControlDown = false;
  keyAltDown = false;

  /**
   * 获取编辑器中 Ctrl 键是否按下
   */
  public getIsControlKeyDown() { return this.keyControlDown; }
  /**
   * 获取编辑器中 Alt 键是否按下
   */
  public getIsAltKeyDown() { return this.keyAltDown; }

  //编辑器键盘事件
  //=======================

  private onKeyDown(e : KeyboardEvent) {
    if(this.testEventInControl(e))
      return;
    switch(e.keyCode) {
      case 17://Ctrl
        this.keyControlDown = true;
        break;
      case 18://Alt
        this.keyAltDown = true;
        break;
    }
  }
  private onKeyUp(e : KeyboardEvent) {
    if(this.testEventInControl(e))
      return;
    switch(e.keyCode) {
      case 17://Ctrl
        this.keyControlDown = false;
        break;
      case 18://Alt
        this.keyAltDown = false;
        break;
      case 46://Delete
        this.showDeleteModalClick();
        break;
      default:
        this.$emit('on-editor-key', e.keyCode, e);
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
  /**
   * 删除选中的单元
   */
  public deleteSelectedBlocks() {
    this.selectedBlocks.concat().forEach((block) => this.deleteBlock(block));
    this.selectedConnectors.concat().forEach((connector) => this.unConnectConnector(connector));
    this.showDeleteModal = false;
  }

  //加载
  //=============================

  mounted() {
    setTimeout(() => {
      this.blockHost = <HTMLDivElement>this.$refs.blockHost;
      this.blockHostBackground = <HTMLDivElement>this.$refs.blockHostBackground;
      this.editorHost.addEventListener('mousedown', this.onMouseDown);
      this.editorHost.addEventListener('mouseup', this.onMouseUp);
      this.editorHost.addEventListener('mousemove', this.onMouseMove);
      this.editorHost.addEventListener('wheel', this.onMouseWhell);
      this.editorHostAbsolutePos.x = HtmlUtils.getLeft(this.editorHost);
      this.editorHostAbsolutePos.y = HtmlUtils.getTop(this.editorHost);
      this.$emit('on-update-editor-host-absolute-pos', this.editorHostAbsolutePos);
      document.addEventListener('keyup', this.onKeyUp);
      document.addEventListener('keydown', this.onKeyDown);
      this.multiSelectRect = new Rect();
      this.connectingEndPos = new Vector2();
      
    }, 300);
    setTimeout(() => {
      this.editorCanvas.addDebugInfoItem(() => 
        'mouseCurrentPos x: ' + this.mouseCurrentPos.x + ' y: ' + this.mouseCurrentPos.y
      );
      this.editorCanvas.addDebugInfoItem(() => 
        'mouseCurrentPosInViewPort x: ' + this.mouseCurrentPosInViewPort.x + ' y: ' + this.mouseCurrentPosInViewPort.y
      );
    }, 1000);

    this.onMouseUpFn = this.onMouseUp.bind(this);
    this.onMouseMoveFn = this.onMouseMoveAndDown.bind(this);
  }
  beforeDestroy() {
    if(this.editorHost) {
      this.editorHost.removeEventListener('mousedown', this.onMouseDown);
      this.editorHost.removeEventListener('mouseup', this.onMouseUp);
      this.editorHost.removeEventListener('mousemove', this.onMouseMove);
      this.editorHost.removeEventListener('wheel', this.onMouseWhell);
    }
    document.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('keydown', this.onKeyDown);
  }

  public getBlockHostElement(layer : string) { 
    switch(layer) {
      case '':
      case 'normal': return this.blockHost ;
      case 'background': return this.blockHostBackground ;
    }
    return null;
  }

  blockHost : HTMLDivElement;
  blockHostBackground : HTMLDivElement;
  @Prop({ default: null }) blockOwnerData : BlockEditorOwner;
  @Prop({ default: null }) editorHost : HTMLDivElement;
 
  //数据共享
  //=============================

  @Watch('isDragView') update_isDragView(v : any) { this.$emit('update-isDragView', v); }
  @Watch('isMultiSelecting') update_isMultiSelecting(v : any) { this.$emit('update-isMultiSelecting', v); }
  @Watch('isConnecting') update_isConnecting(v : any) { this.$emit('update-isConnecting', v); }
  @Watch('isConnectingToNew') update_isConnectingToNew(v : any) { this.$emit('update-isConnectingToNew', v); }
  @Watch('connectingIsFail') update_connectingIsFail(v : any) { this.$emit('update-connectingIsFail', v); }
  @Watch('connectingFailedText') update_connectingFailedText(v : any) { this.$emit('update-connectingFailedText', v); }
  @Watch('connectingSuccessText') update_connectingSuccessText(v : any) { this.$emit('update-connectingSuccessText', v); }
  @Watch('connectingCanConnect') update_connectingCanConnect(v : any) { this.$emit('update-connectingCanConnect', v); }
  @Watch('connectingStartPort') update_connectingStartPort(v : any) { this.$emit('update-connectingStartPort', v); }
  @Watch('connectingEndPos') update_connectingEndPos(v : any) { this.$emit('update-connectingEndPos', v); }
  @Watch('multiSelectRect') update_multiSelectRect(v : any) { this.$emit('update-multiSelectRect', v); }
  @Watch('currentHoverPort') update_currentHoverPort(v : any) { this.$emit('update-currentHoverPort', v); }


  onMouseUpFn : Function;
  onMouseMoveFn : Function;

}

</script>