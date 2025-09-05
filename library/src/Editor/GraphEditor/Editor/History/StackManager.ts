import type { NodeGraphEditorInternalContext } from "../../NodeGraphEditor";
import type { EditorHistoryStep } from "../EditorHistortyController";

/**
 * 用于管理历史记录栈
 */
export class EditorHistoryStepStackManager {
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