import CommonUtils from "../utils/CommonUtils";
import { Block } from "./Block";
import { Vector2 } from "./Vector2";
import { Connector } from "./Connector";
import { BlockPortRegData } from "./BlockDef";
import { BlockEditor } from "./BlockEditor";

/**
 * 单元节点
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
  public guid = "";

  public constructor(block : Block) {
    this.parent = block;
  }

  public direction : BlockPortDirection = null;
  public isDyamicAdd = false;

  public connector : Connector = null;
  public connectedPort : BlockPort = null;
  public parent : Block = null;
  public type : BlockPortType = null;
  public regData : BlockPortRegData = null;

  public editorData : BlockPortEditorData = null;
}
export class BlockPortEditorData {
  public el : HTMLDivElement = null;
  public elDot : HTMLElement = null;
  public elSpan : HTMLSpanElement = null;
  public elEditor : HTMLElement = null;
  public elDeleteButton : HTMLElement = null;

  public forceDotErrorState = false;
  public forceDotActiveState = false;

  public block : BlockEditor = null;
  public parent : BlockPort = null;

  private pos = new Vector2();
  
  public getPosition() {
    this.pos.Set(this.block.position.x + this.elDot.offsetLeft + this.elDot.offsetWidth / 2,  
      this.block.position.y + this.elDot.offsetTop + this.elDot.offsetHeight / 2 + 3);
    return this.pos;
  }

  public updatePortConnectStatusElement() {
    this.block.updatePortConnectStatusElement(this.parent);
  }
}

export type BlockPortType = 'Behavior'|'Parameter';
export type BlockPortDirection = 'input'|'output';
export type BlockParameteType = 'number'|'string'|'boolean'|'function'|'object'|'any'|'enum'|'custom';

/**
 * 行为单元节点
 */
export class BlockBehaviorPort extends BlockPort {
  constructor(block : Block) {
    super(block);
    this.type = 'Behavior';
  }

  public invokeConnectedPort() {
    if(this.connectedPort != null)
      (<BlockBehaviorPort>this.connectedPort).active();
  }

  public active() {
    this.parent.onPortActive(this.parent, this);
  }
}

/**
 * 参数单元节点
 */
export class BlockParameterPort extends BlockPort {
  constructor(block : Block) {
    super(block);
    this.type = 'Parameter';
  }

  public paramType : BlockParameteType = 'any';
  public paramCustomType = '';
  public paramValue : any = null;
  public paramUserSetValue : any = null;

  /**
   * 自定义参数端口属性供代码使用（会保存至文件中）
   */
  public options = {

  };

  public update(source ?: BlockParameterPort) {

    if(source) 
      this.paramValue = source.paramValue;

    this.parent.onParameterUpdate(this.parent, this);

    //更新下一级
    if(this.connectedPort != null 
      && (!this.parent.isEditorBlock || (<BlockEditor>this.parent).editor.getRunningState() == 'running')) {
      (<BlockParameterPort>this.connectedPort).update(this);
    }
  }

  public checkParameterAllow(sourcePort : BlockParameterPort) : boolean {
    if(this.paramType == "any") 
      return true;
    return (this.paramType == sourcePort.paramType && this.paramType != 'custom') || 
      (this.paramType == 'custom' && sourcePort.paramType == 'custom' && this.paramCustomType == sourcePort.paramCustomType) || 
      (this.paramType == 'enum' && sourcePort.paramType == 'enum' && this.paramCustomType == sourcePort.paramCustomType);
  }
}