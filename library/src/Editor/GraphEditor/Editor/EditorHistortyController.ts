import logger from "@/Common/Logger/Logger";
import { useNodeGraphEditorStaticConfig } from "../Config/ConfigManager";
import { printError } from "@/Common/Logger/DevLog";
import { EditorHistoryActionContext } from "./History/ActionContext";
import { genNonDuplicateIDHEX } from "@/Common/Random";
import { EventHandler } from "@/Common/Event/EventHandler";
import { EditorHistoryAction } from "./History/Action";
import { EditorHistoryStepStackManager } from "./History/StackManager";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import type { Vector2 } from "@/Common/Base/Vector2";
import { EditorHistoryShadowController, EditorHistoryShadowStep, type EditorHistoryLinkingContext } from "./History/Shadow";

const TAG = "NodeEditorHistoryController";

/**
 * 编辑器的历史记录控制器上下文函数
 */
export interface NodeEditorHistoryControllerContext {
  /**
   * 执行一个可撤销简单操作。等同于 `historyManager.runAction`
   * @param action 操作实例
   * @returns 返回操作返回值。
   */
  runAction: <T = any>(action: EditorHistoryAction<any, any, T>) => Promise<T>;
  /**
   * 历史记录控制器
   */
  historyManager: {
    stack: EditorHistoryStepStackManager,
    /**
     * 在当前上下文中创建一个链接的历史记录，链接至主操作的上下文。
     * 
     * 主要用于多个编辑器同时打开，并且一个操作影响到了另外一个编辑器的内容时使用。
     * 副编辑器会创建一条影子历史记录，链接至主操作，当用户在副编辑器中撤销或重做时，会返回到实际的主操作中执行，
     * 同样主操作撤销或重做时，副编辑器该条影子记录也会改变撤销或重做状态。
     * 
     * * linkingContext 用于链接两个操作，
     * 主要功能即：从副编辑器触发操作，将信息回传主操作，等同于主操作撤销重做。
     * 主操作撤销重做时，同步状态至副编辑器（更改栈状态)。
     * 
     * @param linkingContext 由主操作提供的连接上下文对象。
     * @param options 当前控制上下文的历史记录配置
     */
    runLinkingShadowAction: (
      linkingContext: EditorHistoryLinkingContext,
      options: {
        /**
         * 在当前控制上下文显示的名称。
         */
        name: string,
        /**
         * 是否是关键性操作，用于界面显示。
         */
        critical?: boolean,
        /**
         * 是否禁止在在当前控制上下文中执行撤销操作。
         */
        noUndoable?: boolean,
      },
    ) => void;
    /**
     * 执行一个可撤销简单操作
     * @param action 操作实例
     * @returns 返回操作中 actionContext.setDoingReturn 设置的返回值。
     */
    runAction: <T = any>(action: EditorHistoryAction<any, any, T>) => Promise<T>;
    /**
     * 开始一个禁止记录区间
     */
    beginNoUndoableRegion: () => void;
    /**
     * 停止一个禁止记录区间
     */
    endNoUndoableRegion: () => void;
    /**
     * 撤销一个步骤
     * @returns 返回当前是否存在步骤
     */
    undoStep: () => Promise<boolean>;
    /**
     * 重做一个步骤
     * @returns 返回当前是否存在步骤
     */
    redoStep: () => Promise<boolean>;
    /**
     * 清除历史记录
     * @returns 
     */
    clear: () => void;
  }
}

interface IEditorHistoryAction {
  name: string;
  _init(actionContext: EditorHistoryActionContext): void;
  getTargetParams(actionContext: EditorHistoryActionContext): any;
  onStepExecute(inputParams: any, isRedo: boolean, linkingContext: EditorHistoryLinkingContext): Promise<any>;
  onStepUndo(lastParams: any, inputParams: any): Promise<void>;
  onConfirmExecute(inputParams: any, isRedo: boolean): Promise<boolean>;
  onConfirmUndo(lastParams: any, inputParams: any): Promise<boolean>;
}

/**
 * 编辑器的历史记录步骤类，用于记录步骤信息
 */
export class EditorHistoryStep {
  constructor(
    action: EditorHistoryAction,
    context: NodeGraphEditorInternalContext,
    stack: EditorHistoryStepStackManager
  ) {
    this.id = genNonDuplicateIDHEX(16);
    this.action = action as unknown as IEditorHistoryAction;
    this.context = context;
    this.stack = stack;
    this.actionContext = new EditorHistoryActionContext(context);
    this.action._init(this.actionContext);
    this.linkingContext = this.createLinkingContext();
  }

  readonly id: string;
  /**
   * 步骤操作
   */
  action: IEditorHistoryAction;
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
      linkStepId: this.id,
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
    for (let index = this.childSteps.length - 1; index >= 0; index--) {
      await this.childSteps[index]._undoLoop(topStep);
      if (this.lastParams)
        await this.action.onStepUndo?.(this.lastParams, this.lastInput);
      this.state = 'restored';
    }
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

    await this._undo();

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

/**
 * 编辑器的历史记录控制器
 * @param options 
 * @returns 
 */
export function useEditorHistoryController(context: NodeGraphEditorInternalContext) {

  const { getStaticConfig } = useNodeGraphEditorStaticConfig();
  const MAX_HISTORY = getStaticConfig<number>("maxHistory");
  const stackManager = new EditorHistoryStepStackManager(context, MAX_HISTORY);

  context.historyManager = {
    stack: stackManager,
    async runAction(action) {
      const currentStep = new EditorHistoryStep(action, context, stackManager);
      const inputParams = currentStep.action.getTargetParams(currentStep.actionContext);
      if (currentStep.actionContext.isCanceled())
        return undefined;
      currentStep.lastInput = inputParams;

      return stackManager.pushStep(currentStep, async () => {
        await currentStep._execute(false);
        return true;
      }) as any;
    },
    runLinkingShadowAction(linkingContext, options) {
      const mainHistoryManager = linkingContext.linkContext.historyManager;
      const mainStep = mainHistoryManager.stack.historySteps.find(s => s.linkingContext.linkStepId === linkingContext.linkStepId);
      if (!mainStep)
        throw new Error(`Can not find main step by linkingContext: ${linkingContext.linkStepId}`);
      if (mainStep.shadowController)
        throw new Error(`Main step already has shadow controller: ${linkingContext.linkStepId} (${mainStep.name})`);

      const currentStep = new EditorHistoryShadowStep(options.name, context, stackManager, linkingContext);
      stackManager.pushStep(currentStep, async () => {
        return true;
      })
    },
    beginNoUndoableRegion() {
      stackManager.historyIsDisabled = true;
    },
    endNoUndoableRegion() {
      stackManager.historyIsDisabled = false;
    },
    async undoStep() {
      return stackManager.undoStep(async (step) => {
        await step._undo();
        return step.shadowController === undefined;
      });
    },
    async redoStep() {
      return stackManager.redoStep(async (step) => {
        await step._execute(true);
        return step.shadowController === undefined;
      });
    },
    async clear() {
      return stackManager.clearSteps();
    },
  };

  return {}
}