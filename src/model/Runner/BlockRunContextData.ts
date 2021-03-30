import logger from "@/utils/Logger";
import { Block } from "../Define/Block";
import { BlockGraphDocunment } from "../Define/BlockDocunment";
import { BlockPort } from "../Define/Port";
import { BlockRunner, RunnerWorkType } from "./Runner";

/**
 * 运行上下文数据
 */
 export class BlockRunContextData {

  private TAG = '流图上下文';

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
      logger.error(this.TAG, 'Stack overflow at level ' + this.stackLevel + (this.runner.mainContext ? ('.\nStack:\n' + 
        this.runner.mainContext.printCallStack(true)) : '\n[No stack information was found]'));
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
   * 图表单元端口参数索引
   */
  public graphBlockParamIndexs : Array<number> = [];

  /**
   * 图表单元端口参数栈
   */
  public graphBlockParamStack : Array<any> = [];

  /**
   * 栈帧顶部位置（类似esp）
   * 不同于汇报的是。汇编中栈增加是减指针。而这里是加
   */
  public stackPointer = 0;

  /**
   * 参数入栈
   * @param data 数据
   * @returns 返回当前数据栈偏移量
   */
  public pushParam(data: any) {
    this.graphBlockParamStack[this.stackPointer] = data;
    this.stackPointer++;
    if(this.stackPointer > this.runner.maxParamStackCount) {
      logger.error(this.TAG, 'Param stack overflow at level ' + this.stackLevel + '.');
      throw new Error("Param stack overflow");
    }
    return this.stackPointer - 1;
  }
  /**
   * 参数出栈
   * @returns 数据
   */
  public popParam() {
    this.stackPointer--;
    return this.graphBlockParamStack[this.stackPointer];
  }


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
  public printCallStack(full = false, level = 0) {
    let lineSpace = '\n'; for(let i = 0; i < level; i++) lineSpace += ' ';
    let str = '\nStack count:' + this.stackCalls.length + ' (level ' + this.stackLevel + ')';
    this.stackCalls.forEach((d) => {
      if(d.block !== null) {
        let ref = JSON.stringify({
          ref: `${d.block.regData.baseInfo.name}.${d.port.name}`,
          refDoc:`${d.block.currentGraph.docunment.uid}:${d.block.currentGraph.uid}`,
          refBlock:`${d.block.uid}`,
          refPort:`${d.port.guid}`
        });
        str += `${lineSpace}${ref}`
      } else if(d.childContext !== null && full)
        str += `${lineSpace}Child call:${lineSpace}\n${d.childContext.printCallStack(full, level + 1)}`;
    });

    if(full) {
      this.childContext.forEach((c) => {
        str += c.printCallStack(full, level + 1);
      });
    }

    return str;
  }

  /**
   * 设置当前上下文被离线使用，防止其相关信息被回收
   */
  public markContexInUse() { this.loopForceInUse = true; }
  /**
   * 设置当前上下文取消离线使用
   */
  public unsetContexInUse() { this.loopForceInUse = false; }
}