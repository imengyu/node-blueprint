import CommonUtils from "../utils/CommonUtils";
import { Block } from "./block";
import { Vector2 } from "./vector2";
import { Connector } from "./connector";
import { BlockPortRegData } from "./blockdef";

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
  public uid = "0";
  public guid = "";

  public constructor(block : Block) {
    this.uid = this.uid + '_' + CommonUtils.genNonDuplicateID(3);
    this.parent = block;
  }

  public direction : BlockPortDirection = null;
  public isDyamicAdd = false;

  public connector : Connector = null;
  public connectedPort : BlockPort = null;
  public parent : Block = null;
  public type : BlockPortType = null;

  public el : HTMLDivElement = null;
  public elDot : HTMLElement = null;
  public elSpan : HTMLSpanElement = null;

  public forceDotErrorState = false;
  public forceDotActiveState = false;

  public regData : BlockPortRegData = null;

  private pos = new Vector2();
  
  public getPosition() {
    this.pos.Set(this.parent.position.x + this.elDot.offsetLeft + this.elDot.offsetWidth / 2,  
      this.parent.position.y + this.elDot.offsetTop + this.elDot.offsetHeight / 2 + 3);
    return this.pos;
  }

  public updatePortConnectStatusElement() {
    this.parent.updatePortConnectStatusElement(this);
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


  public update(source : BlockParameterPort) {
    this.paramValue = source.paramValue;
    this.parent.onParameterUpdate(this.parent, this);

    if(this.connectedPort != null) {
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