import logger from "@/Common/Logger/Logger";
import { useNodeGraphEditorStaticConfig } from "../Config/ConfigManager";
import { printError } from "@/Common/Logger/DevLog";
import { EditorHistoryActionContext } from "./History/ActionContext";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import type { Vector2 } from "@/Common/Base/Vector2";
import { genNonDuplicateIDHEX } from "@/Common/Random";
import { EventHandler } from "@/Common/Event/EventHandler";


/**
 * 主要负责编辑中的撤销与重做功能
 * 
 * 使用：
 *    context.historyManager.beginUndoableAction(
        "对齐选中节点", 
        (actionContext) => ({
          //返回操作目标数据，至正向、反向操作的info数据中。
        }),
        (info, actionContext) => {
          //正向操作（执行、重做）
          //传递数据至反向操作
          return restoreData;
        }, 
        (restoreData, info, actionContext) => {
          //反向操作（撤销）
        }
      );
 * 
 * 
 */

const TAG = "NodeEditorHistoryController";

/**
 * 编辑器的历史记录控制器上下文函数
 */
export interface NodeEditorHistoryControllerContext {
  /**
   * 历史记录控制器
   */
  historyManager: {
    stack: EditorHistoryStepStackManager,
    /**
     * 开始一个可撤销简单操作
     * @param name 操作名称，用于显示
     * @param getInputParams 获取输入参数，输入参数用于记录操作的主体，通常是与实例分开的数据，例如UID
     * @param stepExecute 正向执行函数，例如执行、重做，传入参数由 getInputParams 返回。返回一个参数用于反向执行函数，如果返回 undefined 或者 null，则不会执行反向执行函数。
     * @param stepUndo 反向执行函数，例如撤销，参数来源于第一次执行 stepExecute 返回。
     * @param confirmExecute 正向执行函数，可以弹窗用于向用户确认是否执行反向执行函数。返回 false 可以终止执行撤销操作。注：仅在非嵌套操作的顶层有效。
     * @param confirmUndo 反向执行函数的确认函数，可以弹窗用于向用户确认是否执行反向执行函数。返回 false 可以终止执行重做操作。注：仅在非嵌套操作的顶层有效。
     * @returns 返回 actionContext.setDoingReturn 设置的返回值
     */
    beginUndoableAction: <T, K>(
      name: string, 
      getTargetParams: (actionContext: EditorHistoryActionContext) => K,
      stepExecute: EditorHistoryStepExecuteFn<T, K>, 
      stepUndo?: EditorHistoryStepUndoFn<T, K>,
      confirmExecute?: EditorHistoryStepConfirmExecuteFn<K>,
      confirmUndo?: EditorHistoryStepConfirmUndoFn<T, K>,
    ) => Promise<any>;
    /**
     * 开始一个完整快照的可撤销操作
     * @returns 
     */
    // beginFullSnapshortUndoableAction: <T = void>(
    //   name: string, 
    //   doFn: (actionContext: EditorHistoryActionContext) => Promise<T>
    // ) => void;
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
     * @returns 
     */
    createLinkingShadowUndoableAction: (
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

type EditorHistoryStepExecuteFn<T, K> = (inputParams: K, actionContext: EditorHistoryActionContext, isRedo: boolean, linkingContext: EditorHistoryLinkingContext) => Promise<T>;
type EditorHistoryStepUndoFn<T, K> = (lastParams: NonNullable<T>, inputParams: K, actionContext: EditorHistoryActionContext) => void;
type EditorHistoryStepConfirmExecuteFn<K> = (inputParams: K, isRedo: boolean) => Promise<boolean>;
type EditorHistoryStepConfirmUndoFn<T, K> = (lastParams: T, inputParams: K) => Promise<boolean>;

interface EditorHistoryLinkingContext {
  linkStepId: string;
  linkStepCursor: number;
  linkContext: NodeEditorHistoryControllerContext;
}
interface EditorHistoryHooks {
  stepExecute: EditorHistoryStepExecuteFn<unknown, unknown>;
  stepUndo?: EditorHistoryStepUndoFn<unknown, unknown>;
  confirmExecute?: EditorHistoryStepConfirmExecuteFn<unknown>;
  confirmUndo?: EditorHistoryStepConfirmUndoFn<unknown, unknown>;
}

/**
 * 用于控制影子历史记录的封装类
 */
class EditorHistoryShadowController {
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
 * 用于管理历史记录栈
 */
class EditorHistoryStepStackManager {
  constructor(
    context: NodeGraphEditorInternalContext,
    maxStep: number
  ) {
    this.maxStep = maxStep;
    this.context = context;
    this.historySteps = context.holdData('historySteps', [] as EditorHistoryStep[]);
  }

  private context: NodeGraphEditorInternalContext;
  private maxStep: number;

  /**
   * 获取用户撤销历史记录
   * @returns 
   */
  historySteps: EditorHistoryStep[];
  historyIsDisabled = false;
  private historyCurrentStepGroupingStack : EditorHistoryStep[] = [];
  private historyIsRedoing = false;
  private historyCurrentCursor = 0;

  getCurrentCursor() {
    return this.historyCurrentCursor;
  }
  getCurrentStep() {
    return this.historySteps[this.historyCurrentCursor];
  }
  getStepById(id: string) {
    return this.historySteps.find(s => s.id === id);
  }
  getCurrentGroupingStep() {
    return this.historyCurrentStepGroupingStack[0];
  }
  pushGroupingStack(step: EditorHistoryStep) {
    this.historyCurrentStepGroupingStack.push(step);
  }
  popGroupingStack() {
    this.historyCurrentStepGroupingStack.pop();
  }
  async pushStep(currentStep: EditorHistoryStep, doStep: () => Promise<boolean>) {
    if (this.historyIsRedoing || this.historyIsDisabled)
      return undefined;
    //丢弃之后的步骤
    if (this.historyCurrentCursor < this.historySteps.length)
      this.historySteps.splice(this.historyCurrentCursor + 1);

    //处理嵌套调用情况下每个步骤的组织
    const historyCurrentStep = this.getCurrentGroupingStep();
    if (!historyCurrentStep) {
      this.pushGroupingStack(currentStep);

      //先执行步骤，然后存入数据
      if (!await doStep())
        return;

      this.historySteps.push(currentStep);
      this.popGroupingStack();

      //如果步骤数量超出上限，移除最早的记录
      if (this.historySteps.length > this.maxStep)
        this.historySteps.shift();
      this.historyCurrentCursor = this.historySteps.length;
    }
    else
    {
      this.pushGroupingStack(currentStep);

      currentStep.parent = historyCurrentStep;
      if (!await doStep())
        return;

      this.popGroupingStack();

      //嵌套子步骤的处理，直接放入上一级步骤中
      historyCurrentStep.childSteps.push(currentStep);
    }
    this.context.graphManager.markGraphChanged();
    return currentStep.actionContext.getExecuteReturn();
  }
  async undoStep(doStep: (step: EditorHistoryStep) => Promise<boolean>) {
    if (this.historyCurrentCursor > -1) {
      const newCursor = this.historyCurrentCursor - 1;
      this.historyIsRedoing = true;
      const step = this.historySteps[newCursor];
      if (await doStep(step)) {
        this.historyCurrentCursor = newCursor;
        this.context.graphManager.markGraphChanged();
      }
      this.historyIsRedoing = false;
      return true;
    }
    return false
  }
  async redoStep(doStep: (step: EditorHistoryStep) => Promise<boolean>) {
    if (this.historyCurrentCursor < this.historySteps.length) {
      const newCursor = this.historyCurrentCursor + 1;
      this.historyIsRedoing = true;
      const step = this.historySteps[newCursor];
      if (await doStep(step)) {
        this.historyCurrentCursor = newCursor;
        this.context.graphManager.markGraphChanged();
      }
      this.historyIsRedoing = false;
      return true;
    }
    return false
  }
  async clearSteps() {
    this.historyCurrentCursor = -1;
    this.historySteps.clear();
    this.historyCurrentStepGroupingStack.clear();
  }
  
  /**
   * 获取第一个撤销历史记录的名称，如果没有可撤销步骤，则返回空字符串。
   * @returns 
   */
  getFirstUndoStepName() {
    if (this.historySteps.length === 0 || this.historyCurrentCursor - 1 < 0 || this.historyCurrentCursor > this.historySteps.length)
      return '';
    else
      return this.historySteps[this.historyCurrentCursor - 1].name;
  }
  /**
   * 获取第一个重做历史记录的名称，如果没有可重做步骤，则返回空字符串。
   * @returns 
   */
  getFirstRedoStepName() {
    if (this.historySteps.length === 0 || this.historyCurrentCursor < 0 || this.historyCurrentCursor >= this.historySteps.length)
      return '';
    else
      return this.historySteps[this.historyCurrentCursor].name;
  }
}

/**
 * 编辑器的历史记录步骤类，用于记录步骤信息
 */
export class EditorHistoryStep {
  constructor(
    name: string,
    hooks: EditorHistoryHooks,
    context: NodeGraphEditorInternalContext,
    stack: EditorHistoryStepStackManager
  ) {
    this.id = genNonDuplicateIDHEX(16);
    this.name = name;
    this.hooks = hooks;
    this.context = context;
    this.stack = stack;
    this.actionContext = new EditorHistoryActionContext(context);
    this.linkingContext = this.createLinkingContext();
  }

  id: string;
  /**
   * 步骤名称
   */
  name: string;
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
    const result = await this.hooks.stepExecute(this.lastInput, this.actionContext, isRedo, topStep.linkingContext);
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
        await this.hooks.stepUndo?.(this.lastParams, this.lastInput, this.actionContext);
      this.state = 'restored';
    }
  }
  async _execute(isRedo: boolean) {
    if (this.parent)
      throw new Error(`Cannot call execute in child step.`);
    //可弹窗询问
    if (this.hooks.confirmExecute) {
      if (!(await this.hooks.confirmExecute(this.lastInput, isRedo)))
        return undefined;
    }
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
    if (this.hooks.confirmUndo) {
      if (!(await this.hooks.confirmUndo(this.lastParams, this.lastInput)))
        return;
    }
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
  hooks: EditorHistoryHooks;
  events = {
    onExecute: new EventHandler<(isRedo: boolean) => void>(),
    onUndo: new EventHandler(),
  };
}
/**
 * 用于副编辑器的影子步骤。
 */
class EditorHistoryShadowStep extends EditorHistoryStep {
  constructor(
    name: string, 
    context: NodeGraphEditorInternalContext, 
    stack: EditorHistoryStepStackManager,
    linkingContext: EditorHistoryLinkingContext
  ) {
    super(name, {} as any, context, stack);
    this.shadowController = new EditorHistoryShadowController(context, linkingContext);
    this.hooks = {
      stepExecute: async (i, a, isRedo) => {
        if (isRedo)
          this.shadowController?.redoFromShadow();
      },
      stepUndo: () => {
        this.shadowController?.undoFromShadow();
      },
    }
  }
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
    async beginUndoableAction(
      name, getTargetParams, 
      stepExecute, stepUndo, 
      confirmExecute, confirmUndo
    ) {
      //记录当前步骤
      const currentStep = new EditorHistoryStep(
        name, {
          stepExecute: stepExecute as EditorHistoryStepExecuteFn<unknown, unknown>, 
          stepUndo: stepUndo as EditorHistoryStepUndoFn<unknown, unknown>, 
          confirmExecute: confirmExecute as EditorHistoryStepConfirmExecuteFn<unknown>, 
          confirmUndo: confirmUndo as EditorHistoryStepConfirmUndoFn<unknown, unknown>, 
        }, context, stackManager
      );

      const inputParams = getTargetParams(currentStep.actionContext);
      if (currentStep.actionContext.isCanceled())
        return undefined;
      currentStep.lastInput = inputParams;

      return stackManager.pushStep(currentStep, async () => {
        await currentStep._execute(false);
        return true;
      });
    },
    createLinkingShadowUndoableAction(linkingContext, options) {
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