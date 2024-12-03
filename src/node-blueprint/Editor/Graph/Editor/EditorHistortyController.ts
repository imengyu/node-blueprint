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

  let historyCurrentCursor = 0;
  const historySteps : EditorHistoryStep[] = [];
 
  context.historyManager = {
    storeStep(name, doingFn, restoreFn) {
      if (historyCurrentCursor < historySteps.length)
        historySteps.splice(historyCurrentCursor + 1);

      const param = doingFn();
      historySteps.push({ name, doingFn, restoreFn, lastParams: param });

      if (historySteps.length > MAX_HISTORY)
        historySteps.unshift();
      historyCurrentCursor = historySteps.length;
    },
    undoStep() {
      if (historyCurrentCursor > -1) {
        historyCurrentCursor--;
        const step = historySteps[historyCurrentCursor];
        step.restoreFn(step.lastParams);
      }
      return false
    },
    redoStep() {
      if (historyCurrentCursor < historySteps.length) {
        historyCurrentCursor++;
        const step = historySteps[historyCurrentCursor];
        step.doingFn();
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