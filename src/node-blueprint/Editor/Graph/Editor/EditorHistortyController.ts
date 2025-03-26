import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import { useNodeGraphEditorStaticConfig } from "../Config/ConfigManager";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import type { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import { NodeConnectorEditor } from "./Flow/NodeConnectorEditor";
import type { NodePortEditor } from "./Flow/NodePortEditor";
import type { NodeEditor } from "./Flow/NodeEditor";
import { DevAssert } from "@/node-blueprint/Base/Logger/Assert";
import { SerializableObject } from "@/node-blueprint/Base/Serializable/SerializableObject";
import { printError } from "@/node-blueprint/Base/Logger/DevLog";
import logger from "@/node-blueprint/Base/Logger/Logger";
import { CreateObjectFactory } from "@/node-blueprint/Base/Serializable/SerializableFactory";
import RandomUtils from "@/node-blueprint/Base/Utils/RandomUtils";


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
     * @returns 返回 stepExecute 中的返回值
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
    beginFullSnapshortUndoableAction: <T = void>(
      name: string, 
      doFn: (actionContext: EditorHistoryActionContext) => Promise<T>
    ) => void;
    /**
     * 在当前上下文中创建一个链接的历史记录，链接至主操作的上下文。
     * 
     * 主要用于多个编辑器同时打开，并且一个操作影响到了另外一个编辑器的内容时使用。
     * 副编辑器会创建一条影子历史记录，链接至主操作，当用户在副编辑器中撤销或重做时，会返回到实际的主操作中执行，
     * 同样主操作撤销或重做时，副编辑器该条影子记录也会改变撤销或重做状态。
     * 
     * * linkingContext 用于链接两个操作,。
     * 
     * @param linkingContext 由主操作提供的连接上下文对象
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
type EditorHistoryStoreChangedPropertyFn<T, K> = (oldValue: K, instance: T) => K;

interface EditorHistoryLinkingContext {
  linkStepId: string;
  linkContext: NodeEditorHistoryControllerContext;
}
interface EditorHistoryHooks {
  stepExecute: EditorHistoryStepExecuteFn<unknown, unknown>;
  stepUndo?: EditorHistoryStepUndoFn<unknown, unknown>;
  confirmExecute?: EditorHistoryStepConfirmExecuteFn<unknown>;
  confirmUndo?: EditorHistoryStepConfirmUndoFn<unknown, unknown>;
}

/**
 * 用于管理可撤销操作中的目标对象。
 * 
 * 本类用于暂时保存一些操作对象，例如节点，端口，连接线，
 * 并使用与实例无关的信息例如UID进行保存，以实现在撤销与恢复等步骤中
 * 可以引用到正确的实例。
 */
export class EditorHistoryInfoStorager<T = any> {
  public constructor(context: NodeGraphEditorInternalContext) {
    this.context = context;
  }

  protected readonly context: NodeGraphEditorInternalContext;
  protected storedChangedProperties = new Map<string, {
    value: unknown,
    needSerialize: boolean,
    serializeObjectName: string,
  }>();
  protected requestInstanceInternal : (() => T|null)|undefined;
  private lastInstance : T|undefined;

  /**
   * 尝试获取当前信息所对应的实体。当无法获取实体时，将抛出异常。
   * @returns 
   */
  requestInstance() : T {
    const instance = this.requestInstanceInternal?.();
    DevAssert(instance, `Failed to get node instance`);
    this.lastInstance = instance as T;
    return instance as T;
  }
  /**
   * 存储当前管理目标对象的一个属性修改
   * @param name 属性名称。
   * @param newValue 新值，可以是值或者是回调函数。回调函数允许获取旧值与当前实例。
   * @param valueSerializeScheme 用于对象值序列化时使用的预设。
   */
  storeChangedProperty<K>(
    name: string, 
    newValueOrCallbackFun: EditorHistoryStoreChangedPropertyFn<T, K>|K, 
    valueSerializeScheme?: string
  ) {
    const instance = this.requestInstance() as any;
    const oldValue = instance[name];
    const storeData = {
      value: null,
      needSerialize: false,
      serializeObjectName: '',
    };


    let finalNewValue;
    if (typeof newValueOrCallbackFun === 'function')
      finalNewValue = (newValueOrCallbackFun as EditorHistoryStoreChangedPropertyFn<T, K>)(oldValue as K, instance);
    else
      finalNewValue = newValueOrCallbackFun;

    //对象类型的需要序列化
    if (typeof oldValue === 'object' && oldValue instanceof SerializableObject) {
      storeData.needSerialize = true;
      storeData.value = oldValue.save(valueSerializeScheme);
      storeData.serializeObjectName = oldValue.serializeClassName;
    }

    this.storedChangedProperties.set(name, storeData);
    instance[name] = finalNewValue;
    return this;
  }
  /**
   * 更改后回调
   * @param cb 
   * @returns 
   */
  afterChanged(cb: (instance: T) => void) {
    if (!this.lastInstance)
      throw new Error(`lastInstance missing!`);
    cb(this.lastInstance);
    return this;
  }
  /**
   * 恢复当前管理目标对象的一个属性修改
   * @param name 属性名称
   */
  restoreChangedProperty(name: string) {
    const instance = this.requestInstance() as any;
    DevAssert(this.storedChangedProperties.has(name), `ChangedProperty does not contains ${name}.`)

    const storeData = this.storedChangedProperties.get(name);
    if (!storeData)
      throw new Error();

    //反序列化对象
    if (storeData.needSerialize) {
      storeData.value = CreateObjectFactory.createSerializableObject(
        storeData.serializeObjectName, 
        null, 
        storeData.value
      );
    }

    instance[name] = storeData.value;
    return this;
  }
  /**
   * 恢复当前管理目标对象的全部属性修改
   */
  restoreAllChangedProperty() {
    for (const element of this.storedChangedProperties) 
      this.restoreChangedProperty(element[0]);
  }
}
export class EditorHistoryNodeInfo extends EditorHistoryInfoStorager<NodeEditor> {
  private uid: string;
  constructor(context: NodeGraphEditorInternalContext, node: NodeEditor) {
    super(context);
    this.uid = node.uid;
    this.requestInstanceInternal = () => this.context.graphManager.getNodeByUid(this.uid);
  }
}
export class EditorHistoryNodePortInfo extends EditorHistoryInfoStorager<NodePortEditor> {
  private nodeUid: string;
  private portUid: string;
  constructor(context: NodeGraphEditorInternalContext, node: NodePortEditor) {
    super(context);
    this.nodeUid = node.parent.uid;
    this.portUid = node.guid;
    this.requestInstanceInternal = () => this.context.graphManager.getNodePortByUid(this.nodeUid, this.portUid);
  }
}
export class EditorHistoryNodeConnectorInfo extends EditorHistoryInfoStorager<NodeConnectorEditor> {
  private uid: string;
  constructor(context: NodeGraphEditorInternalContext, node: NodeConnectorEditor) {
    super(context);
    this.uid = node.uid;
    this.requestInstanceInternal = () => this.context.graphManager.getConnectorByUid(this.uid);
  }
}

/**
 * 用于可恢复操作的上下文
 */
export class EditorHistoryActionContext {
  private cancel = false;
  private disableException = false;
  private returnData : unknown = null;
  private readonly context: NodeGraphEditorInternalContext;

  public constructor(context: NodeGraphEditorInternalContext) {
    this.context = context;
  }

  /**
   * 获取当前操作是否禁用异常捕获。否则将直接抛出异常至调用方
   */
  isDisableException() {
    return this.disableException;
  }
  /**
   * 获取当前操作在 getTargetParams 阶段是否被取消.
   */
  isCanceled() {
    return this.cancel;
  }
  /**
   * 标志当前操作在 getTargetParams 阶段取消，后续的执行操作不会继续。
   */
  cancelAction() {
    this.cancel = true;;
  }
  /**
   * 设置当前操作禁用异常捕获
   */
  setDisableException() {
    this.disableException = true;;
  }

  setDoingReturn(returnData: unknown) {
    this.returnData = returnData;
  }
  getExecuteReturn() {
    return this.returnData
  }

  /**
   * 对 `context.historyManager.beginNoUndoableRegion()` 的封装。可传入回调也可单独与 `endNoUndoableRegion` 成对使用。
   * @param cb 不传入回调时，与 `endNoUndoableRegion` 成对使用。传入回调时，回调中自动调用区间。
   */
  beginNoUndoableRegion(cb?: () => void) {
    if (cb) {
      this.context.historyManager.beginNoUndoableRegion();
      cb();
      this.context.historyManager.endNoUndoableRegion();
    } else
      this.context.historyManager.beginNoUndoableRegion();
  }
  endNoUndoableRegion() {
    this.context.historyManager.endNoUndoableRegion();
  }

  /**
   * 转换 节点实例 为独立的信息，用于可撤销操作之间的数据传输。
   */
  toNodeInfo(node: NodeEditor) { return new EditorHistoryNodeInfo(this.context, node); }
  /**
   * 转换 连接线实例 为独立的信息，用于可撤销操作之间的数据传输。
   */
  toNodeConnectorInfo(connectior: NodeConnectorEditor) { return new EditorHistoryNodeConnectorInfo(this.context, connectior); }
  /**
   * 转换 节点端口实例 为独立的信息，用于可撤销操作之间的数据传输。
   */
  toNodePortInfo(port: NodePortEditor) { return new EditorHistoryNodePortInfo(this.context, port); }
  
  /**
   * 转换 节点实例数组 为独立的信息，用于可撤销操作之间的数据传输。如果输入数组为空，则自动取消当前操作。
   */
  toNodesInfoAndCancelIfEmpty(nodes: NodeEditor[]) { return nodes.map(n => new EditorHistoryNodeInfo(this.context, n)); }
  /**
   * 转换 节点端口数组实例 为独立的信息，用于可撤销操作之间的数据传输。如果输入数组为空，则自动取消当前操作。
   */
  toNodePortsInfoAndCancelIfEmpty(ports: NodePortEditor[]) { return ports.map(n => new EditorHistoryNodePortInfo(this.context, n)); }
  /**
   * 转换 连接线实例数组 为独立的信息，用于可撤销操作之间的数据传输。如果输入数组为空，则自动取消当前操作。
   */
  toNodeConnectorsInfoAndCancelIfEmpty(connectiors: NodeConnectorEditor[]) { return connectiors.map(n => new EditorHistoryNodeConnectorInfo(this.context, n)); }

  fromNodesInfo(info: EditorHistoryNodeInfo[]) { return info.map(i => i.requestInstance()) as NodeEditor[]; }
  fromNodePortsInfo(info: EditorHistoryNodePortInfo[]) { return info.map(i => i.requestInstance()) as NodePortEditor[]; }
  fromNodeConnectorsInfo(info: EditorHistoryNodeConnectorInfo[]) { return info.map(i => i.requestInstance()) as NodeConnectorEditor[]; }
}

class EditorHistoryShadowController {

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
    const historyCurrentStep = this.historyCurrentStepGroupingStack[0];
    if (!historyCurrentStep) {
      //先执行步骤，然后存入数据
      if (!await doStep())
        return;

      this.historySteps.push(currentStep);
      this.historyCurrentStepGroupingStack.pop();

      //如果步骤数量超出上限，移除最早的记录
      if (this.historySteps.length > this.maxStep)
        this.historySteps.shift();
      this.historyCurrentCursor = this.historySteps.length;
    }
    else
    {
      currentStep.parent = historyCurrentStep;
      if (!await doStep())
        return;

      //嵌套子步骤的处理，直接放入上一级步骤中
      historyCurrentStep.childSteps.push(currentStep);
    }
    this.context.graphManager.markGraphChanged();
    return currentStep.actionContext.getExecuteReturn();
  }
  async undoStep(doStep: (step: EditorHistoryStep) => Promise<void>) {
    if (this.historyCurrentCursor > -1) {
      this.historyCurrentCursor--;
      this.historyIsRedoing = true;
      const step = this.historySteps[this.historyCurrentCursor];
      await doStep(step);
      this.historyIsRedoing = false;
      //标记文档已更改
      this.context.graphManager.markGraphChanged();
      return true;
    }
    return false
  }
  async redoStep(doStep: (step: EditorHistoryStep) => Promise<void>) {
    if (this.historyCurrentCursor < this.historySteps.length) {
      this.historyCurrentCursor++;
      this.historyIsRedoing = true;
      const step = this.historySteps[this.historyCurrentCursor];
      await doStep(step);
      this.historyIsRedoing = false;
      //标记文档已更改
      this.context.graphManager.markGraphChanged();
      return true;
    }
    return false
  }
  async clearSteps() {
    this.historyCurrentCursor = -1;
    ArrayUtils.clear(this.historySteps);
    ArrayUtils.clear(this.historyCurrentStepGroupingStack);
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
    this.id = RandomUtils.genNonDuplicateIDHEX(16);
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

    },
    /**
     * 完整快照操作.
     * 首先对当前图表记录
     */
    beginFullSnapshortUndoableAction(name, stepExecute) {
      //TODO: 完整快照历史记录
      return undefined;
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
      });
    },
    async redoStep() {
      return stackManager.redoStep(async (step) => {
        await step._execute(true);
      });
    },
    async clear() {
      return stackManager.clearSteps();
    },
  };

  return {}
}