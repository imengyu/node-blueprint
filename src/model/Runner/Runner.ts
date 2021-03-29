import { BlockPort } from "../Define/Port";
import { Block } from "../Define/Block";
import { BlockGraphDocunment, BlockDocunment } from "../Define/BlockDocunment";
import BaseBlocks from '../Blocks/BaseBlocks'
import logger from "../../utils/Logger";
import { BlockRunContextData } from "./BlockRunContextData";
import CommonUtils from "@/utils/CommonUtils";
import BlockServiceInstance from "@/sevices/BlockService";

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
  /**
   * 最大参数栈数，默认1024
   */
  public maxParamStackCount = 1024;

  /**
   * 上下文
   */
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

    if(this.loopCount < 0xffff) this.loopCount++;
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
    if(runningContext.parentContext != null
      && !runningContext.loopForceInUse 
      && !this.queue.contains(runningContext)
      && runningContext.childContext.length == 0) //没有子上下文才销毁
        this.destroyContext(runningContext);
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
    if(currentPort == null || currentPort.direction == 'input') {
      if(typeof this.onRunnerBreakPoint == 'function') {
        this.pause();
        this.onRunnerBreakPoint(currentPort, block);

        if(currentPort) {
          //断点已触发，现在修改任务至下个节点
          runningContext.currentPort = currentPort;
          runningContext.workType = 'activator';
          this.queue.push(runningContext);
        } 
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
    
    logger.log("流图运行器", this.mainContext.printCallStack(true));
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
    runningContext.graphBlockParamIndexs.empty();
    runningContext.paramStackCreated = true;

    graph.blocks.forEach((block) => {
      block.allPorts.forEach((port) => {
        if(!port.paramType.isExecute()) {
          if(port.paramStatic) 
            port.stack = -2;
          else if(port.paramRefPassing && port.direction == 'input') 
            port.stack = -1;
          else 
            port.stack = runningContext.graphBlockParamIndexs.push(-1) - 1;
        }
      });
    });
  }

  private prepareChildStack(context : BlockRunContextData, parentContext : BlockRunContextData) {
    //将父级所有已经链接的出端口保存即时数据至子上下文中进行备用
    parentContext.graph.blocks.forEach((block) => {
      block.allPorts.forEach((port) => {
        if(!port.paramType.isExecute() && port.stack >= 0) {
          if(!port.paramRefPassing && port.direction === 'output' && port.isConnected()) {
            context.graphBlockParamIndexs[port.stack] = context.pushParam(port.getValueCached(parentContext));
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
      runningContext.graphBlockParamIndexs.empty();
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

  public activeInputPort(runningContext: BlockRunContextData, port: BlockPort) {
    let block = port.parent;

    if(!CommonUtils.isDefinedAndNotNull(runningContext)) {
      logger.error(port.getName(), 'activeInputPort: Cannot execute port because runningContext was not provided.');
      return;
    }

    //断点触发
    if(block.breakpoint == 'enable' && runningContext.lastBreakPointPort != port) {
      if(runningContext.runner.markInterrupt(runningContext, port, block))
        return;
    }

    runningContext.lastPort = port;
    runningContext.currentBlock = block;

    //判断平台
    if(!block.isPlatformSupport) {
      block.throwError(`单元不支持当前平台 ${BlockServiceInstance.getCurrentPlatform()}\n` +
      `它支持的平台有：${block.regData.supportPlatform.join('/')}。\n您可能需要在运行之前判断当前平台。`, port, 'error');
      return;
    }

    //环路检测
    if(block.currentRunningContext === runningContext && !port.forceNoCycleDetection) {
      block.throwError('运行栈上存在环路：层级' + runningContext.stackLevel, port, 'error', true);
      return;
    }

    //入栈
    block.blockCurrentCreateNewContext = false;
    block.pushBlockStack(runningContext, port);
    //调用
    block.enterBlock(port, runningContext);
    block.onPortExecuteIn.invoke(block, port);
    //出栈
    block.popBlockStack(runningContext);
  }
  public activeOutputPortInNewContext(runningContext: BlockRunContextData, port: BlockPort) {
    let block = port.parent;
    if(port.direction !== 'output') {
      logger.error(port.getName(),'activeOutputPortInNewContext: You try to execute port that is not a output port.');
      return;
    }
      
    //新建上下文
    let context = block.currentRunner.push(port, runningContext, 'connector');

    //准备子上下文
    this.prepareGraphStack(context, runningContext.graph);
    this.prepareChildStack(context, runningContext);

    block.blockCurrentCreateNewContext = true;
  }
  public activeOutputPort(runningContext: BlockRunContextData, port: BlockPort) {
    if(port.executeInNewContext && !CommonUtils.isDefinedAndNotNull(runningContext)) 
      port.activeInNewContext();
    else {
      if(!CommonUtils.isDefinedAndNotNull(runningContext)) {
        logger.error(port.getName(),'activeOutputPort: Cannot execute port because runningContext was not provided.');
        return;
      }

      port.parent.leaveBlock(runningContext);

      runningContext.lastPort = port;
      runningContext.currentBlock = null;
      runningContext.runner.callNextConnectedPort(runningContext, port);
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