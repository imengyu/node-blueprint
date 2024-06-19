import { EditorDebugRunner, type EditorDebugRunnerState } from "@/node-blueprint/Base/Debugger/EditorDebugRunner";
import type { Node, NodeBreakPoint } from "@/node-blueprint/Base/Flow/Node/Node";
import { ref, type Ref } from "vue";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import type { NodeDocunment } from "@/node-blueprint/Base/Flow/Graph/NodeDocunment";
import type { NodeGraph } from "@/node-blueprint/Base/Flow/Graph/NodeGraph";
import type { NodeIdeControlContext } from "../NodeIde";
import type { NodeDocunmentEditor } from "../../Graph/Flow/NodeDocunmentEditor";
import type { NodeEditor } from "../../Graph/Flow/NodeEditor";

export type EditorDebugType = 'debug'|'remote';
export interface EditorDebugBreakpoint {
  node: Node,
  state: NodeBreakPoint,
}
export interface EditorDebugController {
  state: Ref<EditorDebugRunnerState>,
  busyState: Ref<boolean>,
  breakpoints: Ref<EditorDebugBreakpoint[]>,
  setGlobalBreakPointDisableState(state: boolean): void,
  getGlobalBreakPointDisableState(): boolean,
  setDebuggerType(_type: EditorDebugType, params: Record<string, any>): void,
  deleteAllBreakPoint(): void,
  deleteBreakPoint(breakpoint: EditorDebugBreakpoint): void;
  jumpToBreakPoint(breakpoint: EditorDebugBreakpoint): void;
  loadAllBreakPoints(doc: NodeDocunment): void,
  onNodeBreakPointStateChanged(node: Node): void,
  onNodeDelete(node: Node): void,
  run: () => void,
  pause: () => void,
  step: () => void,
  stop: () => void,
}

//TODO: 远程连接调试
export function useEditorDebugController(context: NodeIdeControlContext) : EditorDebugController {

  let globalBreakPointDisableState = false;

  const type = ref<EditorDebugType>('debug');
  const state = ref<EditorDebugRunnerState>('idle');
  const busyState = ref(false);
  const breakpoints = ref<EditorDebugBreakpoint[]>([]);
  const debugRunner = new EditorDebugRunner({
    getGlobalBreakPointDisableState() {
      return globalBreakPointDisableState;
    },
    runnerStateChanged(newState) {
      state.value = newState;
    },
    alertNoActiveContext() {
      
    },
    pauseWithNode(info) {
      
    },
    pauseWithException(info, e) {
      
    },
  });

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

  function run() {
    debugRunner.run();
  }
  function pause() {
    debugRunner.pause();
  } 
  function step() {
    debugRunner.step();
  } 
  function stop() {
    debugRunner.stop();
  }

  return {
    state,
    busyState,
    breakpoints: breakpoints as Ref<EditorDebugBreakpoint[]>,
    onNodeBreakPointStateChanged,
    onNodeDelete,
    loadAllBreakPoints,
    setDebuggerType,
    setGlobalBreakPointDisableState,
    getGlobalBreakPointDisableState,
    deleteAllBreakPoint,
    deleteBreakPoint,
    jumpToBreakPoint(breakpoint) { 
      context.jumpToDocunment(
        (breakpoint.node.parent as NodeGraph).parent as NodeDocunmentEditor,
        (breakpoint.node.parent as NodeGraph),
        breakpoint.node as NodeEditor
      );
    },
    run,
    pause,
    step,
    stop,
  }
}