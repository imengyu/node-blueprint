import { Block } from "./Block";
import { Vector2 } from "../Vector2";
import { Connector } from "./Connector";
import { BlockPortRegData, BlockParameterEditorRegData } from "./BlockDef";
import { BlockEditor } from "../Editor/BlockEditor";
import { BlockRunContextData } from "../WorkProvider/Runner";
import logger from "../../utils/Logger";
import CommonUtils from "../../utils/CommonUtils";
import ParamTypeServiceInstance, { ParamTypeService } from "../../sevices/ParamTypeService";
import { homedir } from "os";

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
  public isConnected() { 
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
  public paramType = new BlockParameterType('any');
  /**
   * 参数集合类型
   */
  public paramSetType : BlockParameterSetType = 'variable';
  /**
   * 当端口为Dictionary时的键类型
   */
  public paramDictionaryKeyType = new BlockParameterType('any');

  /**
   * 参数用户设置的值
   */
  public paramUserSetValue : any = null;
  /**
   * 参数默认值
   */
  public paramDefaultValue : any = null;
  /**
   * 参数是否引用传递(仅入端口)
   */
  public paramRefPassing = false;
  /**
   * 参数值是否为全局变量
   */
  public paramStatic = false;

  private paramStaticValue : any = null;
  public portAnyFlexable = {};

  public getUserSetValue() {
    if(CommonUtils.isDefined(this.paramUserSetValue))
      return this.paramUserSetValue;
    return this.paramDefaultValue;
  }
  public getTypeFriendlyString() {
    let str = '';
    let typeName = ParamTypeServiceInstance.getTypeNameForUserMapping(this.paramType.getType());
    if(this.paramSetType == 'dictionary')
      str = '<i>' + ParamTypeServiceInstance.getTypeNameForUserMapping(this.paramDictionaryKeyType.getType()) + '</i>到<i>' + typeName + '</i><b>的映射</b>';
    else if(this.paramSetType == 'array')
      str = typeName + '<b>数组</b>';
    else if(this.paramSetType == 'set')
      str = typeName + '<b>集</b>';
    else 
      str = typeName;
    return str;
  }

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
  public getValue(runningContext: BlockRunContextData) : any {
    if(this.paramStatic) return this.paramStaticValue;
    //遍历调用栈，找到数据
    let context = runningContext;
    if(context == null)
      return undefined;
    do {
      if(this.stack < context.graphBlockParamStack.length) 
        return context.graphBlockParamStack[this.stack];
      else if(context != null && context.parentContext != null) 
        context = context.parentContext.graph == context.graph ? context.parentContext : null;  
      else context = null;                                                                           
    } while(context != null);

    return undefined;
  }
  /**
   * 设置当前端口变量在栈中的数据。
   * 设置后必须调用 updateOnputValue 才能更新下一级。
   */
  public setValue(runningContext: BlockRunContextData, value) {
    if(this.paramStatic) {
      let oldV = this.paramStaticValue;
      if(oldV != value) this.paramStaticValue = value;
      return oldV;
    }
    let context = runningContext;
    if(context == null)
      return undefined;
    do {
      if(this.stack < context.graphBlockParamStack.length) {
        let oldV = context.graphBlockParamStack[this.stack];
        if(oldV != value)
          context.graphBlockParamStack[this.stack] = value;
        return oldV;
      } else if(context != null && context.parentContext != null) 
        context = context.parentContext.graph == context.graph ? context.parentContext : null;
      else context = null;
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
   * 获取当前端口已缓存的参数
   * @param runningContext 正在运行的上下文
   */
  public getValueCached(runningContext: BlockRunContextData) {
    if(this.direction == 'input') {
      if(this.connectedFromPort.length == 0)
        return this.getValue(runningContext);
      let port = this.connectedFromPort[0].port;
      if(this.paramRefPassing || port.paramRefPassing)
        return port.getValue(runningContext);
      return this.getValue(runningContext);
    }else if(this.direction == 'output') {
      return this.getValue(runningContext);
    }
  }
  /**
   * 强制请求出端口参数
   * @param runningContext 正在运行的上下文
   */
  public rquestOutputValue(runningContext: BlockRunContextData) {
    this.parent.onPortParamRequest.invoke(this.parent, this, runningContext);
    return this.getValueCached(runningContext);
  }
  /**
   * 请求当前入端口参数
   * @param runningContext 正在运行的上下文
   */
  public rquestInputValue(runningContext: BlockRunContextData) {
    if(this.direction != 'input') {
      logger.warning('[port.rquestInputValue] Can not rquestInputValue on a non-input port.');
      return undefined;
    }
    if(this.connectedFromPort.length == 0)
      return this.getValue(runningContext);

    let port = this.connectedFromPort[0].port;
    port.parent.onPortParamRequest.invoke(port.parent, port, runningContext);

    if(this.paramRefPassing || port.paramRefPassing)
      return port.getValue(runningContext);

    let connector = this.connectedFromPort[0].connector;
    let iChangedChangedContext = connector.checkParamChangedChangedContext(runningContext);
    if(iChangedChangedContext >= 0) {
      let v = port.getValue(runningContext);
      this.setValue(runningContext, v);
      connector.deleteParamChangedChangedContext(iChangedChangedContext);
      return v;
    } else if(!CommonUtils.isDefinedAndNotNull(this.getValue(runningContext))) {
      let v = port.getValue(runningContext);
      this.setValue(runningContext, v);
      return v;
    } else 
      return this.getValue(runningContext);
  }
  /**
   * 更新当前出端口参数值
   * @param runningContext 正在运行的上下文
   * @param v 参数值
   */
  public updateOnputValue(runningContext: BlockRunContextData, v) {
    if(this.direction != 'output') {
      logger.warning('[port.updateOnputValue] Can not updateOnputValue on a non-output port.');
      return undefined;
    }
    if(CommonUtils.isDefined(v))
      this.setValue(runningContext, v);
    this.connectedToPort.forEach((p) => {
      p.connector.paramChangedContext.addOnce(runningContext);
    });
  }
  /**
   * 检查当前入端口参数是否更改
   * @param runningContext 正在运行的上下文
   */
  public checkInputValueChanged(runningContext: BlockRunContextData) {
    let connector = this.connectedFromPort[0].connector;
    return connector.checkParamChangedChangedContext(runningContext) >= 0;
  }

  /**
   * 检查目标端口参数类型是否与本端口匹配
   * @param targetPort 目标端口
   */
  public checkTypeAllow(targetPort : BlockPort) : boolean {

    //判断是否是执行
    if(this.paramType.isExecute()) return targetPort.paramType.isExecute();
    if(targetPort.paramType.isExecute()) return this.paramType.isExecute();

    //判断集合类型是否一致
    if(this.paramSetType != targetPort.paramSetType) return false;

    //映射特殊处理
    if(this.paramSetType == 'dictionary') {

      return (this.paramType.equals(targetPort.paramType) || (this.paramType.isAny() || targetPort.paramType.isAny())) 
        && (this.paramDictionaryKeyType.equals(targetPort.paramDictionaryKeyType) || (this.paramDictionaryKeyType.isAny() || targetPort.paramDictionaryKeyType.isAny())) ;
    
    }else {

      //any判断
      if(this.paramType.isAny() && !targetPort.paramType.isExecute())
        return true;
      if(targetPort.paramType.isAny() && !targetPort.paramType.isExecute())
        return true;

      return this.paramType.equals(targetPort.paramType) && this.paramSetType == targetPort.paramSetType;
    }
  }

  //执行激活

  /**
   * 在新队列中激活当前执行端口
   * （通常用于延时任务完成后的回调）
   */
  public activeInNewContext() {
    if(!this.paramType.isExecute()) {
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

    if(!this.paramType.isExecute()) {
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
      this.parent.onPortExecuteIn.invoke(this.parent, this);
      
    }
    else if(this.direction == 'output') {

      if(this.executeInNewContext && !CommonUtils.isDefinedAndNotNull(runningContext)) 
        this.activeInNewContext();
      else {
        if(!CommonUtils.isDefinedAndNotNull(runningContext)) {
          logger.error('[Port.active] Cannot execute port '+ this.parent.guid + '-' + this.guid +' because runningContext was not provided.');
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
  public elDotIconLeft : HTMLElement = null;
  public elDotIconRight : HTMLElement = null;
  public elSpan : HTMLSpanElement = null;
  public elEditor : HTMLElement = null;
  public elCustomEditor : HTMLElement = null;
  public elDeleteButton : HTMLElement = null;

  public forceDotErrorState = false;
  public forceDotActiveState = false;

  public block : BlockEditor = null;
  public parent : BlockPort = null;

  public editor : BlockParameterEditorRegData = null;

  public oldParamType : string = null;
  public oldParamKeyType : string = null;
  public oldParamSetType : BlockParameterSetType = null;

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

/**
 * 端口的方向
 * 
 * input：入端口，
 * output：出端口
 */
export type BlockPortDirection = 'input'|'output';
/**
 * 端口参数基本类型
 * 
 * execute：执行
 * custom：自定义
 */
export type BlockParameterBaseType = 'execute'|'bigint'|'number'|'string'|'boolean'|'function'|'object'|'any'|'enum'|'custom';
/**
 * 端口参数的集合类型
 * 
 * variable：单个变量
 * array：数组
 * map：集合
 * dictionary：字典（映射）
 */
export type BlockParameterSetType = 'variable'|'array'|'set'|'dictionary';

/**
 * 端口参数类型
 */
export class BlockParameterType {

  public baseType : BlockParameterBaseType = 'any';
  public customType = '';

  public constructor(baseType : BlockParameterBaseType, customType = '') {
    this.set(baseType, customType);
  }

  public static createTypeFromString(name : string) : BlockParameterType {
    if(name == 'any')
      return BlockParameterType.Any();
    if(ParamTypeServiceInstance.isBaseType(name))
      return new BlockParameterType(<BlockParameterBaseType>name);
    return new BlockParameterType(ParamTypeServiceInstance.getBaseTypeForCustomType(name), name);
  }

  public static Any() { return new BlockParameterType('any') };

  public set(baseType : string|BlockParameterType, customType = '') {
    if(typeof baseType == 'string') {
      if(CommonUtils.isNullOrEmpty(customType)) {
        this.baseType = ParamTypeServiceInstance.getBaseTypeForCustomType(baseType);
        this.customType = baseType;
      }else {
        this.baseType = <BlockParameterBaseType>baseType;
        this.customType = customType;
      }
    }else {
      this.baseType = baseType.baseType;
      this.customType = baseType.customType;
    }
  }
  public getType() { return this.isCustom() ? this.customType : this.baseType; }
  public isExecute() { return this.baseType == 'execute'; }
  public isAny() { return this.baseType == 'any'; }
  public isCustom() { return (this.baseType == 'custom' || this.baseType == 'enum'); }
  public equals(otherType : BlockParameterType|string) {
    if(otherType == null) return false;
    if(otherType == this) return true;
    if(typeof otherType == 'string') return otherType == this.getType();
    return this.baseType == otherType.baseType && this.customType == otherType.customType;
  }

  public toString() {
    return this.getType();
  }
}


