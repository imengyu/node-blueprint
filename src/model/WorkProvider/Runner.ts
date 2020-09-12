import { BlockPort } from "../Define/Port";
import { Block } from "../Define/Block";
import { ConnectorEditor } from "../Editor/ConnectorEditor";
import { BlockGraphDocunment, BlockDocunment } from "../Define/BlockDocunment";
import BaseBlocks from "../Blocks/BaseBlocks";
import { BlockGraphChangeCallback } from "../Editor/BlockEditorOwner";

/**
 * 流图运行器
 */
export class BlockRunner {

  /**
   * 队列 FIFO
   */
  public queue : Array<BlockRunContextData> = [];
  /**
   * 当前运行上下文
   */
  public currentRunningContext : BlockRunContextData = null;
  /**
   * 运行器状态
   */
  public state : RunnerState = null;
  /**
   * 获取或设置是否单步执行
   */
  public stepMode = null;
  /**
   * 主运行上下文
   */
  public mainContext : BlockRunContextData = null;

  private loop = null;

  public start() {
    this.state = 'running';
    if(this.loop != null) 
      clearInterval(this.loop);
    this.loop = setInterval(() => this.mainloop(), 100);
  }
  public stop() {
    clearInterval(this.loop);
    this.loop = null;
    this.state = 'stopped';
  }
  public clear() {
    clearInterval(this.loop);
    this.queue.empty();
    this.loop = null;
    this.state = 'stopped';
    this.currentRunningContext = null;
  }
  /**
   * 向队列末尾添加一个任务
   * @param startPort 起始节点
   * @param workType 执行方式
   */
  public push(startPort : BlockPort, parentContext : BlockRunContextData, workType : RunnerWorkType = 'connector') {
    let data = new BlockRunContextData(this, startPort, parentContext, workType);
    this.queue.push(data);
    return data;
  }

  private shift() {
    if(this.queue.length > 0)
      return this.queue.shift(); 
    return null;
  }
  private endRunningContext(runningContext : BlockRunContextData) {
    if(runningContext.currentBlock != null) {
      runningContext.currentBlock.currentRunningContext = null;
      runningContext.currentBlock = null;
    }
    runningContext.currentPort = null;
  }
  private destroyContext(runningContext : BlockRunContextData) {
    runningContext.graphBlockParamStack.empty();
    runningContext.graphParamStack.empty();
    runningContext.stackCalls.empty();
    runningContext.childContext.forEach((c) => this.destroyContext(c));
    runningContext.childContext.empty();
    if(runningContext.parentContext != null) {
      runningContext.parentContext.childContext.remove(runningContext);
      runningContext.parentContext = null;
    }
  }
  private mainloop() {
    this.currentRunningContext = this.shift();
    //无任务，空闲
    if(this.currentRunningContext == null) {
      if(this.state != 'idle') {
        this.state = 'idle';
        if(typeof this.onRunnerIdle == 'function')
          this.onRunnerIdle();
      }
      return;
    }

    this.state = 'running';

    let currentPort = this.currentRunningContext.currentPort;
    if(this.currentRunningContext.loopLifeTime > 0) {//周期允许
      this.currentRunningContext.loopLifeTime--;
      if(currentPort.paramType == 'execute') {
        //激活对应端口
        if(this.currentRunningContext.workType == 'connector') {
          if(currentPort.direction == 'output' && currentPort.connectedToPort.length > 0) {
            if(this.stepMode)  //单步执行模式
              this.markInterrupt(this.currentRunningContext, currentPort.connectedToPort[0].port, 
                currentPort.connectedToPort[0].port.parent);
            else (currentPort.connectedToPort[0].port).active(this.currentRunningContext);
            if((currentPort.connectedToPort[0].port).parent.isEditorBlock)
              (<ConnectorEditor>currentPort.connectedToPort[0].connector).active(null);
          }
        }else currentPort.active(this.currentRunningContext);
      }
    }else {
      //队列周期已用完，任务将在下一个队列任务中运行
      this.queue.push(this.currentRunningContext);
    }

  }

  /**
   * 激活下一个连接点
   * @param runningContext 当前运行上下文
   * @param currentPort 当前连接节点
   */
  public callNextConnectedPort(runningContext : BlockRunContextData, currentPort : BlockPort) {
    if(currentPort.paramType == 'execute') {
      if(runningContext.loopLifeTime > 0) {
        runningContext.loopLifeTime--;
      
        if(currentPort.direction == 'output' && currentPort.connectedToPort.length > 0) {
          if(this.stepMode) //单步执行模式
            this.markInterrupt(this.currentRunningContext, <BlockPort>currentPort.connectedToPort[0].port, 
              currentPort.connectedToPort[0].port.parent);
          else 
            (<BlockPort>currentPort.connectedToPort[0].port).active(this.currentRunningContext);
          if((<BlockPort>currentPort.connectedToPort[0].port).parent.isEditorBlock)
            (<ConnectorEditor>currentPort.connectedToPort[0].connector).active(null);
        }
      }else {
        this.endRunningContext(runningContext);
        this.queue.push(runningContext);
      }
    }
  }
  /**
   * 触发断点
   * @param block 断点所在块
   * @return 如果断点已处理返回，true
   */
  public markInterrupt(runningContext : BlockRunContextData, currentPort : BlockPort, block : Block) : boolean {
    if(currentPort.direction == 'input') {
      if(typeof this.onRunnerBreakPoint == 'function') {
        this.stop();
        this.onRunnerBreakPoint(currentPort, block);

        //断点已触发，现在修改任务至下个节点
        runningContext.currentPort = currentPort;
        runningContext.workType = 'activator';
        this.queue.push(runningContext);
        return true;
      } 
    }
    return false;
  }
  /**
   * 脚本调用结束
   */
  public notifyEnd(runningContext : BlockRunContextData) {
    if(typeof this.onRunnerEnd == 'function') 
      this.onRunnerEnd();
    this.destroyContext(this.mainContext);
    this.stop();
  }
  /**
   * 开始运行脚本文档
   */
  public executeStart(doc : BlockDocunment) {
    let startBlock = doc.mainGraph.getOneBlockByGUID(BaseBlocks.getScriptBaseBlockIn().guid);
    if(startBlock == null) {
      this.lastError = '没有找到入口单元，无法运行脚本。请先添加一个入口单元';
      return false;
    }

    this.mainContext = this.push(startBlock.outputPorts['START'], null, 'connector');
    this.mainContext.graph = doc.mainGraph;

    //变量初始化以仅参数
    this.prepareGraphVariables(this.mainContext, doc.mainGraph);
    this.prepareGraphStack(this.mainContext, doc.mainGraph);
    this.prepareAllBlockRun(this.mainContext, doc.mainGraph);

    //开始运行
    this.start();
    return true;
  }
  /**
   * 执行前准备文档中所有块数据
   */
  public prepareAllBlockRun(runningContext : BlockRunContextData, graph : BlockGraphDocunment) {
    if(!graph.blockPrepared) {

      runningContext.graphBlockStack.empty();

      graph.blocks.forEach((block) => {
        block.currentRunningContext = runningContext;
        block.stack = runningContext.graphBlockStack.push({
          variables: {}
        }) - 1;
        block.onStartRun.invoke(block);
      });

      graph.blockPrepared = true;
      graph.lastRunContext = runningContext;
    }
  }
  /**
   * 初始化图表所有变量
   * @param runningContext 当前运行上下文
   * @param graph 当前图表
   */
  public prepareGraphVariables(runningContext : BlockRunContextData, graph : BlockGraphDocunment) {
    runningContext.graphParamStack.empty();

    //初始化全部变量的栈
    graph.variables.forEach((variable) => {
      if(variable.static) {
        variable.value = variable.defaultValue ? variable.defaultValue : null;
        variable.stack = -1;
      }else {
        variable.stack = runningContext.graphParamStack.push(variable.defaultValue ? variable.defaultValue : null) - 1;
      }
    });
  }
  /**
   * 准备图表的运行栈
   * @param runningContext 当前运行上下文
   * @param graph 当前图表
   */
  public prepareGraphStack(runningContext : BlockRunContextData, graph : BlockGraphDocunment) {

    runningContext.graph = graph;
    runningContext.graphBlockParamStack.empty();

    graph.blocks.forEach((block) => {
      block.allPorts.forEach((port) => {
        if(port.paramType != 'execute') {
          if(!(port.paramRefPassing && port.direction == 'input')) {
            port.stack = runningContext.graphBlockParamStack.push(
              port.paramUserSetValue ? port.paramUserSetValue : port.paramDefaultValue) - 1;
          }else {
            port.stack = -1;
          }
        }
      });
    });

  }
  /**
   * 清除图表的运行栈
   * @param runningContext 当前运行上下文
   * @param graph 当前图表
   */
  public destroyGraphStack(runningContext : BlockRunContextData, graph : BlockGraphDocunment) {
    if(runningContext.graph == graph) {
      runningContext.graphBlockParamStack.empty();
      runningContext.graph = null;
      this.destroyContext(runningContext);
    }
  }
   
  public lastError = '';

  /**
   * 当运行队列空闲时触发回调
   */
  public onRunnerIdle : () => void = null;
  /**
   * 当运行至断点时触发回调（如果要开启断点调试功能，此回调必须被赋值）
   */
  public onRunnerBreakPoint : (currentPort : BlockPort, block : Block) => void = null;
  /**
   * 当脚本结束被调用时触发回调
   */
  public onRunnerEnd : () => void = null;
}


/**
 * 运行状态
 */
export type RunnerState = 'stopped'|'running'|'idle';
/**
 * 执行连接方式。
 * connector：激活下一个节点
 * activator：直接激活当前节点
 */
export type RunnerWorkType = 'connector'|'activator';

/**
 * 运行上下文数据
 */
export class BlockRunContextData {

  public startPort : BlockPort = null;
  public currentPort : BlockPort = null;
  public currentBlock : Block = null;
  public lastPort : BlockPort = null;
  public lastBreakPointPort : BlockPort = null;

  public runner : BlockRunner = null;
  public loopLifeTime = 5;
  public workType : RunnerWorkType = 'connector';

  /**
   * 创建运行上下文数据
   * @param runner 运行器
   * @param startPort 起始端口
   * @param parentContext 父上下文
   * @param workType 执行连接方式
   */
  public constructor(runner : BlockRunner, startPort : BlockPort, parentContext : BlockRunContextData, 
    workType : RunnerWorkType = 'connector') {

    this.runner = runner;
    this.startPort = startPort;
    this.currentPort = startPort;
    this.workType = workType;
    this.parentContext = parentContext;

    if(this.parentContext != null) {
      this.parentContext.childContext.addOnce(this);
      this.stackLevel = this.parentContext.stackLevel + 1;
    }
  }

  public stackLevel = 0;
  public stackCalls : Array<{
    block: Block,
    port: BlockPort,
  }> = [];

  /**
   * 所属图表
   */
  public graph : BlockGraphDocunment = null;
  /**
   * 图表变量栈
   */
  public graphParamStack : Array<any> = [];
  /**
   * 图表单元栈
   */
  public graphBlockStack : Array<any> = [];
  /**
   * 图表单元端口参数栈
   */
  public graphBlockParamStack : Array<any> = [];

  public childContext : Array<BlockRunContextData> = [];
  public parentContext : BlockRunContextData = null;
}