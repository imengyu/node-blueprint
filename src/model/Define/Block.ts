import { BlockPortRegData, BlockRegData, } from "./BlockDef";
import { BlockPortDirection, BlockPort } from "./Port";

import { BlockRunContextData, BlockRunner } from "../WorkProvider/Runner";
import { EventHandler } from "../../utils/EventHandler";
import { BlockGraphDocunment } from "./BlockDocunment";
import { BlockEditor } from "../Editor/BlockEditor";
import logger from "../../utils/Logger";
import CommonUtils from "../../utils/CommonUtils";
import { Connector } from "./Connector";
import ParamTypeServiceInstance from "../../sevices/ParamTypeService";
import { BlockPortEditor } from "../Editor/BlockPortEditor";
import { BlockParameterSetType, BlockParameterType, cloneParameterTypeFromString, createParameterTypeFromString } from "./BlockParameterType";
import { CustomStorageObject } from "./CommonDefine";

/**
 * 基础单元定义
 */
export class Block {

  /**
   * 单元的GUID
   */
  public guid = "0";
  /**
   * 单元的唯一ID
   */
  public uid = ""
  /**
   * 自定义单元属性供代码使用（全局）（会保存至文件中）
   */
  public options : CustomStorageObject = {};
  /**
   * 自定义单元数据供代码使用（全局）（不会保存至文件中）
   */
  public data : CustomStorageObject = {};
  /**
   * 自定义单元变量供代码使用（单元局部）（不会保存至文件中）
   */
  public variables(context ?: BlockRunContextData) : CustomStorageObject {
    if(!CommonUtils.isDefined(context)) 
      context = this.currentRunningContext;
    //遍历调用栈  
    do {
      if(this.stack < context.graphBlockParamStack.length) 
        return context.graphBlockParamStack[this.stack].variables;
      else if(context != null && context.parentContext != null) 
        context = context.parentContext.graph == context.graph ? context.parentContext : null;//同一个图表中才能互相访问
      else context = null;
    } while(context != null);

    return undefined;
  }

  public stack = -1;

  /**
   * 块的类型
   */
  public type : BlockType = 'normal';
  /**
   * 块的断点触发设置
   */
  public breakpoint : BlockBreakPoint = 'none';

  public userCanResize = false;

  public constructor(regData ?: BlockRegData, editorBlock = false) {
    this.uid = CommonUtils.genNonDuplicateIDHEX(16);
    this.isEditorBlock = editorBlock;
    if(regData)
      this.regData = regData;
  }

  public createBase() {
    if(this.regData) {
      this.guid = this.regData.guid;
      this.type = this.regData.type;
      this.data = this.regData.settings.data;

      if(typeof this.regData.callbacks.onCreate == 'function') 
        this.onCreate.addListener(this,this.regData.callbacks.onCreate);
      if(typeof this.regData.callbacks.onDestroy == 'function') 
        this.onDestroy.addListener(this,this.regData.callbacks.onDestroy);
      if(this.isEditorBlock && typeof this.regData.callbacks.onEditorCreate == 'function') 
        this.onEditorCreate.addListener(this,this.regData.callbacks.onEditorCreate);
      if(typeof this.regData.callbacks.onStartRun == 'function') 
        this.onStartRun.addListener(this,this.regData.callbacks.onStartRun);

      if(typeof this.regData.callbacks.onPortExecuteIn == 'function') 
        this.onPortExecuteIn.addListener(this,this.regData.callbacks.onPortExecuteIn);
      if(typeof this.regData.callbacks.onPortParamRequest == 'function') 
        this.onPortParamRequest.addListener(this,this.regData.callbacks.onPortParamRequest);

      if(this.isEditorBlock){
        if(typeof this.regData.callbacks.onPortAdd == 'function') 
          this.onPortAdd.addListener(this,this.regData.callbacks.onPortAdd);
        if(typeof this.regData.callbacks.onPortRemove == 'function') 
          this.onPortRemove.addListener(this,this.regData.callbacks.onPortRemove);
        if(typeof this.regData.callbacks.onPortConnect == 'function') 
          this.onPortConnect.addListener(this,this.regData.callbacks.onPortConnect);
        if(typeof this.regData.callbacks.onPortUnConnect == 'function') 
          this.onPortUnConnect.addListener(this,this.regData.callbacks.onPortUnConnect);
        if(typeof this.regData.callbacks.onPortConnectCheck == 'function') 
          this.onPortConnectCheck.addListener(this,this.regData.callbacks.onPortConnectCheck);
        
        this.userCanResize = this.regData.blockStyle.userCanResize;
      }

      if(this.regData.ports.length > 0)
        this.regData.ports.forEach(element => this.addPort(element, false));
    }
    this.onCreate.invoke(this);
  }

  public regData : BlockRegData = null;
  /**
   * 获取当前单元是不是在编辑器模式中
   */
  public isEditorBlock = false;
  /**
   * 当前单元所在的运行上下文
   */
  public currentRunningContext : BlockRunContextData = null;
  /**
   * 当前单元所在的运行器
   */
  public currentRunner : BlockRunner = null;
  /**
   * 当前单元所在的图文档
   */
  public currentGraph : BlockGraphDocunment = null;


  //单元控制事件
  //===========================

  public onCreate = new EventHandler<OnBlockEventCallback>();
  public onEditorCreate = new EventHandler<OnBlockEditorEventCallback>();
  public onDestroy = new EventHandler<OnBlockEventCallback>();
  public onStartRun = new EventHandler<OnBlockEventCallback>();
  public onPortExecuteIn = new EventHandler<OnPortEventCallback>();
  public onPortParamRequest = new EventHandler<OnPortRequestCallback>();
  public onPortAdd = new EventHandler<OnPortEventCallback>();
  public onPortRemove = new EventHandler<OnPortEditorEventCallback>();

  public portUpdateLock = false;

  //上下文运行操作
  //===========================

  //进入块时的操作
  public enterBlock(port: BlockPort, context : BlockRunContextData) {
    this.currentRunningContext = context;
    this.currentRunningContext.stackCalls.push({
      block: this, port: port, childContext: null
    });
    this.onEnterBlock.invoke();
    if(this.isEditorBlock)
      this.allPorts.forEach((port) => {
        if(port.connectedFromPort.length == 1)
          this.onPortConnectorActive.invoke(port, port.connectedFromPort[0].connector);
      })
  }
  //退出块时的操作
  public leaveBlock(context : BlockRunContextData) {
    this.onLeaveBlock.invoke();
  }

  //节点操作
  //===========================

  public inputPorts : { [index: string]: BlockPort; } = {};
  public outputPorts : { [index: string]: BlockPort; } = {};
  public inputPortCount = 0;
  public outputPortCount = 0;
  public allPorts : Array<BlockPort> = [];
  public allPortsMap : Map<string, BlockPort> = new Map<string, BlockPort>();

  /**
   * 添加行为端口
   * @param data 行为端口数据
   * @param isDyamicAdd 是否是动态添加。动态添加的端口会被保存至文件中。
   */
  public addPort(data : BlockPortRegData, isDyamicAdd = true, initialValue : any = null, forceChangeDirection ?: BlockPortDirection) {
    let oldData = this.getPort(data.guid, data.direction);
    if(oldData != null && oldData != undefined) {
      logger.warning("[addPort]" + data.direction + " port " + data.name + " (" + data.guid + ") alreday exist !");
      return oldData;
    }

    let newPort = this.isEditorBlock ? new BlockPortEditor(<BlockEditor><any>this) : new BlockPort(this);
    newPort.name = data.name ? data.name : '';
    newPort.description = data.description ? data.description : '';
    newPort.isDyamicAdd = isDyamicAdd;
    newPort.guid = data.guid;
    newPort.direction = CommonUtils.isDefinedAndNotNull(forceChangeDirection) ? forceChangeDirection : data.direction;
    newPort.regData = data;
    if(typeof data.paramType == 'string') 
      newPort.paramType = createParameterTypeFromString(data.paramType);
    else 
      newPort.paramType = cloneParameterTypeFromString(data.paramType);
    if(CommonUtils.isDefinedAndNotNull(data.paramRefPassing)) newPort.paramRefPassing = data.paramRefPassing;
    if(CommonUtils.isDefinedAndNotNull(data.executeInNewContext)) newPort.executeInNewContext = data.executeInNewContext;
    newPort.paramDefaultValue = CommonUtils.isDefinedAndNotNull(data.paramDefaultValue) ? data.paramDefaultValue : ParamTypeServiceInstance.getTypeDefaultValue(newPort.paramType);
    if (newPort.direction == 'input') {
      newPort.paramUserSetValue = CommonUtils.isDefined(initialValue) ? initialValue : data.paramDefaultValue;
      newPort.forceNoEditorControl = data.forceNoEditorControl;
    } else
      newPort.paramUserSetValue = initialValue;
    if(CommonUtils.isDefinedAndNotNull(data.portAnyFlexable)) newPort.portAnyFlexable = data.portAnyFlexable;
    if(CommonUtils.isDefinedAndNotNull(data.paramStatic)) newPort.paramStatic = data.paramStatic;
    if(CommonUtils.isDefinedAndNotNull(data.paramSetType)) newPort.paramSetType = data.paramSetType;
    if(CommonUtils.isDefinedAndNotNull(data.paramDictionaryKeyType)) {
      if(typeof data.paramDictionaryKeyType == 'string') newPort.paramDictionaryKeyType = createParameterTypeFromString(data.paramDictionaryKeyType);
      else newPort.paramDictionaryKeyType = cloneParameterTypeFromString(data.paramDictionaryKeyType);
    }

    newPort.forceEditorControlOutput = data.forceEditorControlOutput;
    newPort.data = CommonUtils.isDefinedAndNotNull(data.data) ? data.data : {};

    if(newPort.direction == 'input') {
      this.inputPorts[newPort.guid] = newPort;
      this.inputPortCount++;
    }
    else if(newPort.direction == 'output') {
      this.outputPorts[newPort.guid] = newPort;
      this.outputPortCount++;
    }

    if(data.defaultConnectPort) this.allPorts.unshift(newPort);
    else this.allPorts.push(newPort);
    this.allPortsMap.set(newPort.guid, newPort);

    this.onAddPortElement.invoke(this, newPort);
    this.onPortAdd.invoke(this, newPort);

    return newPort;
  }
  /**
   * 删除行为端口
   * @param guid 端口GUID
   * @param direction 端口方向
   */
  public deletePort(guid : string|BlockPort, direction ?: BlockPortDirection) {
    let oldData = typeof guid == 'string' ? this.getPort(guid, direction) : guid;
    if(oldData == null || oldData == undefined) {
      logger.warning("[deletePort] " + guid + " port not exist !");
      return;
    }

    this.allPorts.remove(oldData);
    this.allPortsMap.delete(oldData.guid);
    this.onRemovePortElement.invoke(this, oldData);
    this.onPortRemove.invoke(this, oldData);

    if(direction == 'input') {
      delete(this.inputPorts[typeof guid == 'string' ? guid : guid.guid]);
      this.inputPortCount--;
    }
    else if(direction == 'output') {
      delete(this.outputPorts[typeof guid == 'string' ? guid : guid.guid]);
      this.outputPortCount--;
    }
  }
  /**
   * 获取某个行为端口
   * @param guid 端口GUID
   * @param direction 端口方向
   */
  public getPort(guid : string, direction ?: BlockPortDirection) : BlockPort {
    if(direction == 'input')
      return this.inputPorts[guid];
    else if(direction == 'output')
      return this.outputPorts[guid];
    else
      return this.getPortByGUID(guid);
  }
  /**
   * 根据GUID获取某个端口
   * @param guid 
   */
  public getPortByGUID(guid : string) {
    if(this.allPortsMap.has(guid))
      return this.allPortsMap.get(guid);
    return null;
  }
  /**
   * 按方向和类型获取一个端口
   * @param direction 方向
   * @param type 定义类型
   * @param customType 自定义类型
   * @param includeAny 是否包括通配符的端口
   */
  public getOnePortByDirectionAndType(direction : BlockPortDirection, type : BlockParameterType, keyType : BlockParameterType, setType : BlockParameterSetType = 'variable', includeAny = true) {
    if(type.isExecute()) {
      for(let i = 0, c = this.allPorts.length; i < c;i++)
        if(this.allPorts[i].direction == direction && this.allPorts[i].paramType.isExecute())
          return this.allPorts[i];
    }else {
      for(let i = 0, c = this.allPorts.length; i < c;i++)
        if(this.allPorts[i].direction == direction)  {
          if(setType == 'dictionary' && this.allPorts[i].paramSetType == 'dictionary') {
            if(includeAny && type.isAny() && keyType.isAny()) return this.allPorts[i];
            if(includeAny && (this.allPorts[i]).paramType.isAny() && (this.allPorts[i]).paramDictionaryKeyType.isAny()) return this.allPorts[i];
            if(this.allPorts[i].paramType.equals(type) && this.allPorts[i].paramDictionaryKeyType.equals(type)) return this.allPorts[i];

          } else if(
            (includeAny && type.isAny())
            || (this.allPorts[i].paramType.equals(type) && this.allPorts[i].paramSetType == setType)
            || (includeAny && this.allPorts[i].paramType.isAny() && this.allPorts[i].paramSetType == setType)      
          ) return this.allPorts[i];
        }
    }
    return null;
  }
  /**
   * 更改参数端口的数据类型
   * @param port 参数端口
   * @param newType 新的数据类型
   * @param newCustomType 新的自定义类型
   */
  public changePortParamType(port : BlockPort, newType : BlockParameterType|string, newSetType ?: BlockParameterSetType, newKeyType ?: BlockParameterType|string) {
    if(port.parent == this) {

      if(CommonUtils.isDefined(newType))
        if(typeof newType == 'string') port.paramType = createParameterTypeFromString(newType);
        else port.paramType.set(newType);
      if(CommonUtils.isDefined(newKeyType))
        if(typeof newKeyType == 'string') port.paramDictionaryKeyType = createParameterTypeFromString(newKeyType);
        else port.paramDictionaryKeyType.set(newKeyType);
      if(CommonUtils.isDefinedAndNotNull(newSetType))
        port.paramSetType = newSetType;

      this.onUpdatePortElement.invoke(this, port);
    }
  }

  /**
   * 获取输入参数端口的数据
   * @param guid 参数端口GUID
   */
  public getInputParamValue(guid : string|BlockPort, context ?: BlockRunContextData) {
    let port = typeof guid == 'string' ? <BlockPort>this.inputPorts[guid] : guid;
    if(port && !port.paramType.isExecute())
      return port.rquestInputValue(context ? context : this.currentRunningContext);
    return undefined;
  }
  /**
   * 检查输入参数端口的数据是否更改
   * @param guid 参数端口GUID
   */
  public checkInputParamValueChanged(guid : string|BlockPort, context ?: BlockRunContextData) {
    let port = typeof guid == 'string' ? <BlockPort>this.inputPorts[guid] : guid;
    if(port && !port.paramType.isExecute())
      return port.checkInputValueChanged(context ? context : this.currentRunningContext);
    return undefined;
  }
  /**
   * 更新输出参数端口的数据
   * @param guid 参数端口GUID
   */
  public setOutputParamValue(guid : string|BlockPort, value : any, context ?: BlockRunContextData) {
    let port = typeof guid == 'string' ? <BlockPort>this.outputPorts[guid] : guid;
    if(port && !port.paramType.isExecute())
      port.updateOnputValue(context ? context : this.currentRunningContext, value);
  }
  /**
   * 获取输出参数端口的数据
   * @param guid 参数端口GUID
   */
  public getOutputParamValue(guid : string|BlockPort, context ?: BlockRunContextData) {
    let port = typeof guid == 'string' ? <BlockPort>this.outputPorts[guid] : guid;
    if(port && !port.paramType.isExecute())
      return port.getValue(context ? context : this.currentRunningContext);
    return null;
  }

  /**
   * 在当前上下文激活某一个输出行为端口
   * @param guid 行为端口GUID
   */
  public activeOutputPort(guid : string|BlockPort, context ?: BlockRunContextData) {
    let port = typeof guid == 'string' ? <BlockPort>this.outputPorts[guid] : guid;
    if(port)
      port.active(context ? context : this.currentRunningContext);
  }
  /**
   * 在新的上下文中激活某一个输出行为端口（适用于接收事件）
   * @param guid 行为端口GUID
   */
  public activeOutputPortInNewContext(guid : string|BlockPort) {
    let port = typeof guid == 'string' ? <BlockPort>this.outputPorts[guid] : guid;
    if(port)
      port.activeInNewContext();
  }

  public onEnterBlock = new EventHandler<OnBlockEventCallback>();
  public onLeaveBlock = new EventHandler<OnBlockEventCallback>();
  public onAddPortElement = new EventHandler<OnPortEditorEventCallback>();
  public onUpdatePortElement = new EventHandler<OnPortEditorEventCallback>();
  public onRemovePortElement = new EventHandler<OnPortEditorEventCallback>();
  public onPortValueUpdate = new EventHandler<OnPortEventCallback>();
  public onPortConnectorActive = new EventHandler<(port : BlockPort, connector : Connector) => void>();
  public onPortConnectCheck = new EventHandler<OnPortConnectCheckCallback>();
  public onPortConnect = new EventHandler<OnPortConnectCallback>();
  public onPortUnConnect =  new EventHandler<OnPortEditorEventCallback>();

  /**
   * 抛出本单元的错误
   * @param err 错误字符串
   * @param port 发生的端口（可选）
   * @param level 发生错误的等级
   */
  public throwError(err : string, port ?: BlockPort, level : 'warning'|'error' = 'error') {

  }
}

export type OnBlockEventCallback = (block : Block) => void;
export type OnPortEventCallback = (block : Block, port : BlockPort) => void;
export type OnPortEditorEventCallback = (block : BlockEditor, port : BlockPort) => void;
export type OnPortUpdateCallback = (block : Block, port : BlockPort, portSource : BlockPort) => void;
export type OnPortConnectCallback = (block : BlockEditor, port : BlockPort, portSource : BlockPort) => void;
export type OnPortConnectCheckCallback = (block : BlockEditor, port : BlockPort, portSource : BlockPort) => string;
export type OnPortRequestCallback = (block : Block, port : BlockPort, context : BlockRunContextData) => void;
export type OnBlockEditorEventCallback = (block : BlockEditor) => void;
export type OnUserAddPortCallback = (block : BlockEditor, direction : BlockPortDirection, type : 'execute'|'param') => BlockPortRegData|BlockPortRegData[];
export type OnAddBlockCheckCallback = (block : BlockRegData, graph : BlockGraphDocunment) => string|null;

/**
 * 断点类型。
 * enable：启用，
 * disable：禁用，
 * none：未设置
 */
export type BlockBreakPoint = 'enable'|'disable'|'none';
/**
 * 单元类型 
 * normal：普通，
 * base：基础单元，
 * variable：参数单元
 */
export type BlockType = 'normal'|'base'|'variable';