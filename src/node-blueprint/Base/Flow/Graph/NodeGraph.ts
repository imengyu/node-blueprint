import { SerializableObject } from "../../Utils/Serializable/SerializableObject";

/**
 * 节点端口
 */
export class NodeGraph extends SerializableObject<INodeGraphDefine> {

  constructor(define: INodeGraphDefine) {
    super('NodeGraph', define, false);
    this.serializableProperties = [ 'all' ];
    this.load(define);
  }

}

/**
 * 端口定义
 */
export interface INodeGraphDefine {
  //
}