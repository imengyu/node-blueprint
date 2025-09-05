import { EditorHistoryAction } from "../History/Action";
import { DeleteSelectedConnectorsAction } from "./DeleteSelectedConnectorsAction";
import { DeleteSelectedNodesAction } from "./DeleteSelectedNodesAction";

export class DeleteAction extends EditorHistoryAction<void, void, void> {
  constructor() {
    super("删除");
  }
  override async onStepExecute() { 
    if(this.context.keyboardManager.isKeyAltDown())
      await this.context.historyManager.runAction(new DeleteSelectedConnectorsAction());
    else 
      await this.context.historyManager.runAction(new DeleteSelectedNodesAction());
  }
}