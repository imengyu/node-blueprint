import { NodeDocunment, type INodeDocunmentDefine } from "@/node-blueprint/Base/Flow/Graph/NodeDocunment";

export class NodeDocunmentEditor extends NodeDocunment {
  constructor(define?: INodeDocunmentDefine) {
    super(define, true);
  }
}