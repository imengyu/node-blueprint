import { EditorDebugRunner, type EditorDebugRunnerPauseContextInfo, type EditorDebugRunnerPauseInfo, type EditorDebugRunnerState, type EditorDebugRunnerVariableListInfo } from "@/node-blueprint/Base/Debugger/EditorDebugRunner";
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
import Alert from "../../Nana/Modal/Alert";
import type { NodePort } from "@/node-blueprint/Base/Flow/Node/NodePort";
import type { NodeConnectorEditor } from "../../Graph/Flow/NodeConnectorEditor";
import { NodeParamType } from "@/node-blueprint/Base/Flow/Type/NodeParamType";

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
  currentExecuteVariableInfo: Ref<EditorDebugRunnerVariableListInfo[]>
  currentExecutePauseInfo: Ref<EditorDebugRunnerPauseInfo | null>,
  setGlobalBreakPointDisableState(state: boolean): void,
  getGlobalBreakPointDisableState(): boolean,
  setDebuggerType(_type: EditorDebugType, params: Record<string, any>): void,
  getPortValue(port: NodePort): { hasValue: boolean, value: any },
  deleteAllBreakPoint(): void,
  deleteBreakPoint(breakpoint: EditorDebugBreakpoint): void;
  jumpToBreakPoint(breakpoint: EditorDebugBreakpoint): void;
  jumpToNode(node: Node, tip?: boolean): void;
  loadDocunment(doc: NodeDocunment): void,
  onNodeBreakPointStateChanged(node: Node): void,
  onNodeDelete(node: Node): void,
  alertChangeIfIsDebugging(): void;
  activeStackLineAndFirstNode(info: EditorDebugRunnerPauseContextInfo): void,
  activeFirstStackLineAndFirstNode(info: EditorDebugRunnerPauseInfo): void;
  clearActiveStackLineAnNode(): void;
  showStackVariableInfo: (info: EditorDebugRunnerPauseContextInfo) => void;
  clearStackVariableInfo: () => void,
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
  const changeAlertShowed = ref(false);
  const state = ref<EditorDebugRunnerState>('idle');
  const busyState = ref(false);
  const breakpoints = ref<EditorDebugBreakpoint[]>([]);

  const currentExecuteError = ref('');
  const currentExecuteInfo = ref('');
  const currentExecuteVariableInfo = ref<EditorDebugRunnerVariableListInfo[]>([ 
    {
      key: 'Variables',
      children: []
    },
    {
      key: 'Temps',
      children: []
    }
  ]);
  const currentExecutePauseInfo = ref<EditorDebugRunnerPauseInfo|null>(null);

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
      activeFirstStackLineAndFirstNode(info);
      context.focusDebuggerPanel();
      currentExecuteError.value = '';
      currentExecuteInfo.value = `Debugger paused`;
      currentExecutePauseInfo.value = info;
      showStackVariableInfo(info.contexts[0]);
    },
    pauseWithException(info, e) {
      printError(TAG, `Debugger paused at node: ${getStackFirstNodeName(info)} with exception: ${e}`);
      activeFirstStackLineAndFirstNode(info);
      context.focusDebuggerPanel();
      currentExecuteError.value = '' + e;
      currentExecuteInfo.value = '';
      currentExecutePauseInfo.value = info;
      showStackVariableInfo(info.contexts[0]);
    },
    reusme() {
      printInfo(TAG, `Debugger running`);
      clearStateMessages();
      currentExecuteError.value = '';
      currentExecuteInfo.value = 'Debugger running';
      currentExecutePauseInfo.value = null;
      clearStackVariableInfo();
    },
  });

  const currentPortDebugValueMap = new Map<string, any>();

  /**
   * 显示调用栈的变量信息
   * @param info 
   */
  function showStackVariableInfo(info: EditorDebugRunnerPauseContextInfo) {
    currentExecuteVariableInfo.value[0].children = [];
    currentExecuteVariableInfo.value[1].children = [];
    currentPortDebugValueMap.clear();

    const variableArr = currentExecuteVariableInfo.value[0].children;
    const tempsArr = currentExecuteVariableInfo.value[1].children;

    let _info : EditorDebugRunnerPauseContextInfo|undefined = info;
    while(_info) {
      if (_info.variables)
        variableArr.push(..._info.variables);
      if (_info.temps)
        tempsArr.push(..._info.temps);
      _info = _info.parent;
    }

    tempsArr.forEach(e => currentPortDebugValueMap.set(e.key, e.value.v));
  }
  /**
   * 清空变量显示信息
   */
  function clearStackVariableInfo() {
    currentExecuteVariableInfo.value[0].children = [];
    currentExecuteVariableInfo.value[1].children = [];
  }
  /**
   * 清空状态信息
   */
  function clearStateMessages() {
    currentExecuteError.value = '';
    currentExecuteInfo.value = '';
    currentExecutePauseInfo.value = null;
    clearActiveStackLineAnNode();
    clearStackVariableInfo();
  }

  let lastTriggeredBreakpointNode : null|NodeEditor = null;
  let lastActiveStackInfo : null|EditorDebugRunnerPauseContextInfo = null;
  const lastActivedConnectors : NodeConnectorEditor[] = [];

  /**
   * 清除之前高亮标记中断的节点与连接线
   */
  function clearActiveStackLineAnNode() {
    lastActiveStackInfo = null;
    if (lastTriggeredBreakpointNode) {
      lastTriggeredBreakpointNode.breakpointTriggered = false;
      lastTriggeredBreakpointNode = null;
    }
    for (const connector of lastActivedConnectors)
      connector.state = 'normal';
    ArrayUtils.clear(lastActivedConnectors);
  }
  /**
   * 激活第一个运行栈上的连接线状态和当前暂停的节点
   * @param info 
   */
  function activeFirstStackLineAndFirstNode(info: EditorDebugRunnerPauseInfo) {
    const info2 = info.contexts[0];
    if (info2) 
      activeStackLineAndFirstNode(info2);
  }
  /**
   * 激活运行栈上的连接线状态和当前暂停的节点
   * @param info 
   */
  function activeStackLineAndFirstNode(info: EditorDebugRunnerPauseContextInfo) {
    if (lastActiveStackInfo === info)
      return;
    clearActiveStackLineAnNode();
    lastActiveStackInfo = info;
    const stack = info.runStack;
    if (stack) {
      //高亮标记中断的节点
      const firstNode = stack[0].node as NodeEditor;
      if (firstNode) {
        lastTriggeredBreakpointNode = firstNode;
        firstNode.breakpointTriggered = true;
        jumpToNode(firstNode);
      }
      //激活调用栈上方连接线
      let prevNode : Node|null = null;
      for (let i = 0; i < stack.length; i++) {
        const currentNode = stack[i].node;
        const entryCallPortGUID = stack[i].call;
        if (prevNode !== null) {
          const connector = currentNode.getPortAndConnectorByType(
            NodeParamType.Execute, 
            'output', 
            prevNode, 
            entryCallPortGUID)?.connector as NodeConnectorEditor;
          if (connector)
            lastActivedConnectors.push(connector);
        }
        prevNode = currentNode;
      }
      for (const connector of lastActivedConnectors) {
        connector.state = 'active';
        connector.resetDotPos();
      }
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
  /**
   * 跳转到指定的节点
   * @param node 
   */
  function jumpToNode(node: NodeEditor, tip = false) {
    context.jumpToDocunment(
      (node.parent as NodeGraph).parent as NodeDocunmentEditor,
      (node.parent as NodeGraph),
      node as NodeEditor,
      undefined,
      tip,
    );
  }
  /**
   * 获取当前运行栈中的端口实时值
   * @param port 
   */
  function getPortValue(port: NodePort, getConnectedPort = true): { hasValue: boolean, value: any } {
    const key = `${port.parent.uid}:${port.guid}`;
    if (currentPortDebugValueMap.has(key))
      return {
        hasValue: true,
        value: currentPortDebugValueMap.get(key)
      }
    //如果节点连接了节点，则再获取链接节点的值
    if (getConnectedPort && port.connectedFromPort.length > 0)
      return getPortValue(port.connectedFromPort[0].startPort!, false);
    return {
      hasValue: false,
      value: undefined
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  //如果调试中编辑，则提示用户
  function alertChangeIfIsDebugging() {
    if (debugging.value && !changeAlertShowed.value) {
      changeAlertShowed.value = true;
      Alert.warning({
        content: '现在正在调试，您对文档做出的修改会在下次调试生效',
      })
    }
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
    changeAlertShowed.value = false;
    debugging.value = false;
  }

  return {
    state,
    debugging,
    busyState,
    breakpoints: breakpoints as Ref<EditorDebugBreakpoint[]>,
    currentExecuteError,
    currentExecuteInfo,
    currentExecuteVariableInfo: currentExecuteVariableInfo as Ref<EditorDebugRunnerVariableListInfo[]>,
    currentExecutePauseInfo: currentExecutePauseInfo as Ref<EditorDebugRunnerPauseInfo|null>,
    onNodeBreakPointStateChanged,
    onNodeDelete,
    loadDocunment,
    setDebuggerType,
    setGlobalBreakPointDisableState,
    getGlobalBreakPointDisableState,
    deleteAllBreakPoint,
    deleteBreakPoint,
    getPortValue,
    jumpToBreakPoint(breakpoint) { jumpToNode(breakpoint.node as NodeEditor, true); },
    alertChangeIfIsDebugging,
    activeFirstStackLineAndFirstNode,
    activeStackLineAndFirstNode,
    clearActiveStackLineAnNode,
    showStackVariableInfo,
    clearStackVariableInfo,
    jumpToNode,
    run,
    pause,
    step,
    stop,
  }
}