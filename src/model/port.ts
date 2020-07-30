import CommonUtils from "../utils/CommonUtils";
import { Block } from "./block";

/**
 * 节点端口
 */
export class BlockPort {

  public name = "";
  public description = "This is a block port. Useage: unknow.";
  public uid = "0";

  public constructor(block : Block) {
    this.uid = this.uid + '_' + CommonUtils.genNonDuplicateID(3);
    this.parent = block;
  }

  public connectedPort : BlockPort = null;
  public parent : Block = null;
  public type : BlockPortType = null;
  public direction : BlockPortDirection = null;
  public el : HTMLDivElement = null;
  public elDot : HTMLElement = null;
  public elSpan : HTMLSpanElement = null;
}

export type BlockPortType = 'Behavior'|'Parameter';
export type BlockPortDirection = 'input'|'output';
export type BlockParameteType = 'number'|'string'|'boolean'|'function'|'object'|'any'|'type';

/**
 * 行为节点端口
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
 * 参数节点端口
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

}