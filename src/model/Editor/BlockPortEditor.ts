import ParamTypeServiceInstance from "../../sevices/ParamTypeService";
import CommonUtils from "../../utils/CommonUtils";
import HtmlUtils from "../../utils/HtmlUtils";
import ToolTipUtils from "../../utils/ToolTipUtils";
import { BlockParameterEditorRegData, BlockParameterEnumRegData, BlockParameterTypeRegData } from "../Define/BlockDef";
import { BlockParameterSetType } from "../Define/BlockParameterType";
import { BlockPort } from "../Define/Port";
import AllEditors from "../TypeEditors/AllEditors";
import { Vector2 } from "../Vector2";
import { BlockEditor } from "./BlockEditor";

export const BlockPortIcons = {
  portBehaviorIcon: 'icon-sanjiaoxing',
  portBehaviorIconActive: 'icon-zuo',
  portParamIcon: 'icon-search2',
  portParamIconActive: 'icon-yuan1',

  portParamIconArray: 'icon-port-array',
  portParamIconArrayActive: 'icon-port-array-full',
  portParamIconSet: 'icon-port-set',
  portParamIconDictionaryLeft: 'icon-port-dictionary-left',
  portParamIconDictionaryRight: 'icon-port-dictionary-right',

  portFailedIconActive: 'icon-close-',
  portBehaviorAddIcon: 'icon-add-behavor-port',
  portParamAddIcon: 'icon-pluss-1',
  portPortDeleteIcon: 'icon-close-1',
}

/**
 * 端口编辑器类
 */
export class BlockPortEditor extends BlockPort {

  public constructor(block : BlockEditor) {
    super(block);
    this.isEditorPort = true;
    this.fnonPortMouseUp = this.onPortMouseUp.bind(this);
    this.fnonPortMouseMove = this.onPortMouseMove.bind(this);
  }

  public addPortElement(block : BlockEditor) {

    this.editorData = new BlockPortEditorData();
    this.editorData.parent = this;
    this.editorData.block = block;
    this.editorData.el = document.createElement('div');
    this.editorData.el.classList.add("port");
    this.editorData.elDot = document.createElement('i');
    this.editorData.elDotIconLeft = document.createElement('i');
    this.editorData.elDotIconRight = document.createElement('i');
    this.editorData.elSpan = document.createElement('span');
    this.editorData.elDeleteButton = document.createElement('a');
    this.editorData.elDeleteButton.onclick = () => block.onUserDeletePort(this);

    this.editorData.elDot.appendChild(this.editorData.elDotIconLeft);
    this.editorData.elDot.appendChild(this.editorData.elDotIconRight);

    this.editorData.elDotIconLeft.classList.add("iconfont", BlockPortIcons.portParamIconDictionaryLeft);
    this.editorData.elDotIconRight.classList.add("iconfont", BlockPortIcons.portParamIconDictionaryRight);

    this.editorData.elDeleteButton.classList.add("port-delete", "iconfont", BlockPortIcons.portPortDeleteIcon);
    this.editorData.elDeleteButton.style.display = this.isDyamicAdd ? 'inline-block' : 'none';
    this.editorData.elDeleteButton.setAttribute('data-title', '删除参数');
    ToolTipUtils.registerElementTooltip(this.editorData.elDeleteButton);

    this.editorData.elDot.style.color = 'rgb(253,253,253)';

    this.editorData.elDot.classList.add("port-dot", "iconfont");
    this.editorData.elSpan.innerText = this.name;

    this.createOrRecreateParamPortEditor(true);

    this.editorData.el.addEventListener('mousedown', (e) => this.onPortMouseDown(e));
    this.editorData.el.addEventListener('mouseenter', (e) => this.onPortMouseEnter(e));
    this.editorData.el.addEventListener('mouseleave', () => this.onPortMouseLeave());
    ToolTipUtils.registerElementTooltip(this.editorData.el);

    //switch port and text's direction
    if(this.direction == 'input') {
      this.editorData.el.appendChild(this.editorData.elDot);
      this.editorData.el.appendChild(this.editorData.elSpan);
      if(this.editorData.elEditor != null) this.editorData.el.appendChild(this.editorData.elEditor);
      this.editorData.el.appendChild(this.editorData.elDeleteButton);
    }
    else if(this.direction == 'output') {
      this.editorData.el.appendChild(this.editorData.elDeleteButton);
      if(this.editorData.elEditor != null) this.editorData.el.appendChild(this.editorData.elEditor);   
      this.editorData.el.appendChild(this.editorData.elSpan);
      this.editorData.el.appendChild(this.editorData.elDot);
    }

    //add element node
    if(this.paramType.isExecute())
      this.editorData.elDot.classList.add(BlockPortIcons.portBehaviorIcon)
    else 
      this.editorData.elDot.classList.add(BlockPortIcons.portParamIcon);

    if(this.direction == 'input') (<BlockEditor>this.parent).els.elInputPorts.appendChild(this.editorData.el);
    else if(this.direction == 'output') (<BlockEditor>this.parent).els.elOutputPorts.appendChild(this.editorData.el);

    this.updatePortElement();
    this.createOrReCreatePortCustomEditor();
  }
  public createOrReCreatePortCustomEditor() {
    if(typeof (<BlockEditor>this.parent).onCreatePortCustomEditor === 'function') {

      if(this.editorData.elCustomEditor != null) {
        this.editorData.elCustomEditor.parentNode.removeChild(this.editorData.elCustomEditor);
        this.editorData.elCustomEditor = null;
      }

      this.editorData.elCustomEditor = (<BlockEditor>this.parent).onCreatePortCustomEditor(this.editorData.el, (<BlockEditor>this.parent), this);

      //添加元素
      if(this.editorData.elCustomEditor!=null) {
        this.editorData.elCustomEditor.classList.add('param-editor');

        //switch port and text's direction
        if(this.direction == 'input')
          this.editorData.el.insertBefore(this.editorData.elCustomEditor, this.editorData.elDeleteButton);
        else if(this.direction == 'output')
          this.editorData.el.insertBefore(this.editorData.elCustomEditor, this.editorData.elSpan);
      }

    }
  }
  public createOrRecreateParamPortEditor(isAdd = false) {

    if(this.paramType.isExecute()) {
      this.editorData.el.setAttribute('data-title', this.name + (CommonUtils.isNullOrEmpty(this.description) ? '' : ('\n<small>' + this.description + '</small>')));
      return;
    }

    if(this.paramType.equals(this.editorData.oldParamType)
      && this.paramDictionaryKeyType.equals(this.editorData.oldParamKeyType)
      && this.paramSetType == this.editorData.oldParamSetType) {
      this.updatePortParamDisplayVal();
      return;
    }

    if(this.editorData.elEditor != null) {
      this.editorData.elEditor.parentNode.removeChild(this.editorData.elEditor);
      this.editorData.elEditor = null;
    }

    let portParameter = this;
    let customType : BlockParameterTypeRegData = null;

    if((portParameter.paramType.isCustom()) && !CommonUtils.isNullOrEmpty(portParameter.paramType.customType)) 
        customType = ParamTypeServiceInstance.getCustomType(portParameter.paramType.customType);

    //获取类型编辑器
    let editor : BlockParameterEditorRegData = null;
    if(this.direction == 'input' || this.forceEditorControlOutput) {
      if((portParameter.paramType.isCustom()) && customType !=  null){
        editor = customType.editor;
        if(editor == null && customType.prototypeName == 'enum')
          editor = AllEditors.getDefaultEnumEditor(<BlockParameterEnumRegData>customType);
      }
      else editor = AllEditors.getBaseEditors(portParameter.paramType.baseType);
    }
    if(editor != null && editor.useInSetType.indexOf(portParameter.paramSetType) < 0) editor = null;
    
    //类型说明
    this.editorData.elEditor = null;

    this.updatePortParamDisplayVal();

    if(customType != null)
      this.editorData.elDot.style.color = customType.color;
    else
      this.editorData.elDot.style.color = ParamTypeServiceInstance.getTypeColor(this.paramType.baseType);
    //创建类型编辑器
    if(!this.forceNoEditorControl && editor != null) {

      //创建编辑器和更新回调
      this.editorData.elEditor = editor.editorCreate(this.editorData.el, (v) => {
        portParameter.paramUserSetValue = v;
        if(portParameter.direction == 'output')
          portParameter.updateOnputValue(this.parent.currentRunningContext, v);
        else
          portParameter.setValue(this.parent.currentRunningContext, v);
        return v;
      }, portParameter.paramUserSetValue, portParameter.paramDefaultValue, customType);

      //添加元素
      if(this.editorData.elEditor!=null) {
        this.editorData.elEditor.classList.add('param-editor');

        if(!isAdd) {
          //switch port and text's direction
          if(this.direction == 'input')
            this.editorData.el.insertBefore(this.editorData.elEditor, this.editorData.elDeleteButton);
          else if(this.direction == 'output')
            this.editorData.el.insertBefore(this.editorData.elEditor, this.editorData.elSpan);
        }
      }
    }

    this.editorData.editor = editor;
    this.editorData.oldParamType = this.paramType.getType();
    this.editorData.oldParamKeyType = this.paramDictionaryKeyType.getType();
    this.editorData.oldParamSetType = this.paramSetType;
  }

  public updatePortParamDisplayVal() {
    ToolTipUtils.updateElementTooltip(this.editorData.el, this.getPortParamValStr());   
  }
  public updatePortElement() {
    this.editorData.elSpan.innerText = this.name;
    this.editorData.elDeleteButton.style.display = this.isDyamicAdd ? 'inline-block' : 'none';
    if(this.paramType.isExecute()){
      this.editorData.el.setAttribute('data-title', '<h5 class="text-secondary">' + (CommonUtils.isNullOrEmpty(this.name) ? (
        this.direction == 'input' ? '入口' : '出口'
      ) : this.name) + '</h5>执行' + 
        (CommonUtils.isNullOrEmpty(this.description) ? '' : ('\n<small>' + this.description + '</small>')));
      
      HtmlUtils.hideElement(this.editorData.elDotIconLeft);
      HtmlUtils.hideElement(this.editorData.elDotIconRight);

      this.editorData.elDot.classList.remove(BlockPortIcons.portParamIcon, BlockPortIcons.portParamIconActive, 
        BlockPortIcons.portParamIconArray, BlockPortIcons.portParamIconArrayActive, BlockPortIcons.portParamIconSet);
    } else {

      if(this.paramSetType != 'dictionary') {
        HtmlUtils.hideElement(this.editorData.elDotIconLeft);
        HtmlUtils.hideElement(this.editorData.elDotIconRight);
      }

      this.editorData.elDot.classList.remove(BlockPortIcons.portBehaviorIcon, BlockPortIcons.portBehaviorIconActive);

      this.createOrRecreateParamPortEditor();
      this.updatePortParamDisplayVal();
    }

    this.updatePortConnectStatusElement();
  }
  public removePortElement() {
    this.editorData.el.parentNode.removeChild(this.editorData.el);
    this.editorData = null;
  }
  public getPortParamValStr() {

    let str = '<h5>' + (CommonUtils.isNullOrEmpty(this.name) ? (this.direction == 'input' ? '参数' : '返回值') : this.name)
      + '</h5><span class="text-secondary"><small>' + this.description
      + '</small></span><br/>类型：' + this.getTypeFriendlyString();

    if(this.parent.currentRunner != null) {
      str += '<br/>当前值：';
      if(this.parent.currentRunningContext == null) str += CommonUtils.valueToStr(this.getUserSetValue())
      else str += CommonUtils.valueToStr(
        this.direction == 'input' ? this.rquestInputValue(this.parent.currentRunningContext) : this.rquestOutputValue(this.parent.currentRunningContext)
      );
  
    } else if(this.direction == 'input' && !this.forceNoEditorControl
      && this.editorData.editor != null && this.connectedFromPort.length == 0)
      str += '<br/>设置值：' + CommonUtils.valueToStr(this.getUserSetValue());

    return str;
  }
  public updatePortConnectStatusElement() {

    //点的状态
    if(this.editorData.forceDotErrorState){
      this.editorData.elDot.classList.add("error", BlockPortIcons.portFailedIconActive);
      this.editorData.elDot.classList.remove(BlockPortIcons.portBehaviorIcon, BlockPortIcons.portBehaviorIconActive, 
        BlockPortIcons.portParamIcon, BlockPortIcons.portParamIconActive);

      HtmlUtils.hideElement(this.editorData.elDotIconLeft);
      HtmlUtils.hideElement(this.editorData.elDotIconRight);
    }else {
      this.editorData.elDot.classList.remove("error", BlockPortIcons.portFailedIconActive);
      if(this.paramType.isExecute())
        CommonUtils.setClassWithSwitch(this.editorData.elDot, this.isConnected() || this.editorData.forceDotActiveState,
          BlockPortIcons.portBehaviorIcon, BlockPortIcons.portBehaviorIconActive);
      else {

        this.editorData.elDot.classList.remove(BlockPortIcons.portParamIcon, BlockPortIcons.portParamIconActive, BlockPortIcons.portParamIconArray, 
          BlockPortIcons.portParamIconArrayActive, BlockPortIcons.portParamIconSet);

        switch(this.paramSetType) {
          case 'variable': {
            CommonUtils.setClassWithSwitch(this.editorData.elDot, this.isConnected() || this.editorData.forceDotActiveState, 
              BlockPortIcons.portParamIcon, BlockPortIcons.portParamIconActive);
            break
          }
          case 'array': {
            CommonUtils.setClassWithSwitch(this.editorData.elDot, this.isConnected() || this.editorData.forceDotActiveState, 
              BlockPortIcons.portParamIconArray, BlockPortIcons.portParamIconArrayActive);
            break
          }
          case 'dictionary': {
            this.editorData.elDotIconLeft.setAttribute('style', 'width: 8px;display: inline-block;margin-left: -5px;');
            this.editorData.elDotIconRight.setAttribute('style', 'margin-left: -2px;');
            this.editorData.elDotIconRight.style.color = ParamTypeServiceInstance.getTypeColor(this.paramType.getType(), 'rgb(129,122,122)');
            this.editorData.elDotIconLeft.style.color = ParamTypeServiceInstance.getTypeColor(this.paramDictionaryKeyType.getType(), 'rgb(129,122,122)');

            break
          }
          case 'set': {
            this.editorData.elDot.classList.add(BlockPortIcons.portParamIconSet);
            this.editorData.elDot.style.color = ParamTypeServiceInstance.getTypeColor(this.paramType.getType(), 'rgb(129,122,122)');
            break
          }
        }
        
      }
    }

    //数值编辑器状态
    if(!this.paramType.isExecute()) {
      if(this.editorData.elEditor != null) {
        this.editorData.elEditor.style.display = this.isConnected() ? 'none' : 'inline-block';
      }
    }
  }

  /**
   * 端口的编辑器数据
   */
  public editorData : BlockPortEditorData = null;

  //#region 鼠标事件

  public mouseDownInPort = false;
  public mouseConnectingPort = false;

  private onPortMouseEnter(e : MouseEvent) {
    (<BlockEditor>this.parent).editor.updateCurrentHoverPort(this);
    
    if(!this.paramType.isExecute()) 
      ToolTipUtils.updateElementTooltip(this.editorData.el, this.getPortParamValStr());   
  }
  private onPortMouseLeave() {
    (<BlockEditor>this.parent).editor.updateCurrentHoverPortLeave(this);
  }
  private onPortMouseMove(e : MouseEvent) {
    this.mouseConnectingPort = true;
    (<BlockEditor>this.parent).mouseConnectingPort = true;
    (<BlockEditor>this.parent).editor.updateConnectEnd(new Vector2(e.x, e.y));
    return true;
  }
  private onPortMouseDown(e : MouseEvent) {
    if(!this.testIsDownInControl(e)) {
      this.mouseDownInPort = true;
      (<BlockEditor>this.parent).mouseDownInPort = true;
      this.mouseConnectingPort = false;
      (<BlockEditor>this.parent).mouseConnectingPort = false;
      (<BlockEditor>this.parent).editor.startConnect(this);
      (<BlockEditor>this.parent).editor.updateConnectEnd(new Vector2(e.x, e.y));

      document.addEventListener('mouseup', this.fnonPortMouseUp);
      document.addEventListener('mousemove', this.fnonPortMouseMove);

      e.stopPropagation();
    }
  }
  private onPortMouseUp() {
    this.mouseDownInPort = false;
    this.mouseConnectingPort = false;
    (<BlockEditor>this.parent).mouseDownInPort = false;
    (<BlockEditor>this.parent).mouseConnectingPort = false;
    (<BlockEditor>this.parent).editor.endConnect(this);
    
    document.removeEventListener('mouseup', this.fnonPortMouseUp);
    document.removeEventListener('mousemove', this.fnonPortMouseMove);
  }

  //#endregion 

  private fnonPortMouseMove = null;
  private fnonPortMouseUp = null;

  private testIsDownInControl(e : MouseEvent){
    let target = (<HTMLElement>e.target);
    return (HtmlUtils.isEventInControl(e)
      || target.classList.contains('flow-block-no-move') 
      || target.classList.contains('param-editor') 
      || target.classList.contains('port-delete') 
      || target.classList.contains('port')
      || target.classList.contains('custom-editor'));
  }
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



