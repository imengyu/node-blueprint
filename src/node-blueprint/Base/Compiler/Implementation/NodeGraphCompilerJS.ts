import { ast } from "../Common/AstDef";
import type { NodeDocunment } from "../../Flow/Graph/NodeDocunment";
import type { NodeGraph } from "../../Flow/Graph/NodeGraph";
import type { Node } from "../../Flow/Node/Node";
import type { INodeCompileBasicSetting, INodeCompileFunctionGenerator } from "../NodeCompileSettings";
import type { INodeGraphCompiler } from "../NodeGraphCompiler";

const astm = ast.maker;

/*
* 编译步骤
 0. 写入基础帮助函数与标准库基础
 1. 编译节点所用的基础函数
    按节点上的编译设置筛选所有的需要生成静态函数的节点
    生成其对应的静态函数

    静态函数定义

    function guid(context, ...args) {

    }

    调用上下文定义 context

 2. 编译图表调用

    从起始节点开始遍历
    编译AST树

 3. 从AST树生成最终代码
 
*/

/**
 * 图表编译器调用类
 */
export class NodeGraphCompilerJS implements INodeGraphCompiler {

  private compileCache = new Map<string, NodeDocunmentCompileCache>();
  private target = 'js';
  private settings : INodeCompileBasicSetting = {};

  getTarget(): string {
    return this.target;
  }
  setBasic(data: INodeCompileBasicSetting): void {
    this.settings = data;
  }

  /**
   * 清除编译缓存
   */
  clearCompileCache() {
    this.compileCache.clear();
  }
  /**
   * 编译文档
   */
  compileDocunment(doc: NodeDocunment, dev: boolean) {
    //使用缓存
    const cacheKey = `${doc.uid}:${dev?'dev':''}`;
    const cache = this.compileCache.get(cacheKey);
    const data = { doc, dev };
    const result = this.compileDocunmentInternal(data, cache);
    this.compileCache.set(cacheKey, result);
    return this.compileDocunmentString(data, result);
  }


  /**
   * 拼合字符串
   * @param data 
   * @param cache 
   * @returns 
   */
  private compileDocunmentString(data: NodeDocunmentCompileData, cache: NodeDocunmentCompileCache) {
    let resultString = '';



    return resultString;
  }





  private getNodeCompile(node: Node) {
    return node.define.compile?.[this.target];
  }
  private generateNodeBaseFunction(fun: NodeGraphCompileNodeBasic) : ast.FunctionDeclaration {
    switch (fun.functionGenerator.type) {
      case 'contextNode':
        
        break;
      case 'singleCall':
        return astm.functionDeclaration(
          astm.identifier(fun.name),
          [ 
            astm.identifier('context'),
            ...fun.params.map(name => astm.identifier(name))
          ],
          astm.blockStatement(
            
            astm.rawStatements(fun.code)
          ),
        );
      default:
        throw new Error(`generateNodeBaseFunction: unknown functionGenerator type ${fun.functionGenerator.type}`);
    }
  }

  private compileDocunmentInternal(data: NodeDocunmentCompileData, cache: NodeDocunmentCompileCache|undefined) {
    if (!cache)
      cache = {
        mainUsingNodeBasicFunction: new Map<string, NodeGraphCompileNodeBasic>(),
        mainAst: astm.program(),
      };

    if (this.settings.basicHelperCode)
      cache.mainAst.body.push(...astm.rawStatements(this.settings.basicHelperCode));

    if (data.doc.mainGraph)
      cache.mainGraph = this.compileGraph(data.doc.mainGraph, data, cache.mainGraph, cache);

    for (const [,fun] of cache.mainUsingNodeBasicFunction)
      cache.mainAst.body.push(this.generateNodeBaseFunction(fun));

    return cache;
  }
  private compileGraph(graph: NodeGraph, data: NodeDocunmentCompileData, cache: NodeGraphCompileCache|undefined, topCache: NodeDocunmentCompileCache) {
    if (!cache)
      cache = { children: [] };

    for (let i = 0; i < graph.children.length; i++)
      cache.children[i] = this.compileGraph(graph.children[i], data, cache.children[i], topCache);

    graph.nodes.forEach((node) => {
      if (!topCache.mainUsingNodeBasicFunction.has(node.guid)) {
        const compile = this.getNodeCompile(node);
        if (compile?.functionGenerator) {
          topCache.mainUsingNodeBasicFunction.set(node.guid, {
            name: node.guid.replace(/-/g, ''),
            functionGenerator: compile.functionGenerator,
            params: node.inputPorts.filter(p => !p.paramType.isExecute).map(p => p.name),
            outputParams: node.outputPorts.filter(p => !p.paramType.isExecute).map(p => p.name),
            enteryExecute: node.inputPorts.filter(p => p.paramType.isExecute).map(p => p.name),
            exitExecute: node.outputPorts.filter(p => p.paramType.isExecute).map(p => p.name),
          });
        }
      }
    });

    switch (graph.type) {
      case 'main':
        
        break;
      case 'static':
        
        break;
      case 'function':
        
        break;
      case 'class':
        
        break;
      case 'constructor':
        
        break;
    }

    return cache;
  }
}


interface NodeDocunmentCompileData {
  doc: NodeDocunment, 
  dev: boolean,
}
interface NodeDocunmentCompileCache {
  mainGraph?: NodeGraphCompileCache|undefined;
  mainUsingNodeBasicFunction: Map<string, NodeGraphCompileNodeBasic>;
  mainAst: ast.Program;
}
interface NodeGraphCompileCache {
  children: NodeGraphCompileCache[],

}
interface NodeGraphCompileNodeBasic {
  name: string,
  functionGenerator: INodeCompileFunctionGenerator,
  params: string[],
  outputParams: string[],
  enteryExecute: string[],
  exitExecute: string[],
}