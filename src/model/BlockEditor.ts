import { Vector2 } from "./Vector2"
import { Rect } from "./Rect";
import { BlockRegData, BlockParameterTypeRegData, BlockParameterEnumRegData, BlockParameterEditorRegData, BlockEditorComponentCreateFn, BlockParametersChangeSettings } from "./BlockDef";
import { BlockParameterPort, BlockBehaviorPort, BlockPort, BlockPortEditorData } from "./Port";

import CommonUtils from "../utils/CommonUtils";
import AllEditors from "../model/TypeEditors/AllEditors";
import ParamTypeServiceInstance from "../sevices/ParamTypeService";
import { Block, OnUserAddPortCallback, OnUserAddParamCallback } from "./Block";
import { EditorInterface } from "./Editor";


/**
 * 编辑器模式下的单元。
 * 扩展了单元的编辑事件操作与管理,供编辑器使用。
 * 运行时中不会声明此类。
 */
export class BlockEditor extends Block {

  public position : Vector2 = new Vector2();
  public size : Vector2 = new Vector2(150, 200);

  public name = "Single";
  public description = "This is a single block. Useage: unknow.";
  public mark = "";
  public breakpoint : BlockBreakPoint = 'none';

  public logo = "";
  public logoRight = "";
  public logoBottom = "";

  public selected = false;
  public hover = false;

  private rect = new Rect();
  
  public editor : EditorInterface = null;

  public constructor(editor : EditorInterface, regData ?: BlockRegData) {
    super();
    this.isEditorBlock = true;
    this.editor = editor;
    if(regData)
      this.regData = regData;
    this.onAddPortElement = this.addPortElement;
    this.onRemovePortElement = this.removePortElement;
    this.onUpdatePortElement = this.updatePortElement;
  }

  public portBehaviorIcon = 'icon-sanjiaoxing';
  public portBehaviorIconActive = 'icon-zuo';
  public portParamIcon = 'icon-yuan';
  public portParamIconActive = 'icon-yuan1';
  public portFailedIconActive = 'icon-close-';
  public portBehaviorAddIcon = 'icon-pluss-1';
  public portParamAddIcon = 'icon-pluss-1';
  public portPortDeleteIcon = 'icon-close-1';

  public getRect() { 
    this.rect.setPos(this.position);
    this.rect.setSize(this.size);
    return this.rect; 
  }

  public el : HTMLDivElement = null;
  public elInputBehaviorPorts : HTMLDivElement = null;
  public elOutputBehaviorPorts : HTMLDivElement = null;

  public elAddInputBehaviorPort : HTMLElement = null;
  public elAddOutputBehaviorPort : HTMLElement = null;

  public elInputParamPorts : HTMLDivElement = null;
  public elOutputParamPorts : HTMLDivElement = null;

  public elAddInputParamPort : HTMLElement = null;
  public elAddOutputParamPort : HTMLElement = null;

  public elTitle : HTMLDivElement = null;
  public elSubTitle : HTMLSpanElement = null;
  public elCustomEditor : HTMLDivElement = null;

  public elLogo : HTMLImageElement = null;
  public elLogoRight : HTMLImageElement = null;
  public elLogoBottom : HTMLImageElement = null;

  public create() {
    
    if(this.regData) {
      this.name = this.regData.baseInfo.name;
      this.description = this.regData.baseInfo.description;
      this.logo = this.regData.baseInfo.logo;
      this.logoRight = this.regData.baseInfo.logoRight;
      this.logoBottom = this.regData.baseInfo.logoBottom;

      this.onCreateCustomEditor = this.regData.callbacks.onCreateCustomEditor;
      this.onUserAddPort = this.regData.callbacks.onUserAddPort;
      this.OnUserAddParam = this.regData.callbacks.OnUserAddParam;

      this.portsChangeSettings = this.regData.settings.portsChangeSettings;
      this.parametersChangeSettings = this.regData.settings.parametersChangeSettings;
    }

    let host = this.editor.getBlockHostElement();

    this.el = document.createElement('div');
    this.el.classList.add("flow-block");
    this.el.setAttribute("id", this.uid);

    let content = document.createElement('div');
    let areaPorts = document.createElement('div');
    let areaPortsBottom = document.createElement('div');

    this.elInputBehaviorPorts = document.createElement('div');
    this.elInputBehaviorPorts.classList.add("ports", 'input');
    this.elOutputBehaviorPorts = document.createElement('div');
    this.elOutputBehaviorPorts.classList.add("ports", 'output');

    this.elAddInputBehaviorPort = document.createElement('a');
    this.elAddOutputBehaviorPort = document.createElement('a');
    this.elAddInputBehaviorPort.classList.add('port-add','iconfont', 'Behavior', this.portBehaviorAddIcon);
    this.elAddOutputBehaviorPort.classList.add('port-add','iconfont', 'Behavior',this.portBehaviorAddIcon);
    this.elAddInputBehaviorPort.setAttribute('title', '添加入端口');
    this.elAddOutputBehaviorPort.setAttribute('title', '添加出端口');
    this.elAddInputBehaviorPort.onclick = this.onUserAddInputPort.bind(this);
    this.elAddOutputBehaviorPort.onclick = this.onUserAddOutputPort.bind(this);

    areaPorts.classList.add("area", "Behavior");
    areaPorts.appendChild(this.elInputBehaviorPorts);
    areaPorts.appendChild(this.elOutputBehaviorPorts);
    areaPortsBottom.classList.add("area-bottom", "Behavior");
    areaPortsBottom.appendChild(this.elAddInputBehaviorPort);
    areaPortsBottom.appendChild(this.elAddOutputBehaviorPort);

    let areaParamPorts = document.createElement('div');
    let areaParamPortsBottom = document.createElement('div');

    this.elInputParamPorts = document.createElement('div');
    this.elInputParamPorts.classList.add("ports", 'input');
    this.elOutputParamPorts = document.createElement('div');
    this.elOutputParamPorts.classList.add("ports", 'output');

    this.elAddInputParamPort = document.createElement('a');
    this.elAddOutputParamPort = document.createElement('a');

    this.elAddInputParamPort.classList.add('port-add','iconfont', 'Param', this.portParamAddIcon);
    this.elAddOutputParamPort.classList.add('port-add','iconfont', 'Param', this.portParamAddIcon);
    this.elAddInputParamPort.setAttribute('title', '添加入参数');
    this.elAddOutputParamPort.setAttribute('title', '添加出参数');
    this.elAddInputParamPort.onclick = this.onUserAddInputParam.bind(this);
    this.elAddOutputParamPort.onclick = this.onUserAddOutputParam.bind(this);

    areaParamPorts.classList.add("area", "Param");
    areaParamPorts.appendChild(this.elInputParamPorts);
    areaParamPorts.appendChild(this.elOutputParamPorts);
    areaParamPortsBottom.classList.add("area-bottom", "Param");
    areaParamPortsBottom.appendChild(this.elAddInputParamPort);
    areaParamPortsBottom.appendChild(this.elAddOutputParamPort);

    content.appendChild(areaPorts);
    content.appendChild(areaPortsBottom);
    content.appendChild(areaParamPorts);
    content.appendChild(areaParamPortsBottom);
    content.classList.add("content");

    this.elTitle = document.createElement('div');
    this.elTitle.classList.add("title");
    this.elSubTitle = document.createElement('span');
    this.elSubTitle.classList.add("sub-title");
    this.elTitle.appendChild(this.elSubTitle);

    this.elCustomEditor = document.createElement('div');
    this.elCustomEditor.classList.add("custom-editor");
  
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
    this.el.appendChild(this.elCustomEditor);
    this.el.appendChild(content);

    this.el.addEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.el.addEventListener('mouseleave', this.onMouseOut.bind(this));
    this.elTitle.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.elTitle.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.elTitle.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.el.addEventListener('resize', this.onResize.bind(this));

    host.appendChild(this.el);

    super.create();

    if(typeof this.onCreateCustomEditor == 'function')
      this.onCreateCustomEditor(this.elCustomEditor, this, this.regData);

    this.createFn();
    this.updateContent();
    this.onResize();
  }
  public destroy() {

    this.editor.onBlockDelete(this);

    this.el.removeEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.el.removeEventListener('mouseleave', this.onMouseOut.bind(this));
    this.el.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.el.removeEventListener('resize', this.onResize.bind(this));
    
    this.inputPorts = null;
    this.outputPorts = null;
    this.inputParameters = null;
    this.outputParameters = null;
    this.allPorts = null;

    this.editor.getBlockHostElement().removeChild(this.el);
  }

  //数据更新
  //===========================

  public updateZoom(zoom : number) {
    this.el.style.zoom = zoom.toString();
  }
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

    this.elAddInputBehaviorPort.style.display = this.portsChangeSettings.userCanAddInputPort ? 'inline-block' : 'none';
    this.elAddOutputBehaviorPort.style.display = this.portsChangeSettings.userCanAddOutputPort ? 'inline-block' : 'none';
    
    this.elAddInputParamPort.style.display = this.parametersChangeSettings.userCanAddInputParameter ? 'inline-block' : 'none';
    this.elAddOutputParamPort.style.display = this.parametersChangeSettings.userCanAddOutputParameter ? 'inline-block' : 'none';
    
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


  //节点元素更新
  //===========================

  public portsChangeSettings = {
    userCanAddInputPort: false,
    userCanAddOutputPort: false,
  };

  public parametersChangeSettings : BlockParametersChangeSettings = {
    userCanAddInputParameter: false,
    userCanAddOutputParameter: false,
  };

  private addPortElement(port : BlockPort) {
    port.editorData = new BlockPortEditorData();
    port.editorData.parent = port;
    port.editorData.block = this;
    port.editorData.el = document.createElement('div');
    port.editorData.elDot = document.createElement('i');
    port.editorData.elSpan = document.createElement('span');
    port.editorData.elDeleteButton = document.createElement('a');
    port.editorData.elDeleteButton.onclick = () => this.onUserDeletePort(port);

    port.editorData.el.classList.add("port", port.type);

    port.editorData.elDeleteButton.classList.add("port-delete", "iconfont", port.type, this.portPortDeleteIcon);
    port.editorData.elDeleteButton.style.display = port.isDyamicAdd ? 'inline-block' : 'none';

    if(port.type == 'Parameter') {
      port.editorData.el.setAttribute('data-param-type', (<BlockParameterPort>port).paramType);
      port.editorData.el.setAttribute('data-param-custom-type', (<BlockParameterPort>port).paramCustomType);
    }

    port.editorData.elDot.classList.add("port-dot", "iconfont", port.type);
    port.editorData.elDot.setAttribute('data-port-guid', port.guid);
    port.editorData.elDot.setAttribute('data-block-uid', this.uid);
    port.editorData.elSpan.innerText = port.name;

    if(port.type == 'Parameter' && port.direction == 'input') this.createOrRecreateParamPortEditor(port, true);
    else port.editorData.elSpan.setAttribute('title', port.description);

    port.editorData.elDot.addEventListener('mousedown', (e) => this.onPortMouseDown(port, e));
    port.editorData.elDot.addEventListener('mouseenter', () => this.onPortMouseEnter(port));
    port.editorData.elDot.addEventListener('mouseleave', () => this.onPortMouseLeave(port));

    //switch port and text's direction
    if(port.direction == 'input') {
      port.editorData.el.appendChild(port.editorData.elDot);
      port.editorData.el.appendChild(port.editorData.elSpan);
      if(port.editorData.elEditor != null) port.editorData.el.appendChild(port.editorData.elEditor);
      port.editorData.el.appendChild(port.editorData.elDeleteButton);
    }
    else if(port.direction == 'output') {
      port.editorData.el.appendChild(port.editorData.elDeleteButton);
      if(port.editorData.elEditor != null) port.editorData.el.appendChild(port.editorData.elEditor);   
      port.editorData.el.appendChild(port.editorData.elSpan);
      port.editorData.el.appendChild(port.editorData.elDot);
    }

    //add element node
    if(port.type == 'Behavior') {
      port.editorData.elDot.classList.add(this.portBehaviorIcon);
      if(port.direction == 'input') this.elInputBehaviorPorts.appendChild(port.editorData.el);
      else if(port.direction == 'output') this.elOutputBehaviorPorts.appendChild(port.editorData.el);
    }else if(port.type == 'Parameter') {
      port.editorData.elDot.classList.add(this.portParamIcon);
      if(port.direction == 'input') this.elInputParamPorts.appendChild(port.editorData.el);
      else if(port.direction == 'output') this.elOutputParamPorts.appendChild(port.editorData.el);
    }
  }
  private createOrRecreateParamPortEditor(port : BlockPort, isAdd = false) {
    if(port.editorData.elEditor != null) {
      port.editorData.elEditor.parentNode.removeChild(port.editorData.elEditor);
      port.editorData.elEditor = null;
    }

    let portParameter = <BlockParameterPort>port;
    let customType : BlockParameterTypeRegData = null;

    //类型编辑器
    let editor : BlockParameterEditorRegData = null;
    if((portParameter.paramType == 'custom' || portParameter.paramType == 'enum') 
      && !CommonUtils.isNullOrEmpty(portParameter.paramCustomType)) {
      customType = ParamTypeServiceInstance.getCustomype(portParameter.paramCustomType);
      if(customType !=  null){
        editor = customType.editor;
        if(editor == null && customType.prototypeName == 'enum')
          editor = AllEditors.getDefaultEnumEditor(<BlockParameterEnumRegData>customType);
      }
    }
    else editor = AllEditors.getBaseEditors(portParameter.paramType);
    
    //类型说明
    port.editorData.elSpan.setAttribute('title', '参数类型：' + (customType != null ? customType.name : portParameter.paramType)
      + '\n' + port.description);
    
    port.editorData.el.setAttribute('data-param-type', portParameter.paramType);
    port.editorData.el.setAttribute('data-param-custom-type', portParameter.paramCustomType);
    port.editorData.elEditor = null;

    //创建类型编辑器
    if(editor != null) {
      port.editorData.elEditor = editor.editorCreate(port.editorData.el, portParameter, customType);
      if(port.editorData.elEditor!=null) {
        port.editorData.elEditor.classList.add('param-editor');
        if(!isAdd) {
          //switch port and text's direction
          if(port.direction == 'input')
            port.editorData.el.insertBefore(port.editorData.elEditor, port.editorData.elDeleteButton);
          else if(port.direction == 'output')
            port.editorData.el.insertBefore(port.editorData.elEditor, port.editorData.elSpan);
        }
      }
    }
  }
  private updatePortElement(port : BlockPort) {
    port.editorData.elSpan.innerText = port.name;
    port.editorData.elDeleteButton.style.display = port.isDyamicAdd ? 'inline-block' : 'none';
    if(port.type == 'Parameter' && port.direction == 'input') {
      port.editorData.el.setAttribute('data-param-type', (<BlockParameterPort>port).paramType);
      port.editorData.el.setAttribute('data-param-custom-type', (<BlockParameterPort>port).paramCustomType);
      this.createOrRecreateParamPortEditor(port);
    }else {
      port.editorData.elSpan.setAttribute('title', port.description);
    }

  }
  private removePortElement(port : BlockPort) {
    port.editorData.el.parentNode.removeChild(port.editorData.el);
    port.editorData = null;
  }

  public updatePortConnectStatusElement(port : BlockPort) {

    //点的状态
    if(port.editorData.forceDotErrorState){
      port.editorData.elDot.classList.add("error", this.portFailedIconActive);
      port.editorData.elDot.classList.remove(this.portBehaviorIcon, this.portBehaviorIconActive, this.portParamIcon, this.portParamIconActive);
    }else {
      port.editorData.elDot.classList.remove("error", this.portFailedIconActive);
      if(port.type == 'Behavior')
        CommonUtils.setClassWithSwitch(port.editorData.elDot, port.connector != null || port.editorData.forceDotActiveState,
          this.portBehaviorIcon, this.portBehaviorIconActive);
      else if(port.type == 'Parameter') 
        CommonUtils.setClassWithSwitch(port.editorData.elDot, port.connector != null || port.editorData.forceDotActiveState, 
          this.portParamIcon, this.portParamIconActive);
    }

    //数值编辑器状态
    if(port.type == 'Parameter') 
    {
      if(port.editorData.elEditor != null) {
        port.editorData.elEditor.style.display = port.connector == null ? 'inline-block' : 'none';
      }
    }
  }

  //其他事件
  //===========================

  private onUserDeletePort(port : BlockPort) {
    this.editor.getVue().$Modal.confirm({
      title: '提示',
      content: '确定删除此端口？',
      onOk: () => {
        if(port.type == 'Behavior') this.deletePort(port.guid);
        else if(port.type == 'Parameter') this.deleteParameterPort(port.guid);
      },
      onCancel: () => {}
    });
  }
  private onUserAddInputPort() {
    this.addPort(this.onUserAddPort(this, 'input'), true);
  }
  private onUserAddOutputPort() {
    this.addPort(this.onUserAddPort(this, 'output'), true);
  }
  private onUserAddInputParam() {
    this.addParameterPort(this.OnUserAddParam(this, 'input'), true);
  }
  private onUserAddOutputParam() {
    this.addParameterPort(this.OnUserAddParam(this, 'output'), true);
  }

  private onResize() {
    this.size.Set(
      this.el.offsetWidth,
      this.el.offsetHeight
    )
  }

  //鼠标事件
  //===========================

  //
  // 节点移动事件

  public mouseDownInPort = false;
  public mouseConnectingPort = false;

  private onPortMouseEnter(port : BlockPort) {
    this.mouseDownInPort = true;
    this.editor.updateCurrentHoverPort(port);
  }
  private onPortMouseLeave(port : BlockPort) {
    this.editor.updateCurrentHoverPortLeave(port);
    this.mouseDownInPort = false;
  }
  private onPortMouseMove(e : MouseEvent) {
    this.mouseConnectingPort = true;
    this.editor.updateConnectEnd(new Vector2(e.x, e.y));
    return true;
  }
  private onPortMouseDown(port : BlockPort, e : MouseEvent) {
    this.mouseDownInPort = true;
    this.mouseConnectingPort = false;
    this.editor.startConnect(port);
    this.editor.updateConnectEnd(new Vector2(e.x, e.y));

    this.fnonPortMouseUp = () => this.onPortMouseUp(port);

    document.addEventListener('mouseup', this.fnonPortMouseUp);
    document.addEventListener('mousemove', this.fnonPortMouseMove);
  }
  private onPortMouseUp(port : BlockPort) {
    this.mouseDownInPort = false;
    this.mouseConnectingPort = false;
    this.editor.endConnect(port);
    
    document.removeEventListener('mouseup', this.fnonPortMouseUp);
    document.removeEventListener('mousemove', this.fnonPortMouseMove);
  }

  //
  //单元移动事件

  public mouseDown = false;

  private mouseLastDownPos : Vector2 = new Vector2();
  private lastBlockPos : Vector2 = new Vector2();
  private lastMovedBlock = false;

  public updateLastPos() { this.lastBlockPos.Set(this.position); }
  public getLastPos() { return this.lastBlockPos; }

  private onMouseEnter(e : MouseEvent) {
    this.hover = true;
  }
  private onMouseOut(e : MouseEvent) {
    this.hover = false;
  }
  private onMouseMove(e : MouseEvent) {
    if(this.mouseDown && !this.mouseDownInPort && !this.mouseConnectingPort) {
      this.lastMovedBlock = true;
      this.setPos(new Vector2(
        this.lastBlockPos.x + (e.x - this.mouseLastDownPos.x),
        this.lastBlockPos.y + (e.y - this.mouseLastDownPos.y)
      ));
      this.editor.onMoveBlock(this, new Vector2(e.x - this.mouseLastDownPos.x, e.y - this.mouseLastDownPos.y));
      return true;
    }
    return false;
  }
  private onMouseDown(e : MouseEvent) {
    this.mouseDown = true;
    this.mouseLastDownPos.Set(e.x, e.y);
    this.lastMovedBlock = false;
    this.lastBlockPos.Set(this.position);

    document.addEventListener('mousemove', this.fnonMouseMove);
    document.addEventListener('mouseup', this.fnonMouseUp);
  }
  private onMouseUp(e : MouseEvent) {
    this.mouseDown = false;
    this.editor.onMoveBlockEnd(this);

    if(!this.lastMovedBlock) {
      this.updateSelectStatus(true);
      this.editor.onUserSelectBlock(this);
    }

    document.removeEventListener('mousemove', this.fnonMouseMove);
    document.removeEventListener('mouseup', this.fnonMouseUp);
  }

  private fnonMouseMove = null;
  private fnonMouseUp = null;
  private fnonPortMouseMove = null;
  private fnonPortMouseUp = null;

  private createFn() {
    this.fnonMouseUp = this.onMouseUp.bind(this);
    this.fnonMouseMove = this.onMouseMove.bind(this);
    this.fnonPortMouseMove = this.onPortMouseMove.bind(this);
  } 

  public onCreateCustomEditor : BlockEditorComponentCreateFn = null;
  public onUserAddPort : OnUserAddPortCallback = null;
  public OnUserAddParam : OnUserAddParamCallback = null;
}

export type OnBlockCreateCallback = (block : Block) => void;
export type OnBlockCallback = (block : Block, port : BlockBehaviorPort) => void;
export type OnPortActiveCallback = (block : Block, port : BlockBehaviorPort) => void;
export type OnParameterUpdateCallback = (block : Block, port : BlockParameterPort) => void;


export type BlockBreakPoint = 'enable'|'disable'|'none';
