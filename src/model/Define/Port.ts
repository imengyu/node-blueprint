import { Block } from "./Block";
import { Vector2 } from "../Vector2";
import { Connector } from "./Connector";
import { ConnectorEditor } from "../Editor/ConnectorEditor";
import { BlockPortRegData, BlockParameterEditorRegData } from "./BlockDef";
import { BlockEditor } from "../Editor/BlockEditor";
import { BlockRunLoopData } from "../WorkProvider/Runner";
import logger from "../../utils/Logger";

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
  /**
   * 端口ID
   */
  public guid = "";

  public constructor(block : Block) {
    this.parent = block;
  }

  /**
   * 获取端口的方向
   */
  public direction : BlockPortDirection = null;
  /**
   * 获取端口是否是动态添加的
   */
  public isDyamicAdd = false;

  public connectedFromPort : Array<BlockPortConnectorData> = [];
  public connectedToPort : Array<BlockPortConnectorData> = [];

  public parent : Block = null;
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
      (<BlockEditor>this.parent).unConnectPort(this);
  }
  public isPortConnected() { 
    if(this.direction == 'input')
      return this.connectedFromPort.length > 0;
    else if(this.direction == 'output')
      return this.connectedToPort.length > 0;

    return false;
  }


  //参数以及更新

  public paramType : BlockParameterType = 'any';
  public paramCustomType = '';
  public paramValue : any = null;
  public paramUserSetValue : any = null;
  public paramDefaultValue : any = null;

  public forceNoEditorControl = false;
  public forceEditorControlOutput = false;

  /**
   * 自定义单元数据供代码使用（不会保存至文件中）
   */
  public data = {

  };
  /**
   * 自定义参数端口属性供代码使用（会保存至文件中）
   */
  public options = {

  };

  /**
   * 循环更新参数端口
   * @param source 来源端口
   */
  public update(source ?: BlockPort) {

    if(this.paramType == 'execute') {
      logger.warning('[Port.update] Cannot update port '+ this.parent.guid + '-' + this.guid +' because it is execute port.');
      return;
    }

    if(this.direction == 'input') {
      if(typeof source != 'undefined')
        this.paramValue = source.paramValue;
      if(!this.parent.portUpdateLock) 
        this.parent.onPortUpdate.invoke(this.parent, this);
      if(this.parent.isEditorBlock) 
        //更新编辑器状态
        (<BlockEditor>this.parent).updatePortParamVal(this);
    }
    //更新下一级
    else if(this.direction == 'output' && this.connectedToPort.length > 0) {
      this.connectedToPort.forEach(element => {
        element.port.update(this);
        if(this.parent.isEditorBlock)
          (<BlockEditor>this.parent).updatePortParamVal(this);
          //激活编辑器状态
        if(this.parent.currentRunner && this.parent.isEditorBlock && this.parent.currentRunner.state != 'stopped') 
          (<ConnectorEditor>element.connector).active(this);
      });
    }
  }
  /**
   * 获取端口类型
   */
  public getParamType() {
    if(this.paramType == 'custom' || this.paramType == 'enum') 
      return this.paramCustomType;
    return this.paramType;
  }
  /**
   * 检查目标端口参数类型是否与本端口匹配
   * @param sourcePort 目标端口
   */
  public checkTypeAllow(sourcePort : BlockPort) : boolean {
    if(this.paramType == 'execute') 
      return sourcePort.paramType == 'execute';
    if(this.paramType == "any") 
      return sourcePort.paramType != 'execute';
    return (this.paramType == sourcePort.paramType && this.paramType != 'custom') || 
      (this.paramType == 'custom' && sourcePort.paramType == 'custom' && this.paramCustomType == sourcePort.paramCustomType) || 
      (this.paramType == 'enum' && sourcePort.paramType == 'enum' && this.paramCustomType == sourcePort.paramCustomType);
  }

  //执行激活

  /**
   * 在新队列中激活当前执行端口
   * （通常用于延时任务完成后的回调）
   */
  public activeInNewContext() {
    if(this.paramType != 'execute') {
      logger.warning('[Port.activeInNewContext] Cannot execute port '+ this.parent.guid + '-' + this.guid +' because it is not execute port.');
      return;
    }
    if(this.direction == 'output')
      this.parent.currentRunner.push(this, 'connector');
  }
  /**
   * 在当前队列中激活当前执行端口
   * @param runningContext 当前运行上下文
   */
  public active(runningContext : BlockRunLoopData) {

    if(this.paramType != 'execute') {
      logger.warning('[Port.active] Cannot execute port '+ this.parent.guid + '-' + this.guid +' because it is not execute port.');
      return;
    }

    if(this.direction == 'input') {

      //断点触发
      if(this.parent.breakpoint == 'enable' && runningContext.lastBreakPointPort != this) {
        if(runningContext.runner.markInterrupt(runningContext, this, this.parent))
          return;
      }

      runningContext.lastPort = this;
      runningContext.currentBlock = this.parent;

      this.parent.currentRunningContext = runningContext;
      this.parent.onPortActive.invoke(this.parent, this);

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

export class BlockPortConnectorData {
  public port : BlockPort = null;
  public connector : Connector = null;
}
export class BlockPortEditorData {
  public el : HTMLDivElement = null;
  public elDot : HTMLElement = null;
  public elSpan : HTMLSpanElement = null;
  public elEditor : HTMLElement = null;
  public elCustomEditor : HTMLElement = null;
  public elDeleteButton : HTMLElement = null;

  public forceDotErrorState = false;
  public forceDotActiveState = false;

  public block : BlockEditor = null;
  public parent : BlockPort = null;

  public editor : BlockParameterEditorRegData = null;

  public oldParamType : BlockParameterType = null;
  public oldParamCustomType = null;

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
export type BlockParameterType = 'execute'|'bigint'|'number'|'string'|'boolean'|'function'|'object'|'any'|'enum'|'custom';
