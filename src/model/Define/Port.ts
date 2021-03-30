import { Block } from "./Block";
import { Vector2 } from "../Vector2";
import { Connector } from "./Connector";
import { BlockPortRegData, BlockParameterEditorRegData } from "./BlockDef";
import { BlockEditor } from "../Editor/BlockEditor";
import { BlockRunContextData } from "../Runner/BlockRunContextData";
import logger from "../../utils/Logger";
import CommonUtils from "../../utils/CommonUtils";
import ParamTypeServiceInstance, { ParamTypeService } from "../../sevices/ParamTypeService";
import { BlockParameterSetType, BlockParameterType } from "./BlockParameterType";
import { CustomStorageObject } from "./CommonDefine";

/**
 * 端口的方向
 * 
 * input：入端口，
 * output：出端口
 */
export type BlockPortDirection = 'input'|'output';

/**
 * 单元端口
 */
export class BlockPort {

  [index : string]: any;

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
        this.connectedToPort.remove(this.connectedToPort[i]);
      }
    }
  }
  public removeConnectByPort(port : BlockPort) { 
    for(let i = this.connectedFromPort.length - 1; i >= 0; i--) {
      if(this.connectedFromPort[i].port == port) {
        this.connectedFromPort.remove(this.connectedFromPort[i]);
      }
    }
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
  public portAnyFlexable : { [ index: string ] : boolean|{ get: string, set: string } } = {};

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
  public getName(withBlockName = true) {
    return `${withBlockName ? this.parent.getName(true) : ''}-${this.name}(${this.guid})`;
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
    if(this.paramStatic)
     return this.paramStaticValue;
    if(runningContext.graphBlockParamIndexs[this.stack] === -1) //未初始化栈
      return this.paramUserSetValue;

    //遍历调用栈，找到数据
    let context = runningContext;
    if(context == null) {
      logger.error(this.getName(), 'Port.getValue : Context not provided', logger.makeSrcPort(this))
      return undefined;
     }
    do {
      if(this.stack < context.graphBlockParamIndexs.length) 
        return context.graphBlockParamStack[context.graphBlockParamIndexs[this.stack]];
      else if(context != null && context.parentContext != null) 
        context = context.parentContext.graph == context.graph ? context.parentContext : null;  
      else context = null;                                                                           
    } while(context != null);

    
    logger.error(this.getName(), 'Port.getValue : Not found param in context (Position: ' + this.stack + ')', logger.makeSrcPort(this))
    return undefined;
  }
  /**
   * 设置当前端口变量在栈中的数据。
   * 设置后必须调用 updateOnputValue 才能更新下一级。
   */
  public setValue(runningContext: BlockRunContextData, value : any) {
    if(this.paramStatic) {
      let oldV = this.paramStaticValue;
      if(oldV !== value) this.paramStaticValue = value;
      return oldV;
    }
    if(runningContext.graphBlockParamIndexs[this.stack] === -1) {//未初始化栈
      logger.error(this.getName(), 'Port.setValue : Port stack not initialized', logger.makeSrcPort(this))
      return undefined;
    }
    let context = runningContext;
    if(context == null) {
      logger.error(this.getName(), 'Port.setValue : Context not provided', logger.makeSrcPort(this))
      return undefined;
    }
    do {
      if(this.stack < context.graphBlockParamIndexs.length) {
        let index = context.graphBlockParamIndexs[this.stack];
        let oldV = context.graphBlockParamStack[index];
        if(oldV !== value)
          context.graphBlockParamStack[index] = value;
        return oldV;
      } else if(context != null && context.parentContext != null) 
        context = context.parentContext.graph == context.graph ? context.parentContext : null;
      else context = null;
    } while(context != null);

    logger.error(this.getName(), 'Port.setValue : Not found param in context (Position: ' + this.stack + ')', logger.makeSrcPort(this))
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
   * 强制不检查循环调用
   */
  public forceNoCycleDetection = false;

  /**
   * 获取当前端口是不是在编辑器模式中
   */
  public isEditorPort = false;

  /**
   * 自定义单元数据供代码使用（不会保存至文件中）
   */
  public data : CustomStorageObject = {};
  /**
   * 自定义参数端口属性供代码使用（会保存至文件中）
   */
  public options : CustomStorageObject = {};

  /**
   * 获取当前端口已缓存的参数（仅有上下文单元）
   * @param runningContext 正在运行的上下文
   */
  public getValueCached(runningContext: BlockRunContextData) {
    if(runningContext === null) {
      logger.error(this.getName(), 'Port.getValueCached: Must provide a context in non-context block.');
      return undefined;
    }
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
    return null;
  }
  /**
   * 强制请求出端口参数
   * @param runningContext 正在运行的上下文
   */
  public rquestOutputValue(runningContext: BlockRunContextData) {
    if(runningContext === null) {
      logger.error(this.getName(), 'Port.rquestOutputValue: Must provide a context in non-context block.');
      return undefined;
    }
    let retVal = this.parent.onPortParamRequest.invoke(this.parent, this, runningContext);
    return CommonUtils.isDefined(retVal) ? retVal : this.getValueCached(runningContext);
  }
  /**
   * 请求当前入端口参数
   * @param runningContext 正在运行的上下文
   */
  public rquestInputValue(runningContext: BlockRunContextData) {

    if(this.direction !== 'input') {
      logger.error(this.getName(), 'Port.rquestInputValue: Can not rquestInputValue on a non-input port.');
      return undefined;
    }
    if(runningContext === null && this.parent.currentRunningContext === null) {
      logger.error(this.getName(), 'Port.rquestInputValue: Must provide a context in non-context block.');
      return undefined;
    }

    //没有连接，仅请求当前端口参数
    if(this.connectedFromPort.length == 0)
      return this.getValue(runningContext);

    //请求连接的端口参数
    let port = this.connectedFromPort[0].port;
    let retVal = port.parent.onPortParamRequest.invoke(port.parent, port, runningContext);

    //端口是直接回传数据，直接回传
    if(CommonUtils.isDefined(retVal) )
      return retVal;

    //检测直接引用请求
    if(this.paramRefPassing || port.paramRefPassing || this.parent.currentRunningContext === null) {
      return CommonUtils.isDefined(retVal) ? retVal : port.getValue(runningContext);
    }

    //防止循环更新
    let connector = this.connectedFromPort[0].connector;
    let iChangedChangedContext = connector.checkParamChangedChangedContext(runningContext);
    if(iChangedChangedContext >= 0) {
      let v = CommonUtils.isDefined(retVal) ? retVal : port.getValue(runningContext);
      this.setValue(runningContext, v);
      connector.deleteParamChangedChangedContext(iChangedChangedContext);
      return v;
    } else {
      //重复请求时只返回当前数据
      let thisValue = this.getValue(runningContext);
      if(CommonUtils.isDefinedAndNotNull(thisValue)) {
        return thisValue
      } else {
        let v = CommonUtils.isDefined(retVal) ? retVal : port.getValue(runningContext);
        this.setValue(runningContext, v);
        return v;
      }
    }
  }
  /**
   * 更新当前出端口参数值
   * @param runningContext 正在运行的上下文
   * @param v 参数值
   */
  public updateOnputValue(runningContext: BlockRunContextData, v : any)  {
    if(this.direction != 'output') {
      logger.warning(this.getName(), 'Port.updateOnputValue: Can not updateOnputValue on a non-output port.');
      return;
    }
    if(runningContext === null) {
      logger.error(this.getName(), 'Port.updateOnputValue: Must provide a context in non-context block.');
      return;
    }
    if(CommonUtils.isDefined(v) && runningContext.graphBlockParamIndexs[this.stack] >= 0)
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
      logger.error(this.getName(),'Port.activeInNewContext: Cannot execute port because it is not execute port.');
      return;
    }
    if(!this.executeInNewContext) {
      logger.error(this.getName(),'Port.activeInNewContext: Cannot execute port in new context because executeInNewContext is not set to true.');
      return;
    }
    let context = this.parent.currentRunningContext;
    context.runner.activeOutputPortInNewContext(context, this);
  }
  /**
   * 在当前队列中激活当前执行端口
   * @param runningContext 当前运行上下文
   */
  public active(runningContext: BlockRunContextData) {
    if(!this.paramType.isExecute()) {
      logger.error(this.getName(), 'Port.active: Cannot execute port because it is not execute port.');
      return;
    }
    if(this.direction == 'input') 
      runningContext.runner.activeInputPort(runningContext, this);
    else if(this.direction == 'output')
      runningContext.runner.activeOutputPort(runningContext, this);        
  }
}

/**
 * 连接数据
 */
export class BlockPortConnectorData {
  public port : BlockPort = null;
  public connector : Connector = null;
}


