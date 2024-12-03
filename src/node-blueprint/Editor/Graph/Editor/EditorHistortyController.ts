import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import { useNodeGraphEditorStaticConfig } from "../Config/ConfigManager";


/**
 * 主要负责编辑中的撤销与重做功能
 * 
 * 例如步骤： 1. 添加节点A 2. 连接节点A与节点B 3. 删除节点B
 * 1.1 添加
 * 
 * 
 */


/**
 * 编辑器的历史记录控制器上下文函数
 */
export interface NodeEditorHistoryControllerContext {
  historyManager: {
    storeStep: (
      name: string, 
      doingFn: EditorHistoryStepDoingFn, 
      restoreFn: EditorHistoryStepRestoreFn
    ) => void;
    undoStep: () => boolean;
    redoStep: () => boolean;
    clear: () => void;
  }
}

type EditorHistoryStepDoingFn = () => unknown;
type EditorHistoryStepRestoreFn = (lastParams: unknown) => void;
interface EditorHistoryStep {
  name: string;
  lastParams: unknown;
  childSteps : EditorHistoryStep[],
  doingFn: EditorHistoryStepDoingFn;
  restoreFn: EditorHistoryStepRestoreFn;
}

/**
 * 编辑器的历史记录控制器
 * @param options 
 * @returns 
 */
export function useEditorHistoryController(context: NodeEditorHistoryControllerContext) {

  const { getStaticConfig } = useNodeGraphEditorStaticConfig();

  const MAX_HISTORY = getStaticConfig<number>("maxHistory");

  let historyIsRedoing = false;
  let historyCurrentCursor = 0;
  let historyCurrentStep : EditorHistoryStep|null = null;
  const historySteps : EditorHistoryStep[] = [];
 
  context.historyManager = {
    storeStep(name, doingFn, restoreFn) {
      if (historyIsRedoing)
        return;
      if (historyCurrentCursor < historySteps.length)
        historySteps.splice(historyCurrentCursor + 1);

      const currentStep : EditorHistoryStep = { name, doingFn, restoreFn, childSteps: [], lastParams: null };
      if (historyCurrentStep === null)
      {
        historyCurrentStep = currentStep;
        currentStep.lastParams = doingFn();
        historySteps.push(currentStep);
        historyCurrentStep = null;

        if (historySteps.length > MAX_HISTORY)
          historySteps.unshift();
        historyCurrentCursor = historySteps.length;
      }
      else
      {
        //嵌套步骤
        currentStep.lastParams = doingFn();
        historyCurrentStep.childSteps.push(currentStep);
      }
    },
    undoStep() {
      if (historyCurrentCursor > -1) {
        historyCurrentCursor--;
        historyIsRedoing = true;
        const step = historySteps[historyCurrentCursor];
        step.restoreFn(step.lastParams);
        for (let index = step.childSteps.length - 1; index >= 0; index--) {
          const childStep = step.childSteps[index];
          childStep.restoreFn(childStep.lastParams);
        }
        historyIsRedoing = false;
      }
      return false
    },
    redoStep() {
      if (historyCurrentCursor < historySteps.length) {
        historyCurrentCursor++;
        historyIsRedoing = true;
        const step = historySteps[historyCurrentCursor];
        for (const childStep of step.childSteps)
          childStep.doingFn();
        step.doingFn();
        historyIsRedoing = false;
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