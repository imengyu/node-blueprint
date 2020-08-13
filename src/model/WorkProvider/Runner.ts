import { BlockPort } from "../Define/Port";
import { Block } from "../Define/Block";
import { ConnectorEditor } from "../Editor/ConnectorEditor";

/**
 * 流图运行器
 */
export class BlockRunner {

  /**
   * 队列 FIFO
   */
  public queue : Array<BlockRunLoopData> = [];
  /**
   * 当前运行上下文
   */
  public currentRunningContext : BlockRunLoopData = null;
  /**
   * 运行器状态
   */
  public state : RunnerState = null;
  /**
   * 获取或设置是否单步执行
   */
  public stepMode = null;

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
    this.queue = [];
    this.loop = null;
    this.state = 'stopped';
    this.currentRunningContext = null;
  }
  /**
   * 向队列末尾添加一个任务
   * @param startPort 起始节点
   * @param workType 执行方式
   */
  public push(startPort : BlockPort, workType : RunnerWorkType = 'connector') {
    return this.queue.push(new BlockRunLoopData(this, startPort, workType));
  }

  private shift() {
    if(this.queue.length > 0)
      return this.queue.shift(); 
    return null;
  }
  private endRunningContext(runningContext : BlockRunLoopData) {
    if(runningContext.currentBlock != null) {
      runningContext.currentBlock.currentRunningContext = null;
      runningContext.currentBlock = null;
    }
    runningContext.currentPort = null;
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
      this.queue.push(new BlockRunLoopData(this, currentPort));
    }

  }

  /**
   * 激活下一个连接点
   * @param runningContext 当前运行上下文
   * @param currentPort 当前连接节点
   */
  public callNextConnectedPort(runningContext : BlockRunLoopData, currentPort : BlockPort) {
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
        this.queue.push(new BlockRunLoopData(this, currentPort));
      }
    }
  }
  /**
   * 触发断点
   * @param block 断点所在块
   * @return 如果断点已处理返回，true
   */
  public markInterrupt(runningContext : BlockRunLoopData, currentPort : BlockPort, block : Block) : boolean {
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
  public notifyEnd() {
    if(typeof this.onRunnerEnd == 'function') 
      this.onRunnerEnd();
    this.stop();
  }

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
export type RunnerWorkType = 'connector'|'activator';

/**
 * 运行上下文数据
 */
export class BlockRunLoopData {

  public startPort : BlockPort = null;
  public currentPort : BlockPort = null;
  public currentBlock : Block = null;
  public lastPort : BlockPort = null;
  public lastBreakPointPort : BlockPort = null;

  public runner : BlockRunner = null;
  public loopLifeTime = 5;
  public workType : RunnerWorkType = 'connector';

  public constructor(runner : BlockRunner, startPort : BlockPort, workType : RunnerWorkType = 'connector') {
    this.runner = runner;
    this.startPort = startPort;
    this.currentPort = startPort;
    this.workType = workType;
  }
}