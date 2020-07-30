import { Vector2 } from "./vector2"
import { Rect } from "./rect";
import CommonUtils from "../utils/CommonUtils";
import { BlockParameterPortRegData, BlockPortRegData, BlockRegData } from "./blockdef";
import { BlockParameterPort, BlockBehaviorPort, BlockPortDirection, BlockPort } from "./port";

export class Block {

  public position : Vector2 = new Vector2();
  public size : Vector2 = new Vector2(150, 200);

  public name = "Single";
  public description = "This is a single block. Useage: unknow.";
  public guid = "0";
  public uid = "";

  public logo = "";
  public logoRight = "";
  public logoBottom = "";

  public selected = false;
  public hover = false;

  private rect = new Rect();
  private regData : BlockRegData = null

  public constructor(regData ?: BlockRegData) {
    this.uid = CommonUtils.genNonDuplicateID(3);
    if(regData) {
      this.regData = regData;
    }
  }

  public portBehaviorIcon = 'icon-sanjiaoxing';
  public portBehaviorIconActive = 'icon-zuo';
  public portParamIcon = 'icon-yuan';
  public portParamIconActive = 'icon-yuan1';

  

  public getRect() { 
    this.rect.setPos(this.position);
    this.rect.setSize(this.size);
    return this.rect; 
  }

  public el : HTMLDivElement = null;
  public elInputBehaviorPorts : HTMLDivElement = null;
  public elOutputBehaviorPorts : HTMLDivElement = null;

  public elInputParamPorts : HTMLDivElement = null;
  public elOutputParamPorts : HTMLDivElement = null;

  public elTitle : HTMLDivElement = null;
  public elSubTitle : HTMLSpanElement = null;

  public elLogo : HTMLImageElement = null;
  public elLogoRight : HTMLImageElement = null;
  public elLogoBottom : HTMLImageElement = null;

  public create(host : HTMLElement) {
    this.el = document.createElement('div');
    this.el.classList.add("flow-block");
    this.el.setAttribute("id", this.uid);

    let content = document.createElement('div');
    let areaPorts = document.createElement('div');

    this.elInputBehaviorPorts = document.createElement('div');
    this.elInputBehaviorPorts.classList.add("ports", 'input');
    this.elOutputBehaviorPorts = document.createElement('div');
    this.elOutputBehaviorPorts.classList.add("ports", 'output');

    areaPorts.classList.add("area", "ports");
    areaPorts.appendChild(this.elInputBehaviorPorts);
    areaPorts.appendChild(this.elOutputBehaviorPorts);

    let areaParamPorts = document.createElement('div');

    this.elInputParamPorts = document.createElement('div');
    this.elInputParamPorts.classList.add("ports", 'input');
    this.elOutputParamPorts = document.createElement('div');
    this.elOutputParamPorts.classList.add("ports", 'output');

    areaParamPorts.classList.add("area", "vars");
    areaParamPorts.appendChild(this.elInputParamPorts);
    areaParamPorts.appendChild(this.elOutputParamPorts);

    content.appendChild(areaPorts);
    content.appendChild(areaParamPorts);
    content.classList.add("content");

    this.elTitle = document.createElement('div');
    this.elTitle.classList.add("title");
    this.elSubTitle = document.createElement('span');
    this.elSubTitle.classList.add("sub-title");
    this.elTitle.appendChild(this.elSubTitle);

    this.elLogo = document.createElement('img');
    this.elLogo.classList.add("logo");
    this.elTitle.appendChild(this.elLogo);
    this.elLogoRight = document.createElement('img');
    this.elLogoRight.classList.add("logo-right");
    this.elTitle.appendChild(this.elLogoRight);
    this.elLogoBottom = document.createElement('img');
    this.elLogoBottom.classList.add("logo-bottom");
    this.elTitle.appendChild(this.elLogoBottom);

    this.el.appendChild(this.elTitle);
    this.el.appendChild(content);

    this.el.addEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.el.addEventListener('mouseleave', this.onMouseOut.bind(this));
    this.el.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.el.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.el.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.el.addEventListener('resize', this.onResize.bind(this));

    host.appendChild(this.el);

    if(this.regData) {
      this.name = this.regData.name;
      this.description = this.regData.description;
      this.guid = this.regData.guid;
      this.logo = this.regData.logo;
      this.logoRight = this.regData.logoRight;
      this.logoBottom = this.regData.logoBottom;

      if(this.regData.onParameterUpdate != null || typeof this.regData.onParameterUpdate != 'undefined') 
        this.onParameterUpdate = this.regData.onParameterUpdate;
      if(this.regData.onPortActive != null || typeof this.regData.onPortActive != 'undefined') 
        this.onPortActive = this.regData.onPortActive;

      if(this.regData.ports.length > 0)
        this.regData.ports.forEach(element => this.addPort(element));
      if(this.regData.parameters.length > 0)
        this.regData.parameters.forEach(element => this.addParameterPort(element));
      
    }

    this.updateContent();
    this.onResize();
  }
  public destroy(host : HTMLElement) {

    this.el.removeEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.el.removeEventListener('mouseleave', this.onMouseOut.bind(this));
    this.el.removeEventListener('mousemove', this.onMouseMove.bind(this));
    this.el.removeEventListener('mouseup', this.onMouseUp.bind(this));
    this.el.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.el.removeEventListener('resize', this.onResize.bind(this));
    
    this.inputPorts = [];
    this.outputPorts = [];
    this.inputParameters = [];
    this.outputParameters = [];

    host.removeChild(this.el);
  }

  //端口操作
  //===========================

  public inputPorts : Array<BlockBehaviorPort> = [];
  public outputPorts : Array<BlockBehaviorPort> = [];
  public inputParameters : Array<BlockParameterPort> = [];
  public outputParameters : Array<BlockParameterPort> = [];
  public allPorts : Array<BlockPort> = [];

  public addPort(data : BlockPortRegData) {
    let oldData = this.getPort(data.name, data.direction);
    if(oldData != null) {
      console.warn("[addPort] " + data.direction + " port " + data.name + " alreday exist !");
      return oldData;
    }

    let newPort = new BlockBehaviorPort(this);
    newPort.name = data.name;
    newPort.description = data.description;
    newPort.direction = data.direction;

    this.inputPorts.push(newPort);
    this.allPorts.push(newPort);
    this.addPortElement(newPort);

    return newPort;
  }
  public deletePort(name : string | BlockPortRegData, direction ?: BlockPortDirection) {
    let oldData = this.getPort(name, direction);
    if(oldData == null) {
      console.warn("[deletePort] " + direction + " port " + name + " not exist !");
      return;
    }

    this.allPorts.remove(oldData);
    this.removePortElement(oldData);

    if(oldData.direction == 'input')
      this.inputPorts.remove(oldData);
    else if(oldData.direction == 'output') 
      this.outputPorts.remove(oldData);
  }
  public getPort(name : string | BlockPortRegData, direction ?: BlockPortDirection) : BlockBehaviorPort {
    let tname = '';
    let tdirection = '';
    if(typeof name == 'string') {
      tname = name;
      tdirection = direction;
    }else{
      tname = name.name;
      tdirection = name.direction;
    }

    
    if(tdirection == 'input') {
      for(let i = 0, c = this.inputPorts.length; i < c;i++)
        if(this.inputPorts[i].name == tname) 
          return this.inputPorts[i];
    }else if(tdirection == 'output') {
      for(let i = 0, c = this.outputPorts.length; i < c;i++)
        if(this.outputPorts[i].name == tname) 
          return this.outputPorts[i];
    }
    return null;
  }
  public addParameterPort(data : BlockParameterPortRegData) {
    let oldData = this.getParameterPort(data.name, data.direction);
    if(oldData != null) {
      console.warn("[addParameterPort] " + data.direction + " port " + data.name + " alreday exist !");
      return oldData;
    }

    let newPort = new BlockParameterPort(this);

    newPort.name = data.name;
    newPort.description = data.description;
    newPort.direction = data.direction;

    this.inputParameters.push(newPort);
    this.allPorts.push(newPort);
    this.addPortElement(newPort);

    return newPort;
  }
  public deleteParameterPort(name : string | BlockParameterPortRegData, direction ?: BlockPortDirection) {

    let oldData = this.getParameterPort(name, direction);
    if(oldData == null) {
      console.warn("[deleteParameterPort] " + direction + " port " + name + " not exist !");
      return;
    }

    this.allPorts.remove(oldData);
    this.removePortElement(oldData);

    if(oldData.direction == 'input')
      this.inputParameters.remove(oldData);
    else if(oldData.direction == 'output') 
      this.outputParameters.remove(oldData);
  }
  public getParameterPort(name : string | BlockParameterPortRegData, direction ?: BlockPortDirection) {
    
    let tname = '';
    let tdirection = '';
    if(typeof name == 'string') {
      tname = name;
      tdirection = direction;
    }else{
      tname = name.name;
      tdirection = name.direction;
    }

    if(tdirection == 'input') {
      for(let i = 0, c = this.inputParameters.length; i < c;i++)
        if(this.inputParameters[i].name == tname) 
          return this.inputParameters[i];
    }else if(tdirection == 'output') {
      for(let i = 0, c = this.outputParameters.length; i < c;i++)
        if(this.outputParameters[i].name == tname) 
          return this.outputParameters[i];
    }
    return null;
  }

  public getPortByUid(uid : string) {
    for(let i = 0, c = this.allPorts.length; i < c;i++)
        if(this.allPorts[i].uid == uid) 
          return this.allPorts[i];
    return null;
  }

  //数据更新
  //===========================

  public updateContent() {
    this.elTitle.innerText = this.name;
    this.elSubTitle.innerText = this.description;
    this.el.setAttribute('data-guid', this.guid);

    this.elLogo.style.display = CommonUtils.isNullOrEmpty(this.logo) ? 'none' : 'inline-block';
    this.elLogo.src = this.logo;
    this.elLogoBottom.style.display = CommonUtils.isNullOrEmpty(this.logoBottom) ? 'none' : 'inline-block';
    this.elLogoBottom.src = this.logoBottom;
    this.elLogoRight.style.display = CommonUtils.isNullOrEmpty(this.logoRight) ? 'none' : 'inline-block';
    this.elLogoRight.src = this.logoRight;
  }
  public updateSelectStatus(selected?:boolean) {
    if(typeof selected === 'boolean') this.selected = selected;

    if(this.selected) this.el.classList.add("selected");
    else this.el.classList.remove("selected");
  }

  public setPos(pos ?: Vector2) {
    if(typeof pos != 'undefined')
      this.position.Set(pos);
    this.el.style.left = this.position.x + 'px';
    this.el.style.top = this.position.y + 'px';
  }

  public updatePortConnectStatusElement(port : BlockPort) {
    if(port.type == 'Behavior') {
      port.elDot.classList.add(port.connectedPort == null ? this.portBehaviorIcon : this.portBehaviorIconActive);
    }else if(port.type == 'Parameter') {
      port.elDot.classList.add(port.connectedPort == null ? this.portParamIcon : this.portParamIconActive);
    }
  }

  private addPortElement(port : BlockPort) {
    port.el = document.createElement('div');
    port.elDot = document.createElement('i');
    port.elSpan = document.createElement('span');

    port.el.classList.add("port", port.type);

    if(port.type == 'Parameter') {
      port.el.setAttribute('data-param-type', (<BlockParameterPort>port).paramType);
      port.el.setAttribute('data-param-custom-type', (<BlockParameterPort>port).paramCustomType);
    }

    port.elDot.classList.add("port-dot", "iconfont", port.type);
    port.elDot.setAttribute('data-port-uid', port.uid);
    port.elDot.setAttribute('data-block-uid', this.uid);
    port.elSpan.innerText = port.name;
    port.elSpan.setAttribute('title', port.description);

    //switch port and text's direction
    if(port.direction == 'input') {
      port.el.appendChild(port.elDot);
      port.el.appendChild(port.elSpan);
    }
    else if(port.direction == 'output') {
      port.el.appendChild(port.elSpan);
      port.el.appendChild(port.elDot);
    }

    //add element node
    if(port.type == 'Behavior') {
      port.elDot.classList.add(this.portBehaviorIcon);
      if(port.direction == 'input') this.elInputBehaviorPorts.appendChild(port.el);
      else if(port.direction == 'output') this.elOutputBehaviorPorts.appendChild(port.el);
    }else if(port.type == 'Parameter') {
      port.elDot.classList.add(this.portParamIcon);
      if(port.direction == 'input') this.elInputParamPorts.appendChild(port.el);
      else if(port.direction == 'output') this.elOutputParamPorts.appendChild(port.el);
    }
  }
  private removePortElement(port : BlockPort) {
    port.el.parentNode.removeChild(port.el);
  }

  //其他事件
  //===========================

  private onResize() {
    this.size.Set(
      this.el.offsetWidth,
      this.el.offsetHeight
    )
  }

  //鼠标事件
  //===========================

  public mouseDown = false;

  private mouseLastDownPos : Vector2 = new Vector2();
  private lastBlockPos : Vector2 = new Vector2();
  private lastMovedBlock = false;

  private onMouseEnter(e : MouseEvent) {
    this.hover = true;
  }
  private onMouseOut(e : MouseEvent) {
    this.hover = false;
  }
  private onMouseMove(e : MouseEvent) {
    if(this.mouseDown) {
      this.lastMovedBlock = true;
      this.setPos(new Vector2(
        this.lastBlockPos.x + (e.x - this.mouseLastDownPos.x),
        this.lastBlockPos.y + (e.y - this.mouseLastDownPos.y)
      ))
    }
    return true;
  }
  private onMouseDown(e : MouseEvent) {
    this.mouseDown = true;
    this.mouseLastDownPos.Set(e.x, e.y);
    this.lastMovedBlock = false;
    this.lastBlockPos.Set(this.position);

    
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
  }
  private onMouseUp(e : MouseEvent) {
    this.mouseDown = false;
    if(!this.lastMovedBlock)
      this.updateSelectStatus(true);

    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
  }

  //节点控制事件
  //===========================

  public onPortActive : OnPortActiveCallback = (block, port) => {};
  public onParameterUpdate : OnParameterUpdateCallback = (block, port) => {};

}

export type OnPortActiveCallback = (block : Block, port : BlockBehaviorPort) => void;
export type OnParameterUpdateCallback = (block : Block, port : BlockParameterPort) => void;