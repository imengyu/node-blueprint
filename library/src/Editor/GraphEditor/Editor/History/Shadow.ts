import type { NodeGraphEditorInternalContext } from "../../NodeGraphEditor";
import { EditorHistoryStep, type NodeEditorHistoryControllerContext } from "../EditorHistortyController";
import { EditorHistoryAction } from "./Action";
import type { EditorHistoryActionContext } from "./ActionContext";
import type { EditorHistoryStepStackManager } from "./StackManager";

export interface EditorHistoryLinkingContext {
  linkStepId: string;
  linkStepCursor: number;
  linkContext: NodeEditorHistoryControllerContext;
}

/**
 * 用于控制影子历史记录的封装类
 */
export class EditorHistoryShadowController {
  constructor(context: NodeGraphEditorInternalContext, linkingContext: EditorHistoryLinkingContext) {
    this.linkingContext = linkingContext;
    this.context = context;
    this.initMainStepHooks();
  }

  private linkingContext: EditorHistoryLinkingContext;
  private context: NodeGraphEditorInternalContext;

  private initMainStepHooks() {
    const step = this.linkingContext.linkContext.historyManager.stack.getStepById(this.linkingContext.linkStepId);
    step?.events.onExecute.addListener(undefined, () => {
      this.context.historyManager.stack.redoStep(async () => true);
    });
    step?.events.onUndo.addListener(undefined, () => {
      this.context.historyManager.stack.undoStep(async () => true);
    });
  }
  private getMainHistoryManagerAndCursorCheck() {
    const mainHistoryManager = this.linkingContext.linkContext.historyManager;
    if (mainHistoryManager.stack.getCurrentCursor() !== this.linkingContext.linkStepCursor)
      throw new Error("undoFromShadow: mainHistoryManager stack cursor not match");
    return mainHistoryManager;
  }

  undoFromShadow() {
    this.getMainHistoryManagerAndCursorCheck().undoStep();
  }
  redoFromShadow() {
    this.getMainHistoryManagerAndCursorCheck().redoStep();
  }
}
/**
 * 用于副编辑器的影子操作。
 */
class EditorHistoryShadowAction extends EditorHistoryAction {
  constructor(
    name: string,
    shadowController: EditorHistoryShadowController,
  ) {
    super(name);
    this.shadowController = shadowController;
  }

  private shadowController: EditorHistoryShadowController;

  override async onStepExecute(inputParams: any, actionContext: EditorHistoryActionContext, isRedo: boolean, linkingContext: EditorHistoryLinkingContext): Promise<any> {    
    if (isRedo)
      this.shadowController?.redoFromShadow();
    return undefined;
  }
  override async onStepUndo(lastParams: any, inputParams: any, actionContext: EditorHistoryActionContext) {
    if (this.shadowController)
      this.shadowController.undoFromShadow();
  }
}
/**
 * 用于副编辑器的影子步骤。
 */
export class EditorHistoryShadowStep extends EditorHistoryStep {
  constructor(
    name: string, 
    context: NodeGraphEditorInternalContext, 
    stack: EditorHistoryStepStackManager,
    linkingContext: EditorHistoryLinkingContext
  ) {
    super({} as any, context, stack);
    this.shadowController = new EditorHistoryShadowController(context, linkingContext);
    this.action = new EditorHistoryShadowAction('Shadow', this.shadowController);
  }
}
