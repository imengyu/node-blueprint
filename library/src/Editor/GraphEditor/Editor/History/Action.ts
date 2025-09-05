import type { EditorHistoryLinkingContext } from "./Shadow";
import { EditorHistoryActionContext } from "./ActionContext";

/**
 * 操作类，用于记录操作和执行操作。
 * 
 * * 使用：
 * ```ts
      class MyAction extends EditorHistoryAction {
         constructor() {
            super("对齐选中节点", () => {
               return ... //返回输入参数，至正向、反向操作的info数据中。
            });
         }
         override onStepExecute(info) {
           this.actionContext //获取 actionContext
           //正向操作（执行、重做）
           //传递数据至反向操作
           return restoreData;
         }, 
         override onStepUndo(restoreData, info) {
           //反向操作（撤销）
         }
       }
   ```
 * 
 * @param K 输入参数类型
 * @param T 反向执行函数参数类型
 * @param R 操作最终返回类型
 */
export class EditorHistoryAction<K = any, T = any, R = any> {
  /**
   * 操作名称，用于显示
   */
  readonly name: string;
  /**
   * 指示当前操作是否被使用过
   */
  get isUsed() { return this._isUsed }
  /**
   * 获取操作上下文
   */
  get actionContext() { 
    if (!this._actionContext)
      throw new Error("Action context is not initialized.");
    return this._actionContext 
  }
  /**
   * 获取编辑器上下文
   */
  get context() { 
    if (!this._actionContext)
      throw new Error("Action context is not initialized.");
    return this._actionContext.context
  }

  /**
   * @param name 操作名称，用于显示
   * @param hookGetTargetParams 获取输入参数函数，用于记录操作的主体，通常是与实例分开的数据，例如UID
   */
  constructor(
    name: string, 
    getTargetParams?: (actionContext: EditorHistoryActionContext) => K
  ) {
    this.name = name;
    this._getTargetParams = getTargetParams;
  }

  _isUsed = false;
  _actionContext ?: EditorHistoryActionContext;

  private _init(actionContext: EditorHistoryActionContext) {
    this._actionContext = actionContext;
    this._isUsed = true;
  }
  private _getTargetParams?: (actionContext: EditorHistoryActionContext) => K; 

  /**
   * 获取输入参数，输入参数用于记录操作的主体，通常是与实例分开的数据，例如UID
   * @param actionContext 
   * @returns 
   */
  protected getTargetParams(actionContext: EditorHistoryActionContext) : K {
    return this._getTargetParams?.(actionContext) ?? (undefined as K);
  }

  /**
   * 正向执行函数，例如执行、重做，传入参数由 getInputParams 返回。返回一个参数用于反向执行函数，如果返回 undefined 或者 null，则不会执行反向执行函数。
   * @param inputParams 输入参数，由 getInputParams 返回。
   * @param actionContext 操作上下文
   * @param isRedo 是否是重做
   * @param linkingContext 链接上下文，用于链接多个操作
   */
  protected async onStepExecute(inputParams: K, isRedo: boolean, linkingContext: EditorHistoryLinkingContext) : Promise<T|undefined|null> {
    throw new Error("Method not implemented.");
  }
  /**
   * 反向执行函数，例如撤销，参数来源于第一次执行 onStepExecute 返回。
   * @param restoreData 反向执行函数的参数，由正向执行函数返回。
   * @param inputParams 输入参数，由 getInputParams 返回。
   * @param actionContext 操作上下文
   */
  protected async onStepUndo(restoreData: NonNullable<T>, inputParams: K) : Promise<void> {
  }

  /**
   * 正向执行函数，可以弹窗用于向用户确认是否执行反向执行函数。返回 false 可以终止执行撤销操作。
   * 注：仅在非嵌套操作的顶层有效。
   * @param inputParams 输入参数，由 getInputParams 返回。
   * @param isRedo 是否是重做
   * @returns 是否确认执行，返回 false 可以终止执行撤销操作。
   */
  protected async onConfirmExecute(inputParams: K, isRedo: boolean) : Promise<boolean> {
    return true;
  }
  /**
   * 反向执行函数的确认函数，可以弹窗用于向用户确认是否执行反向执行函数。返回 false 可以终止执行重做操作。
   * 注：仅在非嵌套操作的顶层有效。
   * @param lastParams 反向执行函数的参数，由正向执行函数返回。
   * @param inputParams 输入参数，由 getInputParams 返回。
   * @returns 是否确认执行，返回 false 可以终止执行重做操作。
   */
  protected async onConfirmUndo(lastParams: T, inputParams: K) : Promise<boolean> {
    return true;
  }
}


