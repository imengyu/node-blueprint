import { BlockPortRegData, BlockRegData, } from "./BlockDef";
import { BlockPortDirection, BlockPort, BlockParameterType } from "./Port";

import CommonUtils from "../../utils/CommonUtils";
import { BlockRunLoopData, BlockRunner } from "../WorkProvider/Runner";
import { EventHandler } from "../../utils/EventHandler";
import logger from "../../utils/Logger";
import { BlockGraphDocunment } from "./BlockDocunment";

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
   * 块的类型
   */
  public type : BlockType = 'normal';


  /**
   * 块的断点触发设置
   */
  public breakpoint : BlockBreakPoint = 'none';

  public constructor(regData ?: BlockRegData, editorBlock = false) {
    this.uid = CommonUtils.genNonDuplicateIDHEX(16);
    this.isEditorBlock = editorBlock;
    if(regData)
      this.regData = regData;
    this.createBase();
  }

  private createBase() {
    if(this.regData) {
      this.guid = this.regData.guid;
      this.type = this.regData.type;

      if(typeof this.regData.callbacks.onCreate == 'function') 
        this.onCreate.addListener(this,this.regData.callbacks.onCreate);
      if(typeof this.regData.callbacks.onDestroy == 'function') 
        this.onDestroy.addListener(this,this.regData.callbacks.onDestroy);
      if(typeof this.regData.callbacks.onPortActive == 'function') 
        this.onPortActive.addListener(this,this.regData.callbacks.onPortActive);
      if(typeof this.regData.callbacks.onPortUpdate == 'function') 
        this.onPortUpdate.addListener(this,this.regData.callbacks.onPortUpdate);
      if(typeof this.regData.callbacks.onPortAdd == 'function') 
        this.onPortAdd.addListener(this,this.regData.callbacks.onPortAdd);
      if(typeof this.regData.callbacks.onPortRemove == 'function') 
        this.onPortRemove.addListener(this,this.regData.callbacks.onPortRemove);

      if(this.regData.ports.length > 0)
        this.regData.ports.forEach(element => this.addPort(element, false));
    }

    if(!this.isEditorBlock)
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
  /**
   * 当前单元所在的图文档
   */
  public currentGraph : BlockGraphDocunment = null;


  //单元控制事件
  //===========================

  public onCreate = new EventHandler<OnBlockEventCallback>();
  public onDestroy = new EventHandler<OnBlockEventCallback>();
  public onPortActive = new EventHandler<OnPortEventCallback>();
  public onPortUpdate = new EventHandler<OnPortEventCallback>();
  public onPortAdd = new EventHandler<OnPortEventCallback>();
  public onPortRemove = new EventHandler<OnPortEventCallback>();

  //节点操作
  //===========================

  public inputPorts = {};
  public outputPorts = {};
  public inputPortCount = 0;
  public outputPortCount = 0;
  public allPorts : Array<BlockPort> = [];

  /**
   * 添加行为端口
   * @param data 行为端口数据
   * @param isDyamicAdd 是否是动态添加。动态添加的端口会被保存至文件中。
   */
  public addPort(data : BlockPortRegData, isDyamicAdd = true, initialValue = null, forceChangeDirection ?: BlockPortDirection) {
    let oldData = this.getPort(data.guid, data.direction);
    if(oldData != null && oldData != undefined) {
      console.warn("[addPort] " + data.direction + " port " + data.name + " (" + data.guid + ") alreday exist !");
      return oldData;
    }

    let newPort = new BlockPort(this);
    newPort.name = data.name ? data.name : '';
    newPort.description = data.description ? data.description : '';
    newPort.isDyamicAdd = isDyamicAdd;
    newPort.guid = data.guid;
    newPort.direction = typeof forceChangeDirection == 'undefined' ? data.direction : forceChangeDirection;
    newPort.regData = data;
    newPort.paramType = data.paramType;
    newPort.paramCustomType = data.paramCustomType ? data.paramCustomType : '';
    newPort.paramDefaultValue = data.paramDefaultValue ? data.paramDefaultValue : null;
    newPort.paramUserSetValue = initialValue;
    newPort.forceNoEditorControl = data.forceNoEditorControl;

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

    this.onAddPortElement.invoke(this, newPort);
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
    this.onRemovePortElement.invoke(this, oldData);
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
  public getPort(guid : string, direction ?: BlockPortDirection) : BlockPort {
    if(direction == 'input')
      return this.inputPorts[guid];
    else if(direction == 'output')
      return this.outputPorts[guid];
    else
      return this.getPortByGUID(guid);
  }
  /**
   * 更改参数端口的数据类型
   * @param port 参数端口
   * @param newType 新的数据类型
   * @param newCustomType 新的自定义类型
   */
  public changePortParamType(port : BlockPort, newType : BlockParameterType, newCustomType = '') {
    if(port.parent == this) {

      port.paramType = newType;
      port.paramCustomType = newCustomType;

      this.onUpdatePortElement.invoke(this, port);
    }
  }

  /**
   * 获取输入参数端口的数据
   * @param guid 参数端口GUID
   */
  public getInputParamValue(guid : string) {
    let port = <BlockPort>this.inputPorts[guid];
    if(port && port.paramType != 'execute')
      return port.paramValue;
    return undefined;
  }
  /**
   * 更新输出参数端口的数据
   * @param guid 参数端口GUID
   */
  public setOutputParamValue(guid : string, value : any) {
    let port = <BlockPort>this.outputPorts[guid];
    if(port && port.paramType != 'execute') {
      port.paramValue = value;
      port.update();
    }
  }
  /**
   * 在当前上下文激活某一个输出行为端口
   * @param guid 行为端口GUID
   */
  public activeOutputPort(guid : string) {
    let port = <BlockPort>this.outputPorts[guid];
    if(port)
      port.active(this.currentRunningContext);
  }
  /**
   * 在新的上下文中激活某一个输出行为端口（适用于接收事件）
   * @param guid 行为端口GUID
   */
  public activeOutputPortInNewContext(guid : string) {
    let port = <BlockPort>this.outputPorts[guid];
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

  public getOnePortByDirectionAndType(direction : BlockPortDirection, type : BlockParameterType, customType = '', includeAny = true) {
    if(type == 'execute') {
      for(let i = 0, c = this.allPorts.length; i < c;i++)
        if(this.allPorts[i].direction == direction && this.allPorts[i].paramType == 'execute')
          return this.allPorts[i];
    }else {
      for(let i = 0, c = this.allPorts.length; i < c;i++)
        if(this.allPorts[i].direction == direction
          && (
            (includeAny && type == 'any')
            || ((this.allPorts[i]).paramType == type && (this.allPorts[i]).paramCustomType == customType)
            || (includeAny && (this.allPorts[i]).paramType == 'any')
            )
          )
          return this.allPorts[i];
    }
    return null;
  }

  protected onAddPortElement = new EventHandler<OnPortEventCallback>();
  protected onUpdatePortElement = new EventHandler<OnPortEventCallback>();
  protected onRemovePortElement = new EventHandler<OnPortEventCallback>();
}



export type OnBlockEventCallback = (block : Block) => void;
export type OnPortEventCallback = (block : Block, port : BlockPort) => void;

export type OnUserAddPortCallback = (block : Block, direction : BlockPortDirection, type : 'execute'|'param') => BlockPortRegData;

export type BlockBreakPoint = 'enable'|'disable'|'none';

export type BlockType = 'normal'|'base'|'variable';