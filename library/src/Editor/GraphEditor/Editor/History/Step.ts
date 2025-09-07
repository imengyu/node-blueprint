import logger from "@/Common/Logger/Logger";
import { printError } from "@/Common/Logger/DevLog";
import { genNonDuplicateIDHEX } from "@/Common/Random";
import { EventHandler } from "@/Common/Event/EventHandler";
import { EditorHistoryActionContext } from "./ActionContext";
import type { EditorHistoryAction } from "./Action";
import type { NodeGraphEditorInternalContext } from "../../NodeGraphEditor";
import type { EditorHistoryStepStackManager } from "./StackManager";
import type { EditorHistoryLinkingContext, EditorHistoryShadowController } from "./Shadow";
import type { Vector2 } from "@/Common/Base/Vector2";

interface IEditorHistoryAction {
  name: string;
  _init(actionContext: EditorHistoryActionContext): void;
  getTargetParams(actionContext: EditorHistoryActionContext): any;
  onStepExecute(inputParams: any, isRedo: boolean, linkingContext: EditorHistoryLinkingContext): Promise<any>;
  onStepUndo(lastParams: any, inputParams: any): Promise<void>;
  onConfirmExecute(inputParams: any, isRedo: boolean): Promise<boolean>;
  onConfirmUndo(lastParams: any, inputParams: any): Promise<boolean>;
}

const TAG = "NodeEditorHistoryStep";

/**
 * 编辑器的历史记录步骤类，用于记录步骤信息
 */
export class EditorHistoryStep {
  constructor(
    action: EditorHistoryAction,
    context: NodeGraphEditorInternalContext,
    stack: EditorHistoryStepStackManager
  ) {
    this.key = genNonDuplicateIDHEX(16);
    this.id = this.key;
    this._action = action;
    this.context = context;
    this.stack = stack;
    this.actionContext = new EditorHistoryActionContext(context);
    this.action._init(this.actionContext);
    this.linkingContext = this.createLinkingContext();
  }

  readonly key: string;
  readonly id: string;
  protected _action: EditorHistoryAction;

  /**
   * 步骤操作
   */
  get action(): IEditorHistoryAction { return this._action as unknown as IEditorHistoryAction; };
  /**
   * 步骤名称
   */
  get name() { return this.action.name; };
  /**
   * 步骤状态
   * - not-use: 未使用
   * - done: 已完成。第一次执行，未撤销
   * - restored: 已撤销
   * - redone: 已重做
   */
  state: 'not-use'|'done'|'restored'|'redone' = 'not-use';

  private context: NodeGraphEditorInternalContext;
  private stack: EditorHistoryStepStackManager;

  private createLinkingContext() : EditorHistoryLinkingContext {
    return {
      linkStepCursor: this.context.historyManager.stack.getCurrentCursor() + 1,
      linkStepId: this.key,
      linkContext: this.context,
    }
  }

  private async _executeLoop(topStep: EditorHistoryStep, isRedo: boolean) {
    //递归重做子步骤
    const result = await this.action.onStepExecute(this.lastInput, isRedo, topStep.linkingContext);
    this.state = isRedo ? 'redone' : 'done';
    for (const childStep of this.childSteps)
      await childStep._executeLoop(topStep, isRedo);
    return result;
  }
  private async _undoLoop(topStep: EditorHistoryStep) {
    //递归还原子步骤
    for (let index = this.childSteps.length - 1; index >= 0; index--) 
      await this.childSteps[index]._undoLoop(topStep);
    if (this.lastParams)
      await this.action.onStepUndo?.(this.lastParams, this.lastInput);
    this.state = 'restored';
  }
  async _execute(isRedo: boolean) {
    if (this.parent)
      throw new Error(`Cannot call execute in child step.`);
    if (!(await this.action.onConfirmExecute(this.lastInput, isRedo)))
      return undefined;
    try {
      this.stack.pushGroupingStack(this);
      this.lastParams = await this._executeLoop(this, isRedo);
      this.events.onExecute.invoke(isRedo);
    } catch (e) {
      //发生异常时，将放弃当前操作和回滚
      //回滚当前步骤的所有子步骤
      await this._undo();
      //抛出异常
      const errorMessage = `UndoableAction exception: ${logger.formatError(e)}`;
      if (this.actionContext.isDisableException()) {
        printError(TAG, null, errorMessage);
        return undefined;
      } else {
        throw new Error(errorMessage);
      }
    } finally {
      this.stack.popGroupingStack();
    }
  }
  async _undo() {
    if (this.parent)
      throw new Error(`Cannot call undo in child step.`);
    //可弹窗询问
    if (!(await this.action.onConfirmUndo(this.lastParams, this.lastInput)))
      return;
    //跳转到发生事件时的位置
    if (this.currentPosition)
      this.context.viewPortManager.moveViewportToPosition(this.currentPosition);

    await this._undoLoop(this);

    this.events.onUndo.invoke();
  }
  _addChild(child: EditorHistoryStep) {
    this.childSteps.push(child);
    child.parent = this;
  }


  lastInput: unknown = undefined;
  lastParams: unknown = undefined;
  childSteps : EditorHistoryStep[] = [];
  currentPosition?: Vector2;
  actionContext: EditorHistoryActionContext;
  linkingContext: EditorHistoryLinkingContext;
  shadowController?: EditorHistoryShadowController;
  parent: EditorHistoryStep|null = null;
  events = {
    onExecute: new EventHandler<(isRedo: boolean) => void>(),
    onUndo: new EventHandler(),
  };
}