import CommonUtils from "../utils/CommonUtils";
import { Block } from "./Block";
import { Vector2 } from "./Vector2";
import { Connector, ConnectorEditor } from "./Connector";
import { BlockPortRegData, BlockParameterEditorRegData } from "./BlockDef";
import { BlockEditor } from "./BlockEditor";
import { BlockRunLoopData } from "./Runner";

/**
 * 单元节点
 */
export class BlockPort {

  /**
   * 名称
   */
  public name = "";
  /**
   * 说明
   */
  public description = "This is a block port. Useage: unknow.";
  public guid = "";

  public constructor(block : Block) {
    this.parent = block;
  }

  public direction : BlockPortDirection = null;
  public isDyamicAdd = false;

  public connectedFromPort : Array<BlockPortConnectorData> = [];
  public connectedToPort : Array<BlockPortConnectorData> = [];

  public parent : Block = null;
  public type : BlockPortType = null;
  public regData : BlockPortRegData = null;

  public editorData : BlockPortEditorData = null;

  public isConnectToPort(port : BlockPort) : BlockPortConnectorData { 
    for(let i = this.connectedToPort.length - 1; i >= 0; i--) {
      if(this.connectedToPort[i].port == port)
        return this.connectedToPort[i];
    }
    return null;
  }
  public isConnectByPort(port : BlockPort) : BlockPortConnectorData { 
    for(let i = this.connectedFromPort.length - 1; i >= 0; i--) {
      if(this.connectedFromPort[i].port == port)
        return this.connectedFromPort[i];
    }
    return null;
  }
  public removeConnectToPort(port : BlockPort) { 
    for(let i = this.connectedToPort.length - 1; i >= 0; i--) {
      if(this.connectedToPort[i].port == port) {
        this.connectedToPort.remove(i);
        return;
      }
    }
  }
  public removeConnectByPort(port : BlockPort) { 
    for(let i = this.connectedFromPort.length - 1; i >= 0; i--) {
      if(this.connectedFromPort[i].port == port) {
        this.connectedFromPort.remove(i);
        return;
      }
    }
  }
  public unconnectAllConnector() { 
    if(this.parent.isEditorBlock)
      this.parent.unConnectPort(this);
  }
  public isPortConnected() { 
    if(this.direction == 'input')
      return this.connectedFromPort.length > 0;
    else if(this.direction == 'output')
      return this.connectedToPort.length > 0;

    return false;
  }
}
export class BlockPortConnectorData {
  public port : BlockPort = null;
  public connector : Connector = null;
}
export class BlockPortEditorData {
  public el : HTMLDivElement = null;
  public elDot : HTMLElement = null;
  public elSpan : HTMLSpanElement = null;
  public elEditor : HTMLElement = null;
  public elDeleteButton : HTMLElement = null;

  public forceDotErrorState = false;
  public forceDotActiveState = false;

  public block : BlockEditor = null;
  public parent : BlockPort = null;

  public editor : BlockParameterEditorRegData = null;

  private pos = new Vector2();
  
  public getPosition() {
    this.pos.Set(this.block.position.x + this.elDot.offsetLeft + this.elDot.offsetWidth / 2,  
      this.block.position.y + this.elDot.offsetTop + this.elDot.offsetHeight / 2 + 4);
    return this.pos;
  }

  public updatePortConnectStatusElement() {
    this.block.updatePortConnectStatusElement(this.parent);
  }
}

export type BlockPortType = 'Behavior'|'Parameter';
export type BlockPortDirection = 'input'|'output';
export type BlockParameteType = 'bigint'|'number'|'string'|'boolean'|'function'|'object'|'any'|'enum'|'custom';

/**
 * 行为单元节点
 */
export class BlockBehaviorPort extends BlockPort {
  constructor(block : Block) {
    super(block);
    this.type = 'Behavior';
  }

  public activeInNewContext() {
    if(this.direction == 'output')
      this.parent.currentRunner.push(this, 'connector');
  }
  public active(runningContext : BlockRunLoopData) {
    
    if(this.direction == 'input') {

      //断点触发
      if(this.parent.breakpoint == 'enable' && runningContext.lastBreakPointPort != this) {
        if(runningContext.runner.markInterrupt(runningContext, this, this.parent))
          return;
      }

      runningContext.lastPort = this;
      runningContext.currentBlock = this.parent;

      this.parent.currentRunningContext = runningContext;
      this.parent.onPortActive(this.parent, this);

      //编辑器状态更新
      if(this.parent.isEditorBlock)
        (<BlockEditor>this.parent).markActive();
    }
    else if(this.direction == 'output') {
      //编辑器状态更新
      if(this.parent.isEditorBlock)
        (<BlockEditor>this.parent).markDective();

      this.parent.currentRunningContext = null;

      runningContext.lastPort = this;
      runningContext.currentBlock = null;
      runningContext.runner.callNextConnectedPort(runningContext, this);
    }            
  }
}

/**
 * 参数单元节点
 */
export class BlockParameterPort extends BlockPort {
  constructor(block : Block) {
    super(block);
    this.type = 'Parameter';
  }

  public paramType : BlockParameteType = 'any';
  public paramCustomType = '';
  public paramValue : any = null;
  public paramUserSetValue : any = null;
  public paramDefaultValue : any = null;

  /**
   * 自定义参数端口属性供代码使用（会保存至文件中）
   */
  public options = {

  };

  public update(source ?: BlockParameterPort) {

    if(this.direction == 'input') {
      if(typeof source != 'undefined')
        this.paramValue = source.paramValue;
      this.parent.onParameterUpdate(this.parent, this);
      if(this.parent.isEditorBlock) 
        //更新编辑器状态
        (<BlockEditor>this.parent).updatePortParamVal(this);
    }
    //更新下一级
    else if(this.direction == 'output' && this.connectedToPort.length > 0) {
      this.connectedToPort.forEach(element => {
        (<BlockParameterPort>element.port).update(this);
        if(this.parent.isEditorBlock)
          (<BlockEditor>this.parent).updatePortParamVal(this);
          //激活编辑器状态
        if(this.parent.currentRunner && this.parent.isEditorBlock && this.parent.currentRunner.state != 'stopped') 
          (<ConnectorEditor>element.connector).active(this);
      });
    }
  }

  public getParamType() {
    if(this.paramType == 'custom' || this.paramType == 'enum') 
      return this.paramCustomType;
    return this.paramType;
  }
  public checkParameterAllow(sourcePort : BlockParameterPort) : boolean {
    if(this.paramType == "any") 
      return true;
    return (this.paramType == sourcePort.paramType && this.paramType != 'custom') || 
      (this.paramType == 'custom' && sourcePort.paramType == 'custom' && this.paramCustomType == sourcePort.paramCustomType) || 
      (this.paramType == 'enum' && sourcePort.paramType == 'enum' && this.paramCustomType == sourcePort.paramCustomType);
  }
}