import 'ses'
import type { Node } from '../Flow/Node/Node';
import type { NodeDocunment } from '../Flow/Graph/NodeDocunment';
import type { NodeGraph } from '../Flow/Graph/NodeGraph';
import ArrayUtils from '../Utils/ArrayUtils';

export type EditorDebugRunnerContextState = 'inactive'|'active'|'paused'|'completed';

interface EditorDebugRunnerContext {
  dbg: {
    uid: string,//graph uid
    nodeStack: string[],
    graphVariables: {
      key: string,
      getCb: () => any,
    }
  },
  state: EditorDebugRunnerContextState;
  parent?: EditorDebugRunnerContext,
  getLocalTemps() : { key: string, value: any }[],
  getLocalVariables() : { key: string, value: any }[],
  next(step: boolean) : { returnValue: any, pauseNodeUid?: string };
}

export interface EditorDebugRunnerPauseContextInfo {
  graph: NodeGraph,
  state: EditorDebugRunnerContextState,
  variables: { key: string, value: any }[],
  temps: { key: string, value: any }[],
  runStack?: {
    node: Node,
  }[],
  parent?: EditorDebugRunnerPauseContextInfo;
}
/**
 * 当前断点位置信息
 */
export interface EditorDebugRunnerPauseInfo {
  /**
   * 当前执行器中的运行上下文，第0个是当前暂停的上下文
   */
  contexts: EditorDebugRunnerPauseContextInfo[],
}

interface EditorDebugRunnerHooks {
  runnerStateChanged(newState: 'idle'|'running'|'paused'): void;
  alertNoActiveContext(): void;
  pauseWithNode(info: EditorDebugRunnerPauseInfo): void;
  pauseWithException(info: EditorDebugRunnerPauseInfo, e: unknown): void;
}

/**
 * 调试脚本执行器
 */
export class EditorDebugRunner {
  constructor(hooks: EditorDebugRunnerHooks) {
    this.hooks = hooks;
  }

  private readonly hooks : EditorDebugRunnerHooks;

  private currentRunning = false;
  private currentMainStarted = false;
  private currentActiveContex: EditorDebugRunnerContext|null = null;
  private currentAllContex: EditorDebugRunnerContext[] = [];

  private currentDoc: NodeDocunment|null = null;
  private currentMainGraph: NodeGraph|null = null;
  private currentGraphMap = new Map<string, NodeGraph>()
  private sandbox = new Compartment({
    _DEBUG_PROVIDER: {
      newDebuggerRunnerContext: (func: () => EditorDebugRunnerContext) => {
        const context = func();
        if (this.currentAllContex.length === 0)
          this.currentActiveContex = context;
        this.currentAllContex.push(context);
      },
      stateDebuggerRunnerContext: (context: EditorDebugRunnerContext) => {
        switch (context.state) {
          case 'active':
            this.currentActiveContex = context;
            this.hooks.runnerStateChanged('running');
            break;
          case 'completed':
            if (this.currentActiveContex === context)
              this.currentActiveContex = null;
            ArrayUtils.remove(this.currentAllContex, context);
            if (this.currentAllContex.length === 0)
              this.stop();
            break;
          case 'paused':
            if (this.currentRunning) {
              this.hooks.pauseWithNode(this.buildPauseInfo(context));
              this.hooks.runnerStateChanged('paused');
            }
            break;
        }
      },
      handleDebuggerRunnerContextException: (context: EditorDebugRunnerContext, e: any) => {
        this.hooks.pauseWithException(this.buildPauseInfo(context), e);
        this.hooks.runnerStateChanged('paused');
      },
      checkBreakNode: (graphUid: string, nodeUid: string) => {
        const node = this.currentGraphMap.get(graphUid)?.nodes.get(nodeUid);
        if (!node)
          return false;
        return node.breakpoint === 'enable';
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      checkDebugFunction: (graphUid: string) => {
        //TODO: 函数断点
        return false;
      },
    },
    _CORE_CONNECTOR: {
      begin: () => {
        this.currentRunning = true;
      },
      exit: () => {
        this.stop();
      },
      platform() {
        return 'js:web'
      },
    },
  });

  private buildPauseInfo(currentCountext: EditorDebugRunnerContext) : EditorDebugRunnerPauseInfo {
    const info : EditorDebugRunnerPauseInfo = { contexts: [] };
    const addedContexts : EditorDebugRunnerContext[] = [];

    const makeContextInfo = (context: EditorDebugRunnerContext) : EditorDebugRunnerPauseContextInfo => {
      addedContexts.push(context);
      const graph = this.currentGraphMap.get(context.dbg.uid);
      if (!graph)
        throw new Error(`Not found graph ${context.dbg.uid} in context`);
      return {
        graph,
        state: context.state,
        variables: context.getLocalVariables(),
        temps: context.getLocalTemps(),
        runStack: context.dbg.nodeStack.map(uid => ({
          node: graph.nodes.get(uid)!,
        })),
        parent: context.parent ? makeContextInfo(context.parent) : undefined,
      };
    }
    
    info.contexts.push(makeContextInfo(currentCountext));

    this.currentAllContex
      .forEach((context) => {
        if (context !== currentCountext && !context.parent && !addedContexts.includes(context))
          info.contexts.push(makeContextInfo(context))
      });

    return info;
  }
  private buildGraphMap() {
    this.currentGraphMap.clear();
    this.currentMainGraph = this.currentDoc?.mainGraph ?? null;

    const buildGraph = (graph: NodeGraph) => {
      for (const iterator of graph.children) {
        buildGraph(iterator);
        this.currentGraphMap.set(iterator.uid, iterator);
      }
    }

    if (this.currentMainGraph) {
      buildGraph(this.currentMainGraph);
      this.currentGraphMap.set(this.currentMainGraph.uid, this.currentMainGraph);
    }
  }

  /**
   * 加载代码至实例中运行
   * @param doc 运行的文档实例
   * @param code 已编译的JS代码
   */
  load(doc: NodeDocunment, code: string) {
    this.currentRunning = false;
    this.currentMainStarted = false;
    this.currentActiveContex = null;
    this.currentAllContex = [];
    this.currentDoc = doc;
    this.buildGraphMap();
    this.sandbox.evaluate(code);
  }

  /**
   * 获取脚本是否已经启动运行
   * @returns 
   */
  getStarted() {
    return this.currentMainStarted;
  }

  /**
   * 开始运行
   */
  run() {
    this.hooks.runnerStateChanged('running');
    this.currentRunning = true;
    this.currentMainStarted = true;
    this.sandbox.globalThis._DEBUG_CONNECTOR.debuggerConnected = true;
    this.sandbox.globalThis._DEBUG_CONNECTOR.debuggerPaused = false;
    this.sandbox.globalThis._DEBUG_CONNECTOR.debuggerStepMode = false;
    if ( this.currentActiveContex)
      this.currentActiveContex.next(false);
    else
      this.hooks.alertNoActiveContext();
  }
  /**
   * 暂停运行
   */
  pause() {
    this.sandbox.globalThis._DEBUG_CONNECTOR.debuggerPause();
  } 
  /**
   * 单步执行
   */
  step() {
    this.hooks.runnerStateChanged('running');
    if (this.currentActiveContex)
      this.currentActiveContex.next(true);
    else
      this.hooks.alertNoActiveContext();
  } 
  /**
   * 停止运行
   */
  stop() {
    this.currentRunning = false;
    this.sandbox.globalThis.debugStop();
    this.hooks.runnerStateChanged('idle');
  }

}