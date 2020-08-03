import { BlockParameterPortRegData, BlockPortRegData, BlockRegData, } from "./BlockDef";
import { BlockParameterPort, BlockBehaviorPort, BlockPortDirection, BlockPort, BlockParameteType } from "./Port";

import CommonUtils from "../utils/CommonUtils";
import { BlockEditor } from "./BlockEditor";
import { ConnectorEditor } from "./Connector";

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

  public constructor() {
    this.uid = CommonUtils.genNonDuplicateIDHEX(16);
  }

  public create() {
    if(this.regData) {
      this.guid = this.regData.guid

      if(typeof this.regData.callbacks.onCreate == 'function') 
        this.onCreate = this.regData.callbacks.onCreate;
      if(typeof this.regData.callbacks.onParameterUpdate == 'function') 
        this.onParameterUpdate = this.regData.callbacks.onParameterUpdate;
      if(typeof this.regData.callbacks.onPortActive == 'function') 
        this.onPortActive = this.regData.callbacks.onPortActive;

      if(typeof this.regData.callbacks.onParameterAdd == 'function') 
        this.onParameterAdd = this.regData.callbacks.onParameterAdd;
      if(typeof this.regData.callbacks.onParameterRemove == 'function') 
        this.onParameterRemove = this.regData.callbacks.onParameterRemove;
      if(typeof this.regData.callbacks.onPortAdd == 'function') 
        this.onPortAdd = this.regData.callbacks.onPortAdd;
      if(typeof this.regData.callbacks.onPortRemove == 'function') 
        this.onPortRemove = this.regData.callbacks.onPortRemove;

      if(this.regData.ports.length > 0)
        this.regData.ports.forEach(element => this.addPort(element, false));
      if(this.regData.parameters.length > 0)
        this.regData.parameters.forEach(element => this.addParameterPort(element, false));
    }

    if(this.onCreate != null)
      this.onCreate(this);
  }

  public regData : BlockRegData = null;
  /**
   * 获取当前单元是不是在编辑器模式中
   */
  public isEditorBlock = false;
  //单元控制事件
  //===========================

  public onCreate : OnBlockCreateCallback = (block) => {};
  public onPortActive : OnPortActiveCallback = (block, port) => {};
  public onParameterUpdate : OnParameterUpdateCallback = (block, port) => {};
  public onPortAdd : OnPortCallback = null;
  public onPortRemove : OnPortCallback = null;
  public onParameterAdd : OnParameterUpdateCallback = null;
  public onParameterRemove : OnParameterUpdateCallback = null;

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
    this.allPorts.push(newPort);

    if(typeof this.onAddPortElement == 'function') this.onAddPortElement(newPort);
    if(typeof this.onPortAdd == 'function') this.onPortAdd(this, newPort);

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

    if(oldData.connector != null && oldData.parent.isEditorBlock)
      (<BlockEditor>oldData.parent).editor.unConnectConnector(<ConnectorEditor>oldData.connector);

    this.allPorts.remove(oldData);
    if(typeof this.onRemovePortElement == 'function') this.onRemovePortElement(oldData);
    if(typeof this.onPortRemove == 'function') this.onPortRemove(this, oldData);

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
  public addParameterPort(data : BlockParameterPortRegData, isDyamicAdd = true) {
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
    this.allPorts.push(newPort);

    if(typeof this.onAddPortElement == 'function') this.onAddPortElement(newPort);
    if(typeof this.onParameterAdd == 'function') this.onParameterAdd(this, newPort);

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

    if(oldData.connector != null && oldData.parent.isEditorBlock)
      (<BlockEditor>oldData.parent).editor.unConnectConnector(<ConnectorEditor>oldData.connector);

    this.allPorts.remove(oldData);

    if(typeof this.onRemovePortElement == 'function') this.onRemovePortElement(oldData);
    if(typeof this.onParameterRemove == 'function') this.onParameterRemove(this, oldData);

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

      if(typeof this.onUpdatePortElement == 'function')
        this.onUpdatePortElement(port);
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
   * 激活某一个输出行为端口
   * @param guid 行为端口GUID
   */
  public activeOutputPort(guid : string) {
    let port = <BlockBehaviorPort>this.inputPorts[guid];
    if(port)
      port.active()
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

  protected onAddPortElement : (port : BlockPort) => void = null;
  protected onUpdatePortElement : (port : BlockPort) => void = null;
  protected onRemovePortElement : (port : BlockPort) => void = null;
}

export type OnBlockCreateCallback = (block : Block) => void;
export type OnBlockCallback = (block : Block, port : BlockBehaviorPort) => void;
export type OnPortActiveCallback = (block : Block, port : BlockBehaviorPort) => void;
export type OnParameterUpdateCallback = (block : Block, port : BlockParameterPort) => void;
export type OnPortCallback = (block : Block, port : BlockBehaviorPort) => void;

export type OnUserAddPortCallback = (block : Block, direction : BlockPortDirection) => BlockPortRegData;
export type OnUserAddParamCallback = (block : Block, direction : BlockPortDirection) => BlockParameterPortRegData;

export type BlockBreakPoint = 'enable'|'disable'|'none';
