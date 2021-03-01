import { BlockPort } from "../Define/Port";
import { Block } from "../Define/Block";
import { BlockGraphDocunment, BlockDocunment } from "../Define/BlockDocunment";
import BaseBlocks from '../Blocks/BaseBlocks'
import logger from "../../utils/Logger";
import CommonUtils from "../../utils/CommonUtils";

/**
 * 流图运行器
 */
export class BlockRunner {

  /**
   * 队列 FIFO
   */
  public queue : Array<BlockRunContextData> = [];
  /**
   * 获取当前运行上下文
   */
  public currentRunningContext : BlockRunContextData = null;
  /**
   * 获取当前运行的文档
   */
  public currentDocunment : BlockDocunment = null;
  /**
   * 获取运行器状态
   */
  public state : RunnerState = null;
  /**
   * 获取或设置是否单步执行
   */
  public stepMode = false;
  /**
   * 主运行上下文
   */
  public mainContext : BlockRunContextData = null;
  /**
   * 最大调用栈数，默认64
   */
  public maxStackCount = 64;

  public contexts : BlockRunContextData[] = [];

  private loop : any = null;
  private loopCount = 0;

  /**
   * 开始运行
   */
  public start() {
    this.state = 'running';
    if(this.loop != null) 
      clearInterval(this.loop);
    this.loopCount = 0;
    this.loop = setInterval(() => this.mainloop(), 100);
  }
  /**
   * 暂停运行
   */
  public pause() {
    clearInterval(this.loop);
    this.loop = null;
    this.state = 'stopped';
  }
  /**
   * 停止运行
   */
  public stop() {
    this.pause();
    this.clear();
  }
  /**
   * 清空运行数据
   */
  public clear() {
    clearInterval(this.loop);
    if(this.mainContext != null) {
      this.destroyContext(this.mainContext);
      this.mainContext = null;
    }
    if(this.currentDocunment != null) {
      this.endAllBlockRun(this.currentDocunment);
      this.currentDocunment = null;
    }
    if(this.contexts.length > 0) {
      this.contexts.forEach((c) => {
        c.stackCalls.empty();
      });
      this.contexts.empty();
    }
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
    runningContext.currentBlock = null;
    runningContext.currentPort = null;
  }
  private destroyContext(runningContext : BlockRunContextData) {
    if(runningContext.destroyed)
      return;

    runningContext.graphBlockParamStack.empty();
    runningContext.graphParamStack.empty();
    runningContext.childContext.forEach((c) => this.destroyContext(c));
    runningContext.childContext.empty();

    if(runningContext.parentContext != null) {
      runningContext.parentContext.childContext.remove(runningContext);

      this.testContextEnd(runningContext.parentContext);//子移除了，现在再次检查父级是不是被孤立的
      runningContext.parentContext = null;
    }
    runningContext.destroyed = true;

    this.contexts.remove(runningContext);
  }
  private mainloop() {

    if(this.loopCount < Number.MAX_VALUE) this.loopCount++;
    else this.loopCount = 0;

    //回收上下文
    if(this.loopCount % 30 == 0) this.loopForReallocContexts();

    //运行任务队列
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
      if(currentPort.paramType.isExecute()) {
        //激活对应端口
        if(this.currentRunningContext.workType == 'connector') 
          this.excuteContext(this.currentRunningContext, currentPort);
        else {
          currentPort.active(this.currentRunningContext);
          if(this.currentRunningContext != null)
            this.testContextEnd(this.currentRunningContext);
        }
      }
    }else {
      //队列周期已用完，任务将在下一个队列任务中运行
      this.currentRunningContext.loopLifeTime = 5;
      this.queue.push(this.currentRunningContext);
    }

  }

  private excuteContext(runningContext : BlockRunContextData, currentPort : BlockPort) {
    //激活下一个端口
    if(currentPort.direction == 'output' && currentPort.connectedToPort.length > 0) {
      if(this.stepMode) {//单步执行模式
        let nextPort = currentPort.connectedToPort[0].port;
        nextPort.parent.onPortConnectorActive.invoke(nextPort, currentPort.connectedToPort[0].connector);
        this.markInterrupt(runningContext, nextPort, nextPort.parent);
      } else {
        //开始事件
        if(runningContext.loopNotStart) 
          runningContext.loopNotStart = false;
        
        //激活端口
        let nextPort = currentPort.connectedToPort[0].port;
        nextPort.parent.onPortConnectorActive.invoke(nextPort, currentPort.connectedToPort[0].connector);
        nextPort.active(runningContext);
        this.testContextEnd(runningContext);
      }
    }
  }
  private testContextEnd(runningContext : BlockRunContextData) {
    //检查上下文是否已经运行完毕，完毕则销毁对应上下文
    if(!runningContext.loopForceInUse && !this.queue.contains(runningContext)) {
      if(runningContext.childContext.length == 0) //没有子上下文才销毁
        this.destroyContext(runningContext);
    }
  }
  private loopForReallocContexts() {
    this.contexts.forEach(c => this.testContextEnd(c));
  }

  /**
   * 激活下一个连接点
   * @param runningContext 当前运行上下文
   * @param currentPort 当前连接节点
   */
  public callNextConnectedPort(runningContext : BlockRunContextData, currentPort : BlockPort) {
    if(currentPort.paramType.isExecute()) {
      if(runningContext.loopLifeTime > 0) {
        runningContext.loopLifeTime--;
        this.excuteContext(runningContext, currentPort);
      }else {
        runningContext.loopLifeTime = 5;
        this.endRunningContext(runningContext);
        this.queue.push(runningContext);
      }
    }
  }
  /**
   * 触发断点
   * @param currentPort 当断点触发并继续运行后，流将会从该端口继续
   * @param block 断点所在单元
   * @return 如果断点已处理返回，true
   */
  public markInterrupt(runningContext : BlockRunContextData, currentPort : BlockPort, block : Block) : boolean {
    if(currentPort.direction == 'input') {
      if(typeof this.onRunnerBreakPoint == 'function') {
        this.pause();
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
    console.log(this.mainContext.printCallStack(true));
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

    this.contexts.empty();
    this.mainContext = this.push(startBlock.outputPorts['START'], null, 'connector');
    this.mainContext.graph = doc.mainGraph;
    this.currentDocunment = doc;

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
        block.currentRunner = this;
        block.currentRunningContext = runningContext;
        block.stack = runningContext.graphBlockStack.push({
          variables: {}
        }) - 1;
        block.onStartRun.invoke(block);
      });
      graph.connectors.forEach((connector) => {
        connector.paramChangedContext.empty();
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
        if(!port.paramType.isExecute()) {
          if(!(port.paramRefPassing && port.direction == 'input')) {
            port.stack = runningContext.graphBlockParamStack.push(
              CommonUtils.isDefined(port.paramUserSetValue) ? port.paramUserSetValue : port.paramDefaultValue) - 1;
          }else {
            port.stack = -1;
          }
        }
      });
    });

    runningContext.paramStackCreated = true;
  }
  /**
   * 清除图表的运行栈
   * @param runningContext 当前运行上下文
   * @param graph 当前图表
   */
  public destroyGraphStack(runningContext : BlockRunContextData, graph : BlockGraphDocunment) {
    if(runningContext.graph == graph) {
      runningContext.graphBlockParamStack.empty();
      runningContext.paramStackCreated = false;
    }
  }
  /**
   * 结束后回收文档中所有块数据
   */
  public endAllBlockRun(doc : BlockDocunment) {

    let loop = function(graph : BlockGraphDocunment) {
      graph.blocks.forEach((block) => {
        block.currentRunner = null;
        block.currentRunningContext = null;
        block.stack = - 1;
      });

      graph.blockPrepared = false;
      graph.lastRunContext = null;
      graph.children.forEach((g) => loop(g));
    }

    loop(doc.mainGraph);
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

  /**
   * 起始端口
   */
  public startPort : BlockPort = null;
  /**
   * 执行方式
   */
  public workType : RunnerWorkType = 'connector';
  /**
   * 当前正在运行的端口
   */
  public currentPort : BlockPort = null;
  /**
   * 当前正在运行的单元
   */
  public currentBlock : Block = null;
  /**
   * 上一次运行过的端口
   */
  public lastPort : BlockPort = null;
  /**
   * 上一次中断的端口
   */
  public lastBreakPointPort : BlockPort = null;
  /**
   * 当前上下文外围调用的图表单元
   */
  public outerBlock : Block = null;

  /**
   * 所属运行器
   */
  public runner : BlockRunner = null;
  /**
   * 运行生命周期
   */
  public loopLifeTime = 5;
  public loopNotStart = true;
  public loopForceInUse = false;
  /**
   * 获取上下文是否已经被销毁
   */
  public destroyed = false;
  public paramStackCreated = false;


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
    this.runner.contexts.push(this);
    this.startPort = startPort;
    this.currentPort = startPort;
    this.workType = workType;
    this.parentContext = parentContext;

    if(this.parentContext != null) {
      this.parentContext.childContext.addOnce(this);
      this.outerBlock = this.parentContext.outerBlock;
      this.graphParamStack = this.parentContext.graphParamStack;
      this.graphBlockStack = this.parentContext.graphBlockStack;
      this.stackLevel = this.parentContext.stackLevel + 1;
    }
    if(this.stackLevel > this.runner.maxStackCount) {
      logger.error('Stack overflow at level ' + this.stackLevel + '.');
      throw new Error("Stack overflow");
    }
  }

  /**
   * 调用层级
   */
  public stackLevel = 0;
  /**
   * 调用栈
   */
  public stackCalls : Array<{
    block: Block,
    port: BlockPort,
    childContext: BlockRunContextData,
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

  /**
   * 子上下文
   */
  public childContext : Array<BlockRunContextData> = [];
  /**
   * 父上下文
   */
  public parentContext : BlockRunContextData = null;

  /**
   * 获取上级图表的父上下文
   */
  public getUpperParentContext() {
    let context = <BlockRunContextData>this;
    //回到父上下文
    if(context.parentContext.graph != context.graph) 
    //如果当前上下文和父上下文不在一个图表内，则直接回到父上下文
      return context.parentContext;
    else {
      //如果当前上下文和父上下文不在一个图表内，
      //认为是子图表的上下文创建的子上下文，则递归查找父上下文
      while(context != null) {
        if(context.graph != context.parentContext.graph)
          break;
        context = context.parentContext;
      }
      return context;
    }
  }

  /**
   * 打印调用堆栈
   * @param full 是否打印全部的子级调用堆栈
   */
  public printCallStack(full = false) {
    let str = '\nStack count:' + this.stackCalls.length + ' (level ' + this.stackLevel + ')';
    this.stackCalls.forEach((d) => {
      if(d.block!=null)
        str += '\n' + d.block.regData.baseInfo.name + '(' + d.block.uid + ') => ' + d.port.name + '(' + d.port.guid + ')';
      else if(d.childContext != null && full)
        str += '\nChild call: \n' + d.childContext.printCallStack(full);
    });

    if(full) {
      this.childContext.forEach((c) => {
        str += c.printCallStack(full);
      });
    }

    return str;
  }

  public markContexInUse() { this.loopForceInUse = true; }
  public unsetContexInUse() { this.loopForceInUse = false; }
}