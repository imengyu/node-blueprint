import { Vector2 } from "../Vector2"
import { Rect } from "../Rect";
import { BlockRegData, BlockParameterTypeRegData, BlockParameterEnumRegData, BlockParameterEditorRegData, BlockEditorComponentCreateFn, BlockParametersChangeSettings, BlockStyleSettings, BlockPortEditorComponentCreateFn, BlockMenuSettings } from "../Define/BlockDef";
import { BlockPort, BlockPortEditorData } from "../Define/Port";

import CommonUtils from "../../utils/CommonUtils";
import AllEditors from "../TypeEditors/AllEditors";
import ParamTypeServiceInstance from "../../sevices/ParamTypeService";
import { Block, OnUserAddPortCallback } from "../Define/Block";
import { ConnectorEditor } from "../Editor/ConnectorEditor";
import { BlockEditorOwner } from "./BlockEditorOwner";
import StringUtils from "../../utils/StringUtils";
import HtmlUtils from "../../utils/HtmlUtils";
import ToolTipUtils from "../../utils/ToolTipUtils";

/**
 * 编辑器模式下的单元。
 * 扩展了单元的编辑事件操作与管理,供编辑器使用。
 * 运行时中不会声明此类。
 */
export class BlockEditor extends Block {

  public position : Vector2 = new Vector2();
  public size : Vector2 = new Vector2(150, 200);

  public name = '';
  public description = '';
  /**
   * 块的用户注释
   */
  public mark = '';
  public markOpen = false;

  public logo = '';

  public selected = false;
  public hover = false;

  private rect = new Rect();
  
  public editor : BlockEditorOwner = null;

  public constructor(regData ?: BlockRegData) {
    super(regData, true);
   
    this.onAddPortElement.addListener(this, (block, port) => this.addPortElement(port));
    this.onRemovePortElement.addListener(this, (block, port) => this.removePortElement(port));
    this.onUpdatePortElement.addListener(this, (block, port) => this.updatePortElement(port));
    this.onPortValueUpdate.addListener(this, (block, port) => this.updatePortParamDisplayVal(port));
    this.onPortConnectorActive.addListener(this, (port, connector) => {
      if(this.currentRunner && this.currentRunner.state != 'stopped') 
        (<ConnectorEditor>connector).active(port);
    });
    this.onPortRemove.addListener(this, this.onPortRemoveCallback);
    this.onEnterBlock.addListener(this, (block) => this.markActive());
    this.onLeaveBlock.addListener(this, (block) => this.markDective());
  }

  public portIcons = {
    portBehaviorIcon: 'icon-sanjiaoxing',
    portBehaviorIconActive: 'icon-zuo',
    portParamIcon: 'icon-search2',
    portParamIconActive: 'icon-yuan1',
    portFailedIconActive: 'icon-close-',
    portBehaviorAddIcon: 'icon-add-behavor-port',
    portParamAddIcon: 'icon-pluss-1',
    portPortDeleteIcon: 'icon-close-1',
  }

  public blockStyleSettings = new BlockStyleSettings();
  public blockMenuSettings = new BlockMenuSettings();

  public getRect() { 
    this.rect.setPos(this.position);
    this.rect.setSize(this.size);
    return this.rect; 
  }

  public el : HTMLDivElement = null;
  public els = new BlockEditorHTMLData();

  public created = false;

  public create(editor : BlockEditorOwner) {

    this.isEditorBlock = true;
    this.editor = editor;
    this.created = true;

    if(this.regData) {
      this.name = this.regData.baseInfo.name;
      this.description = this.regData.baseInfo.description;
      this.logo = this.regData.baseInfo.logo;
      this.blockStyleSettings = this.regData.blockStyle;
      this.blockMenuSettings = this.regData.blockMenu;

      this.onCreateCustomEditor = this.regData.callbacks.onCreateCustomEditor;
      this.onUserAddPort = this.regData.callbacks.onUserAddPort;
      this.onCreatePortCustomEditor = this.regData.callbacks.onCreatePortCustomEditor;

      this.portsChangeSettings = this.regData.settings.portsChangeSettings;
      this.parametersChangeSettings = this.regData.settings.parametersChangeSettings;
    }

    let host = this.editor.getBlockHostElement();

    this.el = document.createElement('div');
    this.el.classList.add("flow-block");
    this.el.setAttribute("id", this.uid);

    if(!StringUtils.isNullOrEmpty(this.blockStyleSettings.minWidth))
      this.el.style.minWidth = this.blockStyleSettings.minWidth;

    //#region Ports

    let content = document.createElement('div');
    let areaPorts = document.createElement('div');
    let areaPortsBottom = document.createElement('div');

    this.els.elInputPorts = document.createElement('div');
    this.els.elInputPorts.classList.add("ports", 'input');
    this.els.elOutputPorts = document.createElement('div');
    this.els.elOutputPorts.classList.add("ports", 'output');

    this.els.elAddInputBehaviorPort = document.createElement('a');
    this.els.elAddOutputBehaviorPort = document.createElement('a');
    this.els.elAddInputBehaviorPort.classList.add('port-add','iconfont', 'Behavior', this.portIcons.portBehaviorAddIcon);
    this.els.elAddOutputBehaviorPort.classList.add('port-add','iconfont', 'Behavior',this.portIcons.portBehaviorAddIcon);
    this.els.elAddInputBehaviorPort.setAttribute('data-title', '添加入端口');
    this.els.elAddOutputBehaviorPort.setAttribute('data-title', '添加出端口');
    ToolTipUtils.registerElementTooltip(this.els.elAddInputBehaviorPort);
    ToolTipUtils.registerElementTooltip(this.els.elAddOutputBehaviorPort);
    this.els.elAddInputBehaviorPort.onclick = this.onUserAddInputPort.bind(this);
    this.els.elAddOutputBehaviorPort.onclick = this.onUserAddOutputPort.bind(this);

    this.els.elAddInputParamPort = document.createElement('a');
    this.els.elAddOutputParamPort = document.createElement('a');

    this.els.elAddInputParamPort.classList.add('port-add','iconfont', 'Param', this.portIcons.portParamAddIcon);
    this.els.elAddOutputParamPort.classList.add('port-add','iconfont', 'Param', this.portIcons.portParamAddIcon);
    this.els.elAddInputParamPort.setAttribute('data-title', '添加入参数');
    this.els.elAddOutputParamPort.setAttribute('data-title', '添加出参数');
    ToolTipUtils.registerElementTooltip(this.els.elAddInputParamPort);
    ToolTipUtils.registerElementTooltip(this.els.elAddOutputParamPort);
    this.els.elAddInputParamPort.onclick = this.onUserAddInputParam.bind(this);
    this.els.elAddOutputParamPort.onclick = this.onUserAddOutputParam.bind(this);

    areaPorts.classList.add("area");
    areaPorts.appendChild(this.els.elInputPorts);
    areaPorts.appendChild(this.els.elOutputPorts);
    areaPortsBottom.classList.add("area-bottom");
    areaPortsBottom.appendChild(this.els.elAddInputBehaviorPort);
    areaPortsBottom.appendChild(this.els.elAddInputParamPort);
    areaPortsBottom.appendChild(this.els.elAddOutputParamPort);
    areaPortsBottom.appendChild(this.els.elAddOutputBehaviorPort);

    content.appendChild(areaPorts);
    content.appendChild(areaPortsBottom);
    content.classList.add("content");

    //#endregion

    //#region Title and logo

    this.els.elTitle = document.createElement('div');
    this.els.elTitle.classList.add("title");
    this.els.elTitle.setAttribute('data-title', this.description);
    ToolTipUtils.registerElementTooltip(this.els.elTitle);

    if(!CommonUtils.isNullOrEmpty(this.blockStyleSettings.titleColor))
      this.els.elTitle.style.color = this.blockStyleSettings.titleColor;
    if(!CommonUtils.isNullOrEmpty(this.blockStyleSettings.titleBakgroundColor))
      this.els.elTitle.style.background = this.blockStyleSettings.titleBakgroundColor;
    if(this.blockStyleSettings.smallTitle) 
      this.els.elTitle.classList.add("small");
    if(this.blockStyleSettings.noTitle) 
      this.els.elTitle.classList.add("hide");

    this.els.elBreakPointArrow = document.createElement('div');
    this.els.elBreakPointArrow.classList.add('breakpoint-arrow','iconfont', 'icon-zuo');
    this.els.elBreakPointArrow.style.display = 'none';

    this.els.elBreakPointStatus = document.createElement('div');
    this.els.elBreakPointStatus.classList.add('breakpoint-status','iconfont');
    this.els.elBreakPointStatus.style.display = 'none';

    this.els.elCustomEditor = document.createElement('div');
    this.els.elCustomEditor.classList.add("custom-editor");

    if(this.blockStyleSettings.smallTitle || this.blockStyleSettings.noTitle) 
      this.els.elCustomEditor.classList.add('without-title');
    
    if(this.blockStyleSettings.smallTitle && !this.blockStyleSettings.noTitle) {

      let titleSmall = document.createElement('div');
      let titleSmallSpan = document.createElement('span');

      titleSmall.classList.add('title-small');
      titleSmallSpan.innerText = this.name
      titleSmall.setAttribute('data-title', this.description);
      titleSmall.appendChild(titleSmallSpan);
      ToolTipUtils.registerElementTooltip(titleSmall);
      this.el.appendChild(titleSmall);
    }
  
    this.els.elTitleText = document.createElement('span');
    this.els.elLogo = document.createElement('div');
    this.els.elLogo.classList.add("logo");
    this.els.elLogoRight = document.createElement('div');
    this.els.elLogoRight.classList.add("logo-right");
    this.els.elLogoBottom = document.createElement('div');
    this.els.elLogoBottom.classList.add("logo-bottom");

    this.els.elLogo.style.display = (CommonUtils.isNullOrEmpty(this.logo) || this.blockStyleSettings.hideLogo) ? 'none' : 'inline-block';
    if(this.logo.startsWith('<')) this.els.elLogo.innerHTML = this.logo;
    else if(!CommonUtils.isNullOrEmpty(this.logo)) this.els.elLogo.style.backgroundImage = 'url(' + this.logo + ')';

    this.els.elLogoBottom.style.display = CommonUtils.isNullOrEmpty(this.blockStyleSettings.logoBottom) ? 'none' : 'inline-block';
    if(this.logo.startsWith('<')) this.els.elLogoBottom.innerHTML = this.blockStyleSettings.logoBottom;
    else if(!CommonUtils.isNullOrEmpty(this.els.elLogoBottom)) this.els.elLogoBottom.style.backgroundImage = 'url(' + this.blockStyleSettings.logoBottom + ')';
    
    this.els.elLogoRight.style.display = CommonUtils.isNullOrEmpty(this.blockStyleSettings.logoRight) ? 'none' : 'inline-block';
    if(this.logo.startsWith('<')) this.els.elLogoRight.innerHTML = this.blockStyleSettings.logoRight;
    else if(!CommonUtils.isNullOrEmpty(this.els.elLogoRight)) this.els.elLogoRight.style.backgroundImage = 'url(' + this.blockStyleSettings.logoRight + ')';

    if(!CommonUtils.isNullOrEmpty(this.blockStyleSettings.logoBackground))
      this.el.style.backgroundImage = 'url(' + this.blockStyleSettings.logoBackground + ')';
      
    this.els.elTitle.appendChild(this.els.elLogo);
    this.els.elTitle.appendChild(this.els.elTitleText);
    this.els.elTitle.appendChild(this.els.elLogoRight);
    this.els.elTitle.appendChild(this.els.elLogoBottom);

    //#endregion

    //#region Comment

    this.els.elBottomInfoHost = document.createElement('div');
    this.els.elBottomInfoHost.classList.add('bottom-info');

    content.appendChild(this.els.elBottomInfoHost);
 
    this.els.elComment = document.createElement('div');
    this.els.elComment.classList.add('flow-block-comment', 'flow-block-no-move');
    this.els.elCommentText = document.createElement('div');
    this.els.elCommentText.classList.add('flow-block-comment-text', 'flow-block-no-move');
    this.els.elCommentText.setAttribute('contenteditable', 'true');
    this.els.elCommentPlaceHolder = document.createElement('span');
    this.els.elCommentPlaceHolder.classList.add('flow-block-comment-place-holder');
    this.els.elCommentPlaceHolder.innerText = '点击添加注释';
    this.els.elCommentOpen = document.createElement('a');
    this.els.elCommentOpen.setAttribute('data-title', '打开注释气泡');
    this.els.elCommentOpen.classList.add('flow-block-comment-open','iconfont','icon-qipao');
    ToolTipUtils.registerElementTooltip(this.els.elCommentOpen);
    this.els.elCommentClose = document.createElement('a');
    this.els.elCommentClose.classList.add('iconfont','icon-close-');
    this.els.elCommentClose.setAttribute('data-title', '隐藏注释气泡');
    ToolTipUtils.registerElementTooltip(this.els.elCommentClose);

    this.els.elCommentOpen.onclick = () => {
      this.markOpen = true;
      this.updateComment();
    };
    this.els.elCommentClose.onclick = () => {
      this.markOpen = false;
      this.updateComment();
    };
    this.els.elCommentPlaceHolder.onclick = () => {
      this.els.elCommentPlaceHolder.style.display = 'none';
      this.els.elCommentText.focus();
    };
    this.els.elCommentText.oninput = () => {
      this.els.elComment.style.top = -(this.els.elCommentText.offsetHeight - 23 + 40) + 'px';
    };
    this.els.elCommentText.onblur = () => {
      this.mark = this.els.elCommentText.innerText;
      this.updateComment();
    };

    this.els.elComment.appendChild(this.els.elCommentPlaceHolder);
    this.els.elComment.appendChild(this.els.elCommentText);
    this.els.elComment.appendChild(this.els.elCommentClose);

    //#endregion

    this.el.appendChild(this.els.elCommentOpen);
    this.el.appendChild(this.els.elComment);
    this.el.appendChild(this.els.elTitle);
    this.el.appendChild(this.els.elCustomEditor);
    this.el.appendChild(content);
    this.el.appendChild(this.els.elBreakPointStatus);
    this.el.appendChild(this.els.elBreakPointArrow);

    //Events

    this.el.addEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.el.addEventListener('mouseleave', this.onMouseOut.bind(this));
    this.el.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.el.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.el.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.el.addEventListener('resize', this.onResize.bind(this));
    this.el.addEventListener('wheel', this.onMouseWhell.bind(this));
    this.el.addEventListener('contextmenu', this.onContextMenu.bind(this));

    ToolTipUtils.registerElementTooltip(this.el);

    //load port elements
    this.allPorts.forEach(port => {
      if(port.editorData == null)
        this.addPortElement(port);
    });

    host.appendChild(this.el);

    this.createFn();

    this.onEditorCreate.invoke(this);

    if(typeof this.onCreateCustomEditor == 'function')
      this.onCreateCustomEditor(this.els.elCustomEditor, this, this.regData);

    this.onResize();
    this.flushAllPortElementCreateState();
    this.updateContent();
    this.updateBreakPointStatus();
    this.updateComment();
  }
  public destroy() {

    this.onDestroy.invoke(this);
    this.editor.onBlockDelete(this);

    this.created = false;

    this.el.removeEventListener('mouseenter', this.onMouseEnter.bind(this));
    this.el.removeEventListener('mouseleave', this.onMouseOut.bind(this));
    this.el.removeEventListener('mousedown', this.onMouseDown.bind(this));
    this.el.removeEventListener('resize', this.onResize.bind(this));
    this.el.removeEventListener('wheel', this.onMouseWhell.bind(this));
    this.el.removeEventListener('contextmenu', this.onContextMenu.bind(this));

    this.inputPorts = null;
    this.outputPorts = null;
    this.allPorts = null;

    this.editor.getBlockHostElement().removeChild(this.el);
  }
  public clone() {
    let blockEditor = new BlockEditor(this.regData);
    blockEditor.options = this.options;
    blockEditor.breakpoint = this.breakpoint;

    this.allPorts.forEach(port => {
      if(port.isDyamicAdd)
        blockEditor.addPort(port.regData, true, port.getValue());
    });

    return blockEditor;
  }

  /**
   * 更新位置
   * @param pos 位置
   */
  public setPos(pos ?: Vector2) {
    if(typeof pos != 'undefined')
      this.position.Set(pos);
    this.el.style.left = this.position.x + 'px';
    this.el.style.top = this.position.y + 'px';
  }
  /**
   * 断开端口的所有连接
   * @param oldData 目标
   */
  public unConnectPort(oldData : BlockPort) {
    if(oldData.direction == 'input') {
      if(oldData.connectedFromPort.length > 0)
        oldData.connectedFromPort.forEach((c) => 
          this.editor.unConnectConnector(<ConnectorEditor>c.connector));
    }
    else if(oldData.direction == 'output') {
      if(oldData.connectedToPort.length > 0)
        oldData.connectedToPort.forEach((c) => 
          this.editor.unConnectConnector(<ConnectorEditor>c.connector));
    }
  }
  /**
   * 隐藏
   */
  public hide() {
    if(this.created) this.el.style.display = 'none';
  }
  /**
   * 显示
   */
  public show() {
    if(this.created) this.el.style.display = '';
  }

  //#region 数据更新

  public updateZoom(zoom : number) {
    this.el.style.zoom = zoom.toString();
  }
  public updateContent() {
    if(!this.created) return;

    if(this.blockStyleSettings.smallTitle || this.blockStyleSettings.noTitle)
      this.el.setAttribute('data-title', this.name + '\n' + this.description);
    else{
      this.els.elTitleText.innerText = this.name;
      this.els.elTitle.setAttribute('data-title', this.description);
    }
    this.el.setAttribute('data-guid', this.guid);

    this.els.elTitle.style.color = this.blockStyleSettings.titleColor;
    this.els.elTitle.style.background = this.blockStyleSettings.titleBakgroundColor;

    if((!this.portsChangeSettings.userCanAddInputPort && !this.portsChangeSettings.userCanAddOutputPort
      && !this.parametersChangeSettings.userCanAddInputParameter && !this.parametersChangeSettings.userCanAddOutputParameter)) {
      this.els.elAddInputBehaviorPort.style.display = 'none';
      this.els.elAddOutputBehaviorPort.style.display = 'none';
      this.els.elAddInputParamPort.style.display = 'none';
      this.els.elAddOutputParamPort.style.display = 'none';
    } else {
      this.els.elAddInputBehaviorPort.style.display = '';
      this.els.elAddOutputBehaviorPort.style.display = '';
      this.els.elAddInputParamPort.style.display = '';
      this.els.elAddOutputParamPort.style.display = '';
      this.els.elAddInputBehaviorPort.style.visibility = this.portsChangeSettings.userCanAddInputPort ? '' : 'hidden';
      this.els.elAddOutputBehaviorPort.style.visibility = this.portsChangeSettings.userCanAddOutputPort ? '' : 'hidden';
      this.els.elAddInputParamPort.style.visibility = this.parametersChangeSettings.userCanAddInputParameter ? '' : 'hidden';
      this.els.elAddOutputParamPort.style.visibility = this.parametersChangeSettings.userCanAddOutputParameter ? '' : 'hidden';
    }
    
  }
  public updateSelectStatus(selected?:boolean) {
    if(typeof selected === 'boolean') this.selected = selected;
    if(!this.created) return;

    if(this.selected) this.el.classList.add("selected");
    else this.el.classList.remove("selected");
  }
  public updateBreakPointStatus() {
    if(!this.created) return;
    switch(this.breakpoint) {
      case 'disable':
        this.els.elBreakPointStatus.style.display = 'inline-block';
        this.els.elBreakPointStatus.classList.add('icon-tx-babianxing');
        this.els.elBreakPointStatus.classList.remove('icon-tx-fill-babianxing');
        this.els.elBreakPointStatus.setAttribute('data-title', '此单元已禁用断点');
        break;
      case 'enable':
        this.els.elBreakPointStatus.style.display = 'inline-block';
        this.els.elBreakPointStatus.classList.remove('icon-tx-babianxing');
        this.els.elBreakPointStatus.classList.add('icon-tx-fill-babianxing');
        this.els.elBreakPointStatus.setAttribute('data-title', '此单元已启用断点');
        break;
      case 'none':
        this.els.elBreakPointStatus.style.display = 'none';
        break;
    }
  }
  public updateComment() {
    if(!this.created) return;
    this.els.elComment.style.display = this.markOpen ? '' : 'none';
    this.els.elCommentClose.style.display = this.markOpen ? '' : 'none';
    this.els.elCommentOpen.style.display = this.markOpen ? 'none' : '';
    this.els.elCommentText.innerText = this.mark;
    this.els.elCommentPlaceHolder.style.display = this.mark == '' ? '' : 'none';
  }

  //#endregion

  //#region 节点元素更新
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

    if(!this.created) return;

    port.editorData = new BlockPortEditorData();
    port.editorData.parent = port;
    port.editorData.block = this;
    port.editorData.el = document.createElement('div');
    port.editorData.el.classList.add("port");
    port.editorData.elDot = document.createElement('i');
    port.editorData.elSpan = document.createElement('span');
    port.editorData.elDeleteButton = document.createElement('a');
    port.editorData.elDeleteButton.onclick = () => this.onUserDeletePort(port);

    port.editorData.elDeleteButton.classList.add("port-delete", "iconfont", this.portIcons.portPortDeleteIcon);
    port.editorData.elDeleteButton.style.display = port.isDyamicAdd ? 'inline-block' : 'none';
    port.editorData.elDeleteButton.setAttribute('data-title', '删除参数');
    ToolTipUtils.registerElementTooltip(port.editorData.elDeleteButton);

    port.editorData.el.setAttribute('data-param-type', port.paramType);
    port.editorData.el.setAttribute('data-param-custom-type', port.paramCustomType);
    port.editorData.elDot.style.color = 'rgb(253,253,253)';

    port.editorData.elDot.classList.add("port-dot", "iconfont");
    port.editorData.el.setAttribute('data-port-guid', port.guid);
    port.editorData.el.setAttribute('data-block-uid', this.uid);
    port.editorData.elSpan.innerText = port.name;

    this.createOrRecreateParamPortEditor(port, true);

    port.editorData.el.addEventListener('mousedown', (e) => this.onPortMouseDown(port, e));
    port.editorData.el.addEventListener('mouseenter', (e) => this.onPortMouseEnter(port, e));
    port.editorData.el.addEventListener('mouseleave', () => this.onPortMouseLeave(port));
    ToolTipUtils.registerElementTooltip(port.editorData.el);

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
    if(port.paramType == 'execute')
      port.editorData.elDot.classList.add(this.portIcons.portBehaviorIcon)
    else 
      port.editorData.elDot.classList.add(this.portIcons.portParamIcon);

    if(port.direction == 'input') this.els.elInputPorts.appendChild(port.editorData.el);
    else if(port.direction == 'output') this.els.elOutputPorts.appendChild(port.editorData.el);

    this.createOrReCreatePortCustomEditor(port);
  }
  public createOrReCreatePortCustomEditor(port : BlockPort) {
    if(typeof this.onCreatePortCustomEditor === 'function') {

      if(port.editorData.elCustomEditor != null) {
        port.editorData.elCustomEditor.parentNode.removeChild(port.editorData.elCustomEditor);
        port.editorData.elCustomEditor = null;
      }

      port.editorData.elCustomEditor = this.onCreatePortCustomEditor(port.editorData.el, this, port);

      //添加元素
      if(port.editorData.elCustomEditor!=null) {
        port.editorData.elCustomEditor.classList.add('param-editor');

        //switch port and text's direction
        if(port.direction == 'input')
          port.editorData.el.insertBefore(port.editorData.elCustomEditor, port.editorData.elDeleteButton);
        else if(port.direction == 'output')
          port.editorData.el.insertBefore(port.editorData.elCustomEditor, port.editorData.elSpan);
      }

    }
  }
  private createOrRecreateParamPortEditor(port : BlockPort, isAdd = false) {
    if(!this.created) return;

    if(port.paramType == 'execute') {
      port.editorData.el.setAttribute('data-title', port.name + (CommonUtils.isNullOrEmpty(port.description) ? '' : ('\n' + port.description)));
      return;
    }

    if(port.editorData.oldParamCustomType == port.paramCustomType && port.editorData.oldParamType == port.paramType) {
      this.updatePortParamDisplayVal(port);
      return;
    }

    if(port.editorData.elEditor != null) {
      port.editorData.elEditor.parentNode.removeChild(port.editorData.elEditor);
      port.editorData.elEditor = null;
    }

    let portParameter = port;
    let customType : BlockParameterTypeRegData = null;

    if((portParameter.paramType == 'custom' || portParameter.paramType == 'enum') 
        && !CommonUtils.isNullOrEmpty(portParameter.paramCustomType)) 
        customType = ParamTypeServiceInstance.getCustomType(portParameter.paramCustomType);

    //获取类型编辑器
    let editor : BlockParameterEditorRegData = null;
    if(port.direction == 'input' || port.forceEditorControlOutput) {
      if((portParameter.paramType == 'custom' || portParameter.paramType == 'enum') && customType !=  null){
        editor = customType.editor;
        if(editor == null && customType.prototypeName == 'enum')
          editor = AllEditors.getDefaultEnumEditor(<BlockParameterEnumRegData>customType);
      }
      else editor = AllEditors.getBaseEditors(portParameter.paramType);
    }
    
    //类型说明
    port.editorData.el.setAttribute('data-param-type-name', (customType != null ? customType.name : portParameter.paramType));
    port.editorData.el.setAttribute('data-param-type', portParameter.paramType);
    port.editorData.el.setAttribute('data-param-custom-type', portParameter.paramCustomType);
    port.editorData.elEditor = null;

    this.updatePortParamDisplayVal(port);

    if(customType != null)
      port.editorData.elDot.style.color = customType.color;
    else
      port.editorData.elDot.style.color = ParamTypeServiceInstance.getTypeColor(port.paramType);
    //创建类型编辑器
    if(!port.forceNoEditorControl && editor != null) {

      //创建编辑器和更新回调
      port.editorData.elEditor = editor.editorCreate(port.editorData.el, (v) => {
        portParameter.paramUserSetValue = v;
        portParameter.setValue(v);
        portParameter.update();
        return v;
      }, portParameter.paramUserSetValue, portParameter.paramDefaultValue, customType);

      //添加元素
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

    port.editorData.editor = editor;
    port.editorData.oldParamCustomType = port.paramCustomType;
    port.editorData.oldParamType = port.paramType;
  }

  public updateAllPortElement() {
    this.allPorts.forEach((p) => this.updatePort(p));
  }
  public updateAllParamPort() {
    this.allPorts.forEach((p) => {
      if(p.paramType != 'execute') p.update();
    });
  }
  public updatePort(port : BlockPort) {
    this.updatePortElement(port);
  }
  public flushAllPortElementCreateState() {
    this.allPorts.forEach((port) => {
      if(port.editorData == null) {
        this.addPortElement(port);
      }
    })
  }
  public updatePortParamDisplayVal(port : BlockPort) {
    ToolTipUtils.updateElementTooltip(port.editorData.el, this.getPortParamValStr(port));   
  }

  private updatePortElement(port : BlockPort) {
    if(!this.created) return;

    port.editorData.elSpan.innerText = port.name;
    port.editorData.elDeleteButton.style.display = port.isDyamicAdd ? 'inline-block' : 'none';
    if(port.paramType == 'execute'){
      port.editorData.el.setAttribute('data-title', port.name + (CommonUtils.isNullOrEmpty(port.description) ? '' : ('\n' + port.description)));
      port.editorData.elDot.classList.remove('icon-yuan1','icon-search2');
    } else {
      port.editorData.elDot.classList.remove('icon-sanjiaoxing','icon-zuo');
      port.editorData.el.setAttribute('data-param-type', port.paramType);
      port.editorData.el.setAttribute('data-param-custom-type', port.paramCustomType);

      this.createOrRecreateParamPortEditor(port);
      this.updatePortParamDisplayVal(port);
    }

    this.updatePortConnectStatusElement(port);
  }
  private removePortElement(port : BlockPort) {
    if(!this.created) return;

    port.editorData.el.parentNode.removeChild(port.editorData.el);
    port.editorData = null;
  }
  private onPortRemoveCallback(block, port : BlockPort) {
    this.unConnectPort(port);
  }
  private getPortParamValStr(port : BlockPort) {
    if(!this.created) return '变量未创建';

    return '<h5>' + port.name
      + '</h5><span class="text-secondary">' + port.description
      + '</span><br/>类型：' + port.editorData.el.getAttribute('data-param-type-name')
      + '<br/>值：' + (CommonUtils.valueToStr(this.currentRunningContext == null ? port.getUserSetValue() : port.getValue()));
  }

  public movePortElementUpOrDown(port : BlockPort, move : 'up'|'down') {
    let refEl : Element = null;
    let parent = port.editorData.el.parentNode;
    if(move == 'up') 
      refEl = port.editorData.el.previousElementSibling;
    else {
      let n = port.editorData.el.nextElementSibling;
      if(n != null) {
        refEl = n.nextElementSibling;
        if(refEl == null) {
          parent.removeChild(port.editorData.el);
          parent.appendChild(port.editorData.el);
        }
      }
    }
    if(refEl != null) {
      parent.removeChild(port.editorData.el);
      parent.insertBefore(port.editorData.el, refEl);
    }
  }

  //#endregion

  //#region 编辑器显示状态更新

  public forceUpdateParamValueToEditor(port : BlockPort) {
    if(port.editorData.editor != null)
      port.editorData.editor.forceUpdateValue(port, port.editorData.elEditor);
  }
  public updatePortConnectStatusElement(port : BlockPort) {

    //点的状态
    if(port.editorData.forceDotErrorState){
      port.editorData.elDot.classList.add("error", this.portIcons.portFailedIconActive);
      port.editorData.elDot.classList.remove(this.portIcons.portBehaviorIcon, this.portIcons.portBehaviorIconActive, 
        this.portIcons.portParamIcon, this.portIcons.portParamIconActive);
    }else {
      port.editorData.elDot.classList.remove("error", this.portIcons.portFailedIconActive);
      if(port.paramType == 'execute')
        CommonUtils.setClassWithSwitch(port.editorData.elDot, port.isPortConnected() || port.editorData.forceDotActiveState,
          this.portIcons.portBehaviorIcon, this.portIcons.portBehaviorIconActive);
      else
        CommonUtils.setClassWithSwitch(port.editorData.elDot, port.isPortConnected() || port.editorData.forceDotActiveState, 
          this.portIcons.portParamIcon, this.portIcons.portParamIconActive);
    }

    //数值编辑器状态
    if(port.paramType != 'execute') 
    {
      if(port.editorData.elEditor != null) {
        port.editorData.elEditor.style.display = port.isPortConnected() ? 'none' : 'inline-block';
      }
    }
  }
  public markBreakPointActiveState(active : boolean) {
    if(active) {
      this.el.classList.add('breakpoint-actived');
      this.els.elBreakPointArrow.style.display = '';
    }
    else { 
      this.el.classList.remove('breakpoint-actived');
      this.els.elBreakPointArrow.style.display = 'none';
    }
  }
  public markActive() {
    this.activeFlashCount = 0;
    if(this.activeFlashInterval == null) {
      this.el.classList.add('actived');
      
      this.activeFlashInterval = setInterval(() => {
        this.el.classList.toggle('actived');
        this.activeFlashCount++;
        if(this.activeFlashCount >= 3)
          this.markDective(true);
      }, 200);
    }
  }
  public markDective(force = false) {
    if(force || this.currentRunner.stepMode) {
      this.el.classList.remove('actived');
      clearInterval(this.activeFlashInterval);
      this.activeFlashInterval = null;
  
      Object.keys(this.inputPorts).forEach(key => {
        let port = (<BlockPort>this.inputPorts[key]);
        if(port.connectedFromPort.length > 0)
          port.connectedFromPort.forEach(element => (<ConnectorEditor>element.connector).clearActive());
      });
    }
  }
  public addBottomTip(icon : string, text : string, className : string = '', show = true) {
    let d = document.createElement('div');
    d.setAttribute('class', className);
    d.innerHTML = '<i class="iconfont '+icon+' mr-2"></i>' + text;
    this.els.elBottomInfoHost.appendChild(d);
    return d;
  }
  public updateBottomTip(el : HTMLElement, icon : string, text : string, className : string = '') {
    el.setAttribute('class', className);
    el.innerHTML = '<i class="iconfont '+icon+' mr-2"></i>' + text;
    return el;
  }
  public deleteBottomTip(el : HTMLElement) {
    this.els.elBottomInfoHost.removeChild(el);
  }

  private activeFlashInterval = null;
  private activeFlashCount = 0;

  //#endregion 

  //#region 其他事件

  private onUserDeletePort(port : BlockPort) {
    this.editor.getVue().$Modal.confirm({
      title: '提示',
      content: '确定删除此端口？',
      onOk: () => this.deletePort(port.guid),
      onCancel: () => {}
    });
  }
  private onUserAddInputPort() { this.addPort(this.onUserAddPort(this, 'input', 'execute'), true); }
  private onUserAddOutputPort() { this.addPort(this.onUserAddPort(this, 'output', 'execute'), true); }
  private onUserAddInputParam() { this.addPort(this.onUserAddPort(this, 'input', 'param'), true); }
  private onUserAddOutputParam() { this.addPort(this.onUserAddPort(this, 'output', 'param'), true); }

  private onResize() {
    this.size.Set(
      this.el.offsetWidth,
      this.el.offsetHeight
    )
  }

  //#endregion 

  //#region 鼠标事件

  //
  // 节点移动事件

  public mouseDownInPort = false;
  public mouseConnectingPort = false;

  private onPortMouseEnter(port : BlockPort, e : MouseEvent) {
    this.editor.updateCurrentHoverPort(port);
    
    if(port.paramType != 'execute') {
      ToolTipUtils.updateElementTooltip(port.editorData.el, this.getPortParamValStr(port));   
    }
  }
  private onPortMouseLeave(port : BlockPort) {
    this.editor.updateCurrentHoverPortLeave(port);
  }
  private onPortMouseMove(e : MouseEvent) {
    this.mouseConnectingPort = true;
    this.editor.updateConnectEnd(new Vector2(e.x, e.y));
    return true;
  }
  private onPortMouseDown(port : BlockPort, e : MouseEvent) {
    if(!this.testIsDownInControl(e)) {
      this.mouseDownInPort = true;
      this.mouseConnectingPort = false;
      this.editor.startConnect(port);
      this.editor.updateConnectEnd(new Vector2(e.x, e.y));

      this.fnonPortMouseUp = () => this.onPortMouseUp(port);

      document.addEventListener('mouseup', this.fnonPortMouseUp);
      document.addEventListener('mousemove', this.fnonPortMouseMove);

      e.stopPropagation();
    }
  }
  private onPortMouseUp(port : BlockPort) {
    this.mouseDownInPort = false;
    this.mouseConnectingPort = false;
    this.editor.endConnect(port);
    
    document.removeEventListener('mouseup', this.fnonPortMouseUp);
    document.removeEventListener('mousemove', this.fnonPortMouseMove);
  }

  //#endregion 

  //#region 单元移动事件

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
  
    if(this.mouseDown && e.button == 0 && !this.mouseDownInPort && !this.mouseConnectingPort) {
      let pos = new Vector2(
        this.lastBlockPos.x + (e.x - this.mouseLastDownPos.x),
        this.lastBlockPos.y + (e.y - this.mouseLastDownPos.y)
      );
      if(pos.x != this.position.x || pos.y != this.position.y) {
        this.lastMovedBlock = true;
        this.setPos(pos);
        this.editor.onMoveBlock(this, new Vector2(e.x - this.mouseLastDownPos.x, e.y - this.mouseLastDownPos.y));

        //如果当前块没有选中，在这里切换选中状态
        if(!this.selected) {
          let multiSelectBlocks = this.editor.getMultiSelectedBlocks();
          if(multiSelectBlocks.length == 0 || multiSelectBlocks.contains(this)) {
            this.updateSelectStatus(true);
            this.editor.onUserSelectBlock(this, true);
          }else {
            this.editor.unSelectAllBlocks();
            this.updateSelectStatus(true);
            this.editor.onUserSelectBlock(this, false);
          }
        }
      }
      return true;
    }
    return false;
  }
  private onMouseDown(e : MouseEvent) {
    if(!this.testIsDownInControl(e)) {
      this.mouseDown = true;
      this.mouseLastDownPos.Set(e.x, e.y);
      this.lastMovedBlock = false;
      this.lastBlockPos.Set(this.position);

      document.addEventListener('mousemove', this.fnonMouseMove);
      document.addEventListener('mouseup', this.fnonMouseUp);

      e.stopPropagation();
    }
  }
  private onMouseUp(e : MouseEvent) {
    this.mouseDown = false;

    if(this.lastMovedBlock) {
      this.editor.onMoveBlockEnd(this);
    }else {
      this.updateSelectStatus(true);
      this.editor.onUserSelectBlock(this, e.button == 0);
    }

    document.removeEventListener('mousemove', this.fnonMouseMove);
    document.removeEventListener('mouseup', this.fnonMouseUp);
  }
  private onMouseWhell(e : WheelEvent) {
    if(this.testIsDownInControl(e)) 
      e.stopPropagation();
  }
  private onContextMenu(e) {
    this.editor.showBlockRightMenu(new Vector2(e.x, e.y));
    return false;
  }

  //#endregion 

  private testIsDownInControl(e : MouseEvent){
    let target = (<HTMLElement>e.target);
    return (HtmlUtils.isEventInControl(e)
      || target.classList.contains('flow-block-no-move') 
      || target.classList.contains('param-editor') 
      || target.classList.contains('port-delete') 
      || target.classList.contains('port')
      || target.classList.contains('custom-editor'));
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
  public onCreatePortCustomEditor : BlockPortEditorComponentCreateFn = null;
  public onUserAddPort : OnUserAddPortCallback = null;
}

/**
 * 单元的编辑器使用数据
 */
export class BlockEditorHTMLData {

  elInputPorts : HTMLDivElement = null;
  elOutputPorts : HTMLDivElement = null;

  elAddInputBehaviorPort : HTMLElement = null;
  elAddOutputBehaviorPort : HTMLElement = null;
  elAddInputParamPort : HTMLElement = null;
  elAddOutputParamPort : HTMLElement = null;

  elBottomInfoHost : HTMLElement = null;

  elTitle : HTMLDivElement = null;
  elTitleText : HTMLElement = null;
  elCustomEditor : HTMLDivElement = null;

  elLogo : HTMLDivElement = null;
  elLogoRight : HTMLDivElement = null;
  elLogoBottom : HTMLDivElement = null;

  elBreakPointArrow : HTMLDivElement = null;
  elBreakPointStatus : HTMLDivElement = null ;

  elComment : HTMLDivElement = null;
  elCommentText : HTMLDivElement = null;
  elCommentPlaceHolder : HTMLSpanElement = null;
  elCommentOpen : HTMLElement = null;
  elCommentClose : HTMLElement = null;
}