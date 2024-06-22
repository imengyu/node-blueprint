import { EditorDebugRunner, type EditorDebugRunnerPauseInfo, type EditorDebugRunnerState, type EditorDebugRunnerVariableInfo } from "@/node-blueprint/Base/Debugger/EditorDebugRunner";
import type { Node, NodeBreakPoint } from "@/node-blueprint/Base/Flow/Node/Node";
import { ref, type Ref } from "vue";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import type { NodeDocunment } from "@/node-blueprint/Base/Flow/Graph/NodeDocunment";
import type { NodeGraph } from "@/node-blueprint/Base/Flow/Graph/NodeGraph";
import type { NodeIdeControlContext } from "../NodeIde";
import type { NodeDocunmentEditor } from "../../Graph/Flow/NodeDocunmentEditor";
import type { NodeEditor } from "../../Graph/Flow/NodeEditor";
import { NodeGraphCompiler } from "@/node-blueprint/Base/Compiler/NodeGraphCompiler";
import { printError, printInfo } from "@/node-blueprint/Base/Logger/DevLog";

export type EditorDebugType = 'debug'|'remote';
export interface EditorDebugBreakpoint {
  node: Node,
  state: NodeBreakPoint,
}
export interface EditorDebugController {
  state: Ref<EditorDebugRunnerState>,
  busyState: Ref<boolean>,
  debugging: Ref<boolean>,
  breakpoints: Ref<EditorDebugBreakpoint[]>,
  currentExecuteError: Ref<string>,
  currentExecuteInfo: Ref<string>,
  currentExecuteTempsInfo: Ref<EditorDebugRunnerVariableInfo[]|null>
  currentExecuteVariableInfo: Ref<EditorDebugRunnerVariableInfo[]|null>
  currentExecutePauseInfo: Ref<EditorDebugRunnerPauseInfo | null>,
  setGlobalBreakPointDisableState(state: boolean): void,
  getGlobalBreakPointDisableState(): boolean,
  setDebuggerType(_type: EditorDebugType, params: Record<string, any>): void,
  deleteAllBreakPoint(): void,
  deleteBreakPoint(breakpoint: EditorDebugBreakpoint): void;
  jumpToBreakPoint(breakpoint: EditorDebugBreakpoint): void;
  jumpToNode(node: Node): void;
  loadDocunment(doc: NodeDocunment): void,
  onNodeBreakPointStateChanged(node: Node): void,
  onNodeDelete(node: Node): void,
  run: (fromDocunment: NodeDocunment) => void,
  pause: () => void,
  step: () => void,
  stop: () => void,
}

const TAG = 'EditorDebugController';

//TODO: 远程连接调试
export function useEditorDebugController(context: NodeIdeControlContext) : EditorDebugController {

  let globalBreakPointDisableState = false;

  const type = ref<EditorDebugType>('debug');
  const debugging = ref(false);
  const state = ref<EditorDebugRunnerState>('idle');
  const busyState = ref(false);
  const breakpoints = ref<EditorDebugBreakpoint[]>([]);

  const currentExecuteError = ref('');
  const currentExecuteInfo = ref('');
  const currentExecuteVariableInfo = ref<EditorDebugRunnerVariableInfo[]|null>(null);
  const currentExecuteTempsInfo = ref<EditorDebugRunnerVariableInfo[]|null>(null);
  const currentExecutePauseInfo = ref<EditorDebugRunnerPauseInfo|null>(null);

  let lastTriggeredBreakpointNode : null|NodeEditor = null;

  const debugRunner = new EditorDebugRunner({
    getGlobalBreakPointDisableState() {
      return globalBreakPointDisableState;
    },
    runnerStateChanged(newState) {
      state.value = newState;
    },
    alertNoActiveContext() {
      context.focusDebuggerPanel();
      printError(TAG, `Debugger stopped because: NoActiveContext`);
    },
    pauseWithNode(info) {
      printInfo(TAG, `Debugger paused at node: ${getStackFirstNodeName(info)}`);
      jumpToStackFirstNode(info);
      context.focusDebuggerPanel();
      currentExecuteError.value = '';
      currentExecuteInfo.value = `Debugger paused`;
      currentExecutePauseInfo.value = info;
      currentExecuteVariableInfo.value = info.contexts[0].variables;
      currentExecuteTempsInfo.value = info.contexts[0].temps;
    },
    pauseWithException(info, e) {
      printError(TAG, `Debugger paused at node: ${getStackFirstNodeName(info)} with exception: ${e}`);
      jumpToStackFirstNode(info);
      context.focusDebuggerPanel();
      currentExecuteError.value = '' + e;
      currentExecuteInfo.value = '';
      currentExecutePauseInfo.value = info;
      currentExecuteVariableInfo.value = info.contexts[0].variables;
      currentExecuteTempsInfo.value = info.contexts[0].temps;
    },
    reusme() {
      printInfo(TAG, `Debugger running`);
      clearStateMessages();
      currentExecuteError.value = '';
      currentExecuteInfo.value = 'Debugger running';
      currentExecutePauseInfo.value = null;
      currentExecuteVariableInfo.value = null;
      currentExecuteTempsInfo.value = null;
    },
  });

  //清空状态信息
  function clearStateMessages() {
    clearFirstNodeLight();
    currentExecuteError.value = '';
    currentExecuteInfo.value = '';
    currentExecutePauseInfo.value = null;
    currentExecuteVariableInfo.value = null;
    currentExecuteTempsInfo.value = null;
  }
  /**
   * 清除之前高亮标记中断的节点
   */
  function clearFirstNodeLight() {
    if (lastTriggeredBreakpointNode) {
      lastTriggeredBreakpointNode.breakpointTriggered = false;
      lastTriggeredBreakpointNode = null;
    }
  }
  /**
   * 高亮标记当前中断的节点
   * @param info 
   */
  function jumpToStackFirstNode(info: EditorDebugRunnerPauseInfo) {
    clearFirstNodeLight();
    const firstNode = info.contexts[0]?.runStack?.[0].node as NodeEditor;
    if (firstNode) {
      lastTriggeredBreakpointNode = firstNode;
      firstNode.breakpointTriggered = true;
      jumpToNode(firstNode);
    }
  }
  /**
   * 获取堆栈中第一个节点名称
   * @param info 
   */
  function getStackFirstNodeName(info: EditorDebugRunnerPauseInfo) {
    const firstNode = info.contexts[0]?.runStack?.[0].node as NodeEditor;
    return firstNode? firstNode.name : '';
  }
  function jumpToNode(node: NodeEditor) {
    context.jumpToDocunment(
      (node.parent as NodeGraph).parent as NodeDocunmentEditor,
      (node.parent as NodeGraph),
      node as NodeEditor
    );
  }

  function setDebuggerType(_type: EditorDebugType, params: Record<string, any>) {
    type.value = _type;
  }
  function setGlobalBreakPointDisableState(_state: boolean) {
    globalBreakPointDisableState = _state;
  }
  function getGlobalBreakPointDisableState() {
    return globalBreakPointDisableState;
  }
  function deleteBreakPoint(breakpoint: EditorDebugBreakpoint) {
    breakpoint.node.breakpoint = 'none';
    ArrayUtils.remove(breakpoints.value, breakpoint);
  }
  function deleteAllBreakPoint() {
    for (const breakpoint of breakpoints.value)
      breakpoint.node.breakpoint = 'none';
    ArrayUtils.clear(breakpoints.value);
  }
  function onNodeBreakPointStateChanged(node: Node) {
    const index = breakpoints.value.findIndex(n => n.node === node);
    if (node.breakpoint === 'none') {
      if (index >= 0)
        ArrayUtils.removeAt(breakpoints.value, index);
    } else {
      if (index >= 0)
        breakpoints.value[index].state = node.breakpoint;
      else
        breakpoints.value.push({ node, state: node.breakpoint });
    }
  }
  function onNodeDelete(node: Node) {
    const index = breakpoints.value.findIndex(n => n.node === node);
    if (index >= 0)
      ArrayUtils.removeAt(breakpoints.value, index);
  }

  //加载文档信息
  function loadDocunment(doc: NodeDocunment) {
    loadAllBreakPoints(doc);
  }
  function loadAllBreakPoints(doc: NodeDocunment) {
    function loadGraphBreakPoints(graph: NodeGraph) {
      for (const [,node] of graph.nodes) {
        if (node.breakpoint !== 'none')
          breakpoints.value.push({ node, state: node.breakpoint });
      }
      for (const child of graph.children)
        loadGraphBreakPoints(child);
    }
    if (doc.mainGraph)
      loadGraphBreakPoints(doc.mainGraph);
  }

  function compileAll(fromDocunment: NodeDocunment) {
    if (fromDocunment) {
      const result = NodeGraphCompiler.getInstance()
        .getCompiler('js')
        .compileDocunment(fromDocunment, true);
      debugRunner.load(fromDocunment, result);
    }
  }
  function run(fromDocunment: NodeDocunment) {
    if (currentExecuteError.value) {
      stop();
      return;
    }
    if (!debugging.value) {
      debugging.value = true;
      compileAll(fromDocunment);
    }
    debugRunner.run();
  }
  function pause() {
    debugRunner.pause();
  } 
  function step() {
    debugRunner.step();
  } 
  function stop() {
    clearStateMessages();
    debugRunner.stop();
    debugging.value = false;
  }

  return {
    state,
    debugging,
    busyState,
    breakpoints: breakpoints as Ref<EditorDebugBreakpoint[]>,
    currentExecuteError,
    currentExecuteInfo,
    currentExecuteTempsInfo: currentExecuteTempsInfo as Ref<EditorDebugRunnerVariableInfo[]|null>,
    currentExecuteVariableInfo: currentExecuteVariableInfo as Ref<EditorDebugRunnerVariableInfo[]|null>,
    currentExecutePauseInfo: currentExecutePauseInfo as Ref<EditorDebugRunnerPauseInfo|null>,
    onNodeBreakPointStateChanged,
    onNodeDelete,
    loadDocunment,
    setDebuggerType,
    setGlobalBreakPointDisableState,
    getGlobalBreakPointDisableState,
    deleteAllBreakPoint,
    deleteBreakPoint,
    jumpToBreakPoint(breakpoint) { jumpToNode(breakpoint.node as NodeEditor); },
    jumpToNode,
    run,
    pause,
    step,
    stop,
  }
}