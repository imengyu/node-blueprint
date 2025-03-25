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
    /**
     * 开始一个可撤销简单操作
     * @param name 操作名称，用于显示
     * @param getInputParams 获取输入参数，输入参数用于记录操作的主体，通常是与实例分开的数据，例如UID
     * @param doingFn 正向执行函数，例如执行、重做，传入参数由 getInputParams 返回。返回一个参数用于反向执行函数，如果返回 undefined 或者 null，则不会执行反向执行函数。
     * @param restoreFn 反向执行函数，例如撤销，参数来源于第一次执行 doingFn 返回。
     * @param doingConfirm 正向执行函数，可以弹窗用于向用户确认是否执行反向执行函数。返回 false 可以终止执行撤销操作。注：仅在非嵌套操作的顶层有效。
     * @param restoreConfirm 反向执行函数的确认函数，可以弹窗用于向用户确认是否执行反向执行函数。返回 false 可以终止执行重做操作。注：仅在非嵌套操作的顶层有效。
     * @returns 返回 doingFn 中的返回值
     */
    beginUndoableAction: <T, K>(
      name: string, 
      getTargetParams: (actionContext: EditorHistoryActionContext) => K,
      doingFn: EditorHistoryStepDoingFn<Promise<T>, K>, 
      restoreFn?: EditorHistoryStepRestoreFn<T, K>,
      doingConfirm?: EditorHistoryStepDoingConfirmFn<K>,
      restoreConfirm?: EditorHistoryStepRestoreConfirmFn<T, K>,
    ) => Promise<any>;
    /**
     * 开始一个完整快照的可撤销操作
     * @returns 
     */
    beginFullSnapshortUndoableAction: <T = void>(
      name: string, 
      doFn: (actionContext: EditorHistoryActionContext) => Promise<T>
    ) => void;
    
    // createLinkingShadowUndoableAction: (

    // ) => void;
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
    /**
     * 获取用户撤销历史记录
     * @returns 
     */
    getHistoryList: () => EditorHistoryStep[];
    /**
     * 获取第一个撤销历史记录的名称，如果没有可撤销步骤，则返回空字符串。
     * @returns 
     */
    getFirstUndoStepName: () => string;
    /**
     * 获取第一个重做历史记录的名称，如果没有可重做步骤，则返回空字符串。
     * @returns 
     */
    getFirstRedoStepName: () => string;
  }
}

type EditorHistoryStepDoingFn<T, K> = (inputParams: K, actionContext: EditorHistoryActionContext, first: boolean) => T;
type EditorHistoryStepRestoreFn<T, K> = (lastParams: NonNullable<T>, inputParams: K, actionContext: EditorHistoryActionContext) => void;
type EditorHistoryStepDoingConfirmFn<K> = (inputParams: K, first: boolean) => Promise<boolean>;
type EditorHistoryStepRestoreConfirmFn<T, K> = (lastParams: T, inputParams: K) => Promise<boolean>;
type EditorHistoryStoreChangedPropertyFn<T, K> = (oldValue: K, instance: T) => K;

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
  getDoingReturn() {
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

export interface EditorHistoryStep {
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
  state: 'not-use'|'done'|'restored'|'redone';
  lastInput: unknown;
  lastParams: unknown;
  childSteps : EditorHistoryStep[],
  currentPosition?: Vector2,
  actionContext: EditorHistoryActionContext,
  parent: EditorHistoryStep|null,
  doingFn: EditorHistoryStepDoingFn<unknown, unknown>;
  restoreFn?: EditorHistoryStepRestoreFn<unknown, unknown>;
  doingConfirm?: EditorHistoryStepDoingConfirmFn<unknown>;
  restoreConfirm?: EditorHistoryStepRestoreConfirmFn<unknown, unknown>;
}

/**
 * 编辑器的历史记录控制器
 * @param options 
 * @returns 
 */
export function useEditorHistoryController(context: NodeGraphEditorInternalContext) {

  const { getStaticConfig } = useNodeGraphEditorStaticConfig();

  const MAX_HISTORY = getStaticConfig<number>("maxHistory");
  const historySteps = context.holdData('historySteps', [] as EditorHistoryStep[]);
  const historyCurrentStepGroupingStack : EditorHistoryStep[] = [];
  let historyIsDisabled = false;
  let historyIsRedoing = false;
  let historyCurrentCursor = 0;

  /**
   * 发生异常时，回滚操作
   */
  function handleUndoableActionExecptionAndRollback(e: unknown, actionContext: EditorHistoryActionContext, step: EditorHistoryStep) {
    //回滚当前步骤的所有子步骤
    uodoStepChilds(step);

    //抛出异常
    const errorMessage = `UndoableAction first do failed because exception: ${logger.formatError(e)}`;
    if (actionContext.isDisableException()) {
      printError(TAG, null, errorMessage);
      return undefined;
    } else {
      throw new Error(errorMessage);
    }
  }
  function handleFullUndoableActionRollback(actionContext: EditorHistoryActionContext, data: unknown, e?: unknown) {

  }
  function uodoStepChilds(step: EditorHistoryStep) {
    //还原子步骤
    for (let index = step.childSteps.length - 1; index >= 0; index--) {
      const childStep = step.childSteps[index];
      if (childStep.lastParams)
        childStep.restoreFn?.(childStep.lastParams, childStep.lastInput, childStep.actionContext);
      step.state = 'restored';
      if (childStep.childSteps.length > 0)
        uodoStepChilds(step);
    }
  }
  function redoStepChilds(step: EditorHistoryStep) {
    //重做子步骤
    for (const childStep of step.childSteps) {
      childStep.doingFn(childStep.lastInput, childStep.actionContext, false);
      step.state = 'redone';
      if (childStep.childSteps.length > 0)
        redoStepChilds(step);
    }
  }
 
  context.historyManager = {
    
    async beginUndoableAction(
      name, getTargetParams, 
      doingFn, restoreFn, 
      doingConfirm, restoreConfirm
    ) {
      if (historyIsRedoing || historyIsDisabled)
        return undefined;
      //丢弃之后的步骤
      if (historyCurrentCursor < historySteps.length)
        historySteps.splice(historyCurrentCursor + 1);

      //创建一个用于帮助的上下文对象
      const actionContext = new EditorHistoryActionContext(context);
      const inputParams = getTargetParams(actionContext);
      if (actionContext.isCanceled())
        return undefined;

      //记录当前步骤
      const currentStep : EditorHistoryStep = { 
        name, 
        doingFn: doingFn as EditorHistoryStepDoingFn<unknown, unknown>, 
        restoreFn: restoreFn as EditorHistoryStepRestoreFn<unknown, unknown>, 
        doingConfirm: doingConfirm as EditorHistoryStepDoingConfirmFn<unknown>, 
        restoreConfirm: restoreConfirm as EditorHistoryStepRestoreConfirmFn<unknown, unknown>, 
        childSteps: [], 
        state: 'not-use',
        lastParams: null,
        lastInput: inputParams,
        actionContext,
        parent: null,
        currentPosition: context.viewPortManager.getViewPort().position.clone(), //记录视口信息
      };

      //处理嵌套调用情况下每个步骤的组织
      const historyCurrentStep = historyCurrentStepGroupingStack[0];
      if (!historyCurrentStep) {

        //可弹窗询问
        if (doingConfirm) {
          if (!(await doingConfirm(inputParams, true)))
            return undefined;
        }
        //先执行步骤，然后存入数据
        try {
          historyCurrentStepGroupingStack.push(currentStep);
          currentStep.parent = historyCurrentStep;
          currentStep.lastParams = doingFn(inputParams, currentStep.actionContext, true);
          currentStep.state = 'done';
        } catch (e) {
          //发生异常时，将放弃当前操作和回滚
          handleUndoableActionExecptionAndRollback(e, actionContext, currentStep);
          return undefined;
        } finally {
          historyCurrentStepGroupingStack.pop();
        }
        historySteps.push(currentStep);
        historyCurrentStepGroupingStack.pop();

        //如果步骤数量超出上限，移除最早的记录
        if (historySteps.length > MAX_HISTORY)
          historySteps.shift();
        historyCurrentCursor = historySteps.length;
      }
      else
      {
        try {
          historyCurrentStepGroupingStack.push(currentStep);
          currentStep.lastParams = doingFn(inputParams, currentStep.actionContext, true);
          currentStep.state = 'done';
        } catch (e) {
          //发生异常时，将放弃当前操作和回滚
          handleUndoableActionExecptionAndRollback(e, actionContext, currentStep);
          return undefined;
        } finally {
          historyCurrentStepGroupingStack.pop();
        }
        //嵌套子步骤的处理，直接放入上一级步骤中
        historyCurrentStep.childSteps.push(currentStep);
      }
      context.graphManager.markGraphChanged();

      return actionContext.getDoingReturn();
    },
    /**
     * 完整快照操作.
     * 首先对当前图表记录
     */
    beginFullSnapshortUndoableAction(name, doingFn) {
      //TODO: add
      if (historyIsRedoing || historyIsDisabled)
        return;
      const historyCurrentStep = historyCurrentStepGroupingStack[0];
      if (historyCurrentStep === null)
        throw new Error("Can not nesting UndoableActio with full SnapshotUndoableAction");

      const actionContext = new EditorHistoryActionContext(context);
      //记录当前步骤
      const currentStep : EditorHistoryStep = { 
        name, 
        doingFn: (i, a) => {

        }, 
        restoreFn: (r, i, a) => {
          handleFullUndoableActionRollback(a, i);
        }, 
        doingConfirm: undefined,
        restoreConfirm: undefined,
        state: 'not-use',
        childSteps: [], 
        lastParams: null,
        lastInput: null,
        parent: null,
        actionContext,
        currentPosition: context.viewPortManager.getViewPort().position.clone(), //记录视口信息
      };

      //先执行步骤，然后存入数据
      try {
        historyCurrentStepGroupingStack.push(currentStep);
        this.beginNoUndoableRegion();
        doingFn(actionContext);
        this.endNoUndoableRegion();
      } catch (e) {
        //发生异常时，将放弃当前操作和回滚
        handleFullUndoableActionRollback(actionContext, currentStep.lastInput, e);
        return undefined;
      } finally {
        historyCurrentStepGroupingStack.pop();
      }

      if (actionContext.isCanceled())
        return undefined;

      historySteps.push(currentStep);
      historyCurrentStepGroupingStack.pop();

      //如果步骤数量超出上限，移除最早的记录
      if (historySteps.length > MAX_HISTORY)
        historySteps.shift();
      historyCurrentCursor = historySteps.length;

      return actionContext.getDoingReturn();
    },
    beginNoUndoableRegion() {
      historyIsDisabled = true;
    },
    endNoUndoableRegion() {
      historyIsDisabled = false;
    },
    getHistoryList() {
      return historySteps;
    },
    getFirstUndoStepName() {
      if (historySteps.length === 0 || historyCurrentCursor - 1 < 0 || historyCurrentCursor > historySteps.length)
        return '';
      else
        return historySteps[historyCurrentCursor - 1].name;
    },
    getFirstRedoStepName() {
      if (historySteps.length === 0 || historyCurrentCursor < 0 || historyCurrentCursor >= historySteps.length)
        return '';
      else
        return historySteps[historyCurrentCursor].name;
    },
    async undoStep() {
      if (historyCurrentCursor > -1) {
        historyCurrentCursor--;
        historyIsRedoing = true;
        const step = historySteps[historyCurrentCursor];
        //跳转到发生事件时的位置
        if (step.currentPosition)
          context.viewPortManager.moveViewportToPosition(step.currentPosition);
        //询问是否还原
        if (step.restoreConfirm) {
          if (!(await step.restoreConfirm(step.lastParams, step.lastInput)))
            return false;
        }
        //还原主步骤
        if (step.lastParams)
          step.restoreFn?.(step.lastParams, step.lastInput, step.actionContext);
        step.state = 'restored';
        //还原子步骤
        uodoStepChilds(step);
        historyIsRedoing = false;
        //标记文档已更改
        context.graphManager.markGraphChanged();
        return true;
      }
      return false
    },
    async redoStep() {
      if (historyCurrentCursor < historySteps.length) {
        historyCurrentCursor++;
        historyIsRedoing = true;
        const step = historySteps[historyCurrentCursor];
        //询问是否还原
        if (step.doingConfirm) {
          if (!(await step.doingConfirm(step.lastInput, false)))
            return false;
        }
        //重做子步骤和主步骤
        step.doingFn(step.lastInput, step.actionContext, false);
        step.state = 'redone';
        redoStepChilds(step);
        //跳转到发生事件时的位置
        if (step.currentPosition)
          context.viewPortManager.moveViewportToPosition(step.currentPosition);
        historyIsRedoing = false;
        //标记文档已更改
        context.graphManager.markGraphChanged();
        return true;
      }
      return false
    },
    clear() {
      historyCurrentCursor = -1;
      ArrayUtils.clear(historySteps);
    },
  };

  return {}
}