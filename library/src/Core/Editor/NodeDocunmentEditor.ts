import { NodeDocunment, type INodeDocunmentDefine } from "../Graph/NodeDocunment";

export class NodeDocunmentEditor extends NodeDocunment {
  constructor(define?: INodeDocunmentDefine) {
    super(define, true);
  }
}