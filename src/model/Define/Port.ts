import { Block } from "./Block";
import { Vector2 } from "../Vector2";
import { Connector } from "./Connector";
import { BlockPortRegData, BlockParameterEditorRegData } from "./BlockDef";
import { BlockEditor } from "../Editor/BlockEditor";
import { BlockRunContextData } from "../WorkProvider/Runner";
import logger from "../../utils/Logger";
import CommonUtils from "../../utils/CommonUtils";

/**
 * 单元端口
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

  /**
   * 被连接的端口
   */
  public connectedFromPort : Array<BlockPortConnectorData> = [];
  /**
   * 连接至的端口
   */
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

  /**
   * 参数类型
   */
  public paramType : BlockParameterType = 'any';
  /**
   * 参数自定义类型
   */
  public paramCustomType = '';
  /**
   * 参数用户设置的值
   */
  public paramUserSetValue : any = null;
  /**
   * 参数默认值
   */
  public paramDefaultValue : any = null;
  /**
   * 参数是否引用传递
   */
  public paramRefPassing = false;

  public getUserSetValue() {
    if(CommonUtils.isDefined(this.paramUserSetValue))
      return this.paramUserSetValue;
    return this.paramDefaultValue;
  }

  private paramRefPassingPort : BlockPort = null;

  /**
   * 对于这个执行端口，是否在新上下文执行端口。
   */
  public executeInNewContext = false;

  /**
   * 获取当前端口变量在栈中的索引
   */
  public stack = -1;

  /**
   * 获取当前端口变量在栈中的数据。
   */
  public getValue() : any {
    
    if(this.paramRefPassingPort != null) //引用传递，直接获取数据
      return this.paramRefPassingPort.getValue();
    if(this.parent.currentRunningContext == null)
      return undefined;
    //遍历调用栈，找到数据
    let context = this.parent.currentRunningContext;
    do {
      if(this.stack < context.graphBlockParamStack.length) 
        return context.graphBlockParamStack[this.stack];
      else context = context.parentContext.graph == context.graph ? context.parentContext : null;
    } while(context ! = null);

    return undefined;
  }
  /**
   * 设置当前端口变量在栈中的数据。
   * 设置后必须调用 update 才能更新下一级。
   */
  public setValue(value) {
    if(this.parent.currentRunningContext == null)
      return undefined;
    let context = this.parent.currentRunningContext;
    do {
      if(this.stack < context.graphBlockParamStack.length) {
        let oldV = context.graphBlockParamStack[this.stack];
        if(oldV != value)
          context.graphBlockParamStack[this.stack] = value;
        return oldV;
      } else context = context.parentContext.graph == context.graph ? context.parentContext : null;
    } while(context != null);
    return undefined;
  }

  /**
   * 是否强制不显示编辑参数控件
   */
  public forceNoEditorControl = false;
  /**
   * 是否强制在输出端口显示编辑参数控件
   */
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
   * 循环更新参数端口。
   * 如果当前端口是入端口，则更新当前端口。
   * 如果当前端口是出端口，则更新已经连接的下一级端口。
   * @param source 来源端口
   * @param forceRef 是否强制引用传递。方向为output时无效。
   */
  public update(source ?: BlockPort, forceRef = false) {

    if(this.paramType == 'execute') {
      logger.warning('[Port.update] Cannot update port '+ this.parent.guid + '-' + this.guid +' because it is execute port.');
      return;
    }

    //上一级更新下来
    if(this.direction == 'input') {
      if(CommonUtils.isDefinedAndNotNull(source)) {
        if(forceRef || this.paramRefPassing) this.paramRefPassingPort = source;
        else {
          this.setValue(source.getValue());
          this.paramRefPassingPort = null;
        }
      }else this.paramRefPassingPort = null;

      if(!this.parent.portUpdateLock) this.parent.onPortUpdate.invoke(this.parent, this);
      if(this.parent.isEditorBlock) this.parent.onPortValueUpdate.invoke(this.parent, this);//更新事件
    }
    //更新下一级
    else if(this.direction == 'output' && this.connectedToPort.length > 0) {
      this.parent.onPortValueUpdate.invoke(this.parent, this);//更新事件
      this.connectedToPort.forEach(element => {
        element.port.update(this, element.port.paramRefPassing);//更新下一级
        this.parent.onPortConnectorActive.invoke(this, element.connector);//更新事件
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
    if(!this.executeInNewContext) {
      logger.warning('[Port.activeInNewContext] Cannot execute port '+ this.parent.guid + '-' + this.guid +' in new context because executeInNewContext is not set to true.');
      return;
    }
    if(this.direction == 'output') {
      let context = this.parent.currentRunner.push(this, this.parent.currentRunningContext, 'connector');
      context.graph = this.parent.currentRunningContext.graph;
    } else
      logger.warning('[Port.activeInNewContext] You try to execute port '+ this.parent.guid + '-' + this.guid +' that is a input port.');
  }
  /**
   * 在当前队列中激活当前执行端口
   * @param runningContext 当前运行上下文
   */
  public active(runningContext ?: BlockRunContextData) {

    if(this.paramType != 'execute') {
      logger.warning('[Port.active] Cannot execute port '+ this.parent.guid + '-' + this.guid +' because it is not execute port.');
      return;
    }

    if(this.direction == 'input') {

      if(!CommonUtils.isDefinedAndNotNull(runningContext)) {
        logger.warning('[Port.active] Cannot execute port '+ this.parent.guid + '-' + this.guid +' because runningContext was not provided.');
        return;
      }

      //断点触发
      if(this.parent.breakpoint == 'enable' && runningContext.lastBreakPointPort != this) {
        if(runningContext.runner.markInterrupt(runningContext, this, this.parent))
          return;
      }

      runningContext.lastPort = this;
      runningContext.currentBlock = this.parent;

      this.parent.enterBlock(this, runningContext);
      this.parent.onPortActive.invoke(this.parent, this);
      
    }
    else if(this.direction == 'output') {

      if(this.executeInNewContext && !CommonUtils.isDefinedAndNotNull(runningContext)) 
        this.activeInNewContext();
      else {
        if(!CommonUtils.isDefinedAndNotNull(runningContext)) {
          logger.warning('[Port.active] Cannot execute port '+ this.parent.guid + '-' + this.guid +' because runningContext was not provided.');
          return;
        }

        this.parent.leaveBlock(runningContext);

        runningContext.lastPort = this;
        runningContext.currentBlock = null;
        runningContext.runner.callNextConnectedPort(runningContext, this);
      }
    }            
  }
}




/**
 * 连接数据
 */
export class BlockPortConnectorData {
  public port : BlockPort = null;
  public connector : Connector = null;
}
/**
 * 编辑器使用数据
 */
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
