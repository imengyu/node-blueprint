import { BlockParameterPortRegData, BlockPortRegData, BlockRegData, } from "./BlockDef";
import { BlockParameterPort, BlockBehaviorPort, BlockPortDirection, BlockPort, BlockParameteType } from "./Port";

import CommonUtils from "../../utils/CommonUtils";
import { BlockEditor } from "../Editor/BlockEditor";
import { ConnectorEditor } from "../Editor/ConnectorEditor";
import { BlockRunLoopData, BlockRunner } from "../WorkProvider/Runner";
import { EventHandler } from "../../utils/EventHandler";

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
   * 自定义单元属性供代码使用（会保存至文件中）
   */
  public options = {

  };
  /**
   * 自定义单元数据供代码使用（不会保存至文件中）
   */
  public data = {

  };


  /**
   * 块的断点触发设置
   */
  public breakpoint : BlockBreakPoint = 'none';

  public constructor() {
    this.uid = CommonUtils.genNonDuplicateIDHEX(16);
  }

  public create(v) {
    if(this.regData) {
      this.guid = this.regData.guid

      if(typeof this.regData.callbacks.onCreate == 'function') 
        this.onCreate.addListener(this.regData.callbacks.onCreate);
      if(typeof this.regData.callbacks.onParameterUpdate == 'function') 
        this.onParameterUpdate.addListener(this.regData.callbacks.onParameterUpdate);
      if(typeof this.regData.callbacks.onPortActive == 'function') 
        this.onPortActive.addListener(this.regData.callbacks.onPortActive);

      if(typeof this.regData.callbacks.onParameterAdd == 'function') 
        this.onParameterAdd.addListener(this.regData.callbacks.onParameterAdd);
      if(typeof this.regData.callbacks.onParameterRemove == 'function') 
        this.onParameterRemove.addListener(this.regData.callbacks.onParameterRemove);
      if(typeof this.regData.callbacks.onPortAdd == 'function') 
        this.onPortAdd.addListener(this.regData.callbacks.onPortAdd);
      if(typeof this.regData.callbacks.onPortRemove == 'function') 
        this.onPortRemove.addListener(this.regData.callbacks.onPortRemove);

      if(this.regData.ports.length > 0)
        this.regData.ports.forEach(element => this.addPort(element, false));
      if(this.regData.parameters.length > 0)
        this.regData.parameters.forEach(element => this.addParameterPort(element, false));
    }

    if(this.onCreate != null)
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
  public currentRunningContext : BlockRunLoopData = null;
  /**
   * 当前单元所在的运行器
   */
  public currentRunner : BlockRunner = null;


  //单元控制事件
  //===========================

  public onCreate = new EventHandler<OnBlockCreateCallback>();
  public onPortActive = new EventHandler<OnPortActiveCallback>();
  public onParameterUpdate = new EventHandler<OnParameterUpdateCallback>();
  public onPortAdd = new EventHandler<OnPortCallback>();
  public onPortRemove = new EventHandler<OnPortCallback>();
  public onParameterAdd = new EventHandler<OnParameterUpdateCallback>();
  public onParameterRemove = new EventHandler<OnParameterUpdateCallback>();

  //节点操作
  //===========================

  public inputPorts = {};
  public outputPorts = {};
  public inputParameters = {};
  public outputParameters = {};
  public inputPortCount = 0;
  public outputPortCount = 0;
  public inputParameterCount = 0;
  public outputParameterCount = 0;
  public allPorts : Array<BlockPort> = [];

  /**
   * 添加行为端口
   * @param data 行为端口数据
   * @param isDyamicAdd 是否是动态添加。动态添加的端口会被保存至文件中。
   */
  public addPort(data : BlockPortRegData, isDyamicAdd = true) {
    let oldData = this.getPort(data.name, data.direction);
    if(oldData != null && oldData != undefined) {
      console.warn("[addPort] " + data.direction + " port " + data.name + " (" + data.guid + ") alreday exist !");
      return oldData;
    }

    let newPort = new BlockBehaviorPort(this);
    newPort.name = data.name;
    newPort.description = data.description;
    newPort.isDyamicAdd = isDyamicAdd;
    newPort.guid = data.guid;
    newPort.direction = data.direction;
    newPort.regData = data;

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

    this.onAddPortElement.invoke(newPort);
    this.onPortAdd.invoke(this, newPort);

    return newPort;
  }
  /**
   * 删除行为端口
   * @param guid 端口GUID
   * @param direction 端口方向
   */
  public deletePort(guid : string, direction ?: BlockPortDirection) {
    let oldData = this.getPort(guid, direction);
    if(oldData == null || oldData == undefined) {
      console.warn("[deletePort] " + guid + " port not exist !");
      return;
    }


    this.allPorts.remove(oldData);
    this.onRemovePortElement.invoke(oldData);
    this.onPortRemove.invoke(this, oldData);

    if(direction == 'input') {
      delete(this.inputPorts[guid]);
      this.inputPortCount--;
    }
    else if(direction == 'output') {
      delete(this.outputPorts[guid]);
      this.outputPortCount--;
    }
  }
  /**
   * 获取某个行为端口
   * @param guid 端口GUID
   * @param direction 端口方向
   */
  public getPort(guid : string, direction ?: BlockPortDirection) : BlockBehaviorPort {
    if(direction == 'input')
      return this.inputPorts[guid];
    else if(direction == 'output')
      return this.outputPorts[guid];
    else {
      let port = this.getPortByGUID(guid);
      return port.type == 'Behavior' ? <BlockBehaviorPort>port : undefined;
    }
  }
  /**
   * 添加参数端口
   * @param data 参数端口数据
   * @param isDyamicAdd 是否是动态添加。动态添加的端口会被保存至文件中。
   */
  public addParameterPort(data : BlockParameterPortRegData, isDyamicAdd = true, initialValue = null) {
    let oldData = this.getParameterPort(data.name, data.direction);
    if(oldData != null) {
      console.warn("[addParameterPort] " + data.direction + " port " + data.name + " (" + data.guid + ") alreday exist !");
      return oldData;
    }

    let newPort = new BlockParameterPort(this);

    newPort.name = data.name;
    newPort.description = data.description;
    newPort.direction = data.direction;
    newPort.isDyamicAdd = isDyamicAdd;
    newPort.paramType = data.paramType;
    newPort.paramCustomType = data.paramCustomType;
    newPort.paramDefaultValue = data.paramDefaultValue;
    newPort.paramUserSetValue = initialValue;
    newPort.guid = data.guid;
    newPort.regData = data;

    if(newPort.direction == 'input') {
      this.inputParameters[newPort.guid] = newPort;
      this.inputParameterCount++;
    }
    else if(newPort.direction == 'output') {
      this.outputParameters[newPort.guid] = newPort;
      this.outputParameterCount++;
    }

    if(data.defaultConnectPort) this.allPorts.unshift(newPort);
    else this.allPorts.push(newPort);

    this.onAddPortElement.invoke(newPort);
    this.onParameterAdd.invoke(this, newPort);

    return newPort;
  }
  /**
   * 删除某个参数端口
   * @param guid 端口GUID
   * @param direction 端口方向
   */
  public deleteParameterPort(guid : string, direction ?: BlockPortDirection) {

    let oldData = this.getParameterPort(guid, direction);
    if(oldData == null || oldData == undefined) {
      console.warn("[deleteParameterPort] " + guid + " port not exist !");
      return;
    }

    this.allPorts.remove(oldData);

    this.onRemovePortElement.invoke(oldData);
    this.onParameterRemove.invoke(this, oldData);

    if(oldData.direction == 'input'){
      delete(this.inputParameters[guid]);
      this.inputParameterCount--;
    }
    else if(oldData.direction == 'output') {
      delete(this.outputParameters[guid]);
      this.outputParameterCount--;
    }
  }
  /**
   * 获取某个参数端口
   * @param guid GUID
   * @param direction 端口方向
   */
  public getParameterPort(guid : string, direction ?: BlockPortDirection) : BlockParameterPort {
    if(direction == 'input')
      return this.inputParameters[guid];
    else if(direction == 'output')
      return this.outputParameters[guid];
    else {
      let port = this.getPortByGUID(guid);
      return port.type == 'Parameter' ? <BlockParameterPort>port : undefined;
    }
  }
  /**
   * 更改参数端口的数据类型
   * @param port 参数端口
   * @param newType 新的数据类型
   * @param newCustomType 新的自定义类型
   */
  public changePortParamType(port : BlockParameterPort, newType : BlockParameteType, newCustomType = '') {
    if(port.parent == this) {

      port.paramType = newType;
      port.paramCustomType = newCustomType;

      this.onUpdatePortElement.invoke(port);
    }
  }

  /**
   * 获取输入参数端口的数据
   * @param guid 参数端口GUID
   */
  public getInputParamValue(guid : string) {
    let port = <BlockParameterPort>this.inputParameters[guid];
    if(port)
      return port.paramValue;
    return undefined;
  }
  /**
   * 更新输出参数端口的数据
   * @param guid 参数端口GUID
   */
  public setOutputParamValue(guid : string, value : any) {
    let port = <BlockParameterPort>this.outputParameters[guid];
    if(port) {
      port.paramValue = value;
      port.update();
    }
  }
  /**
   * 在当前上下文激活某一个输出行为端口
   * @param guid 行为端口GUID
   */
  public activeOutputPort(guid : string) {
    let port = <BlockBehaviorPort>this.outputPorts[guid];
    if(port)
      port.active(this.currentRunningContext);
  }
  /**
   * 在新的上下文中激活某一个输出行为端口（适用于接收事件）
   * @param guid 行为端口GUID
   */
  public activeOutputPortInNewContext(guid : string) {
    let port = <BlockBehaviorPort>this.outputPorts[guid];
    if(port)
      port.activeInNewContext();
  }
  /**
   * 根据GUID获取某个端口
   * @param guid 
   */
  public getPortByGUID(guid : string) {
    for(let i = 0, c = this.allPorts.length; i < c;i++)
        if(this.allPorts[i].guid == guid) 
          return this.allPorts[i];
    return null;
  }

  public getOnePortByDirection(direction : BlockPortDirection) {
    for(let i = 0, c = this.allPorts.length; i < c;i++)
      if(this.allPorts[i].type == 'Behavior' && this.allPorts[i].direction == direction) 
        return this.allPorts[i];
    return null;
  }
  public getOneParamPortByDirectionAndType(direction : BlockPortDirection, type : BlockParameteType, customType = '') {
    for(let i = 0, c = this.allPorts.length; i < c;i++)
      if(this.allPorts[i].type == 'Parameter' 
        && this.allPorts[i].direction == direction
        && (<BlockParameterPort>this.allPorts[i]).paramType == type
        && (<BlockParameterPort>this.allPorts[i]).paramCustomType == customType) 
        return this.allPorts[i];
    return null;
  }

  protected onAddPortElement = new EventHandler<PortCallback>();
  protected onUpdatePortElement = new EventHandler<PortCallback>();
  protected onRemovePortElement = new EventHandler<PortCallback>();
}

export type OnBlockCreateCallback = (block : Block) => void;
export type OnBlockCallback = (block : Block, port : BlockBehaviorPort) => void;
export type OnPortActiveCallback = (block : Block, port : BlockBehaviorPort) => void;
export type OnParameterUpdateCallback = (block : Block, port : BlockParameterPort) => void;
export type OnPortCallback = (block : Block, port : BlockBehaviorPort) => void;
export type PortCallback = (port : BlockBehaviorPort) => void;

export type OnUserAddPortCallback = (block : Block, direction : BlockPortDirection) => BlockPortRegData;
export type OnUserAddParamCallback = (block : Block, direction : BlockPortDirection) => BlockParameterPortRegData;

export type BlockBreakPoint = 'enable'|'disable'|'none';
