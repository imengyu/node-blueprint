import BaseNodes from "@/node-blueprint/Nodes/Lib/BaseNodes";
import type { NodeDocunment } from "../../../Flow/Graph/NodeDocunment";
import type { NodeGraph } from "../../../Flow/Graph/NodeGraph";
import type { Node } from "../../../Flow/Node/Node";
import type { INodeCompileBasicSetting, INodeCompileFunctionGenerator } from "../../NodeCompileSettings";
import { NodeGraphCompilerError, type INodeGraphCompiler } from "../../NodeGraphCompiler";
import { printWarning } from "@/node-blueprint/Base/Logger/DevLog";
import { parse, print } from "recast";
import { namedTypes as n, builders as b } from "ast-types";
import type { ExpressionKind, StatementKind } from "ast-types/lib/gen/kinds";
import type { NodePort } from "@/node-blueprint/Base/Flow/Node/NodePort";

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

export const NODE_GRAPH_COMPILER_ERROR_BAD_PARAM = 1;
export const NODE_GRAPH_COMPILER_ERROR_NO_ENTRY = 2;
export const NODE_GRAPH_COMPILER_ERROR_PARSE_AST = 3;
export const NODE_GRAPH_COMPILER_ERROR_CYCLICALLY_NO_CONTEXT = 4;

const TAG = 'NodeGraphCompilerJS';

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
    return print(cache.mainAst).code;
  }

  private getNodeCompile(node: Node) {
    return node.define.compile?.[this.target];
  }
  private generateNodeBaseFunction(fun: NodeGraphCompileNodeBasic) : n.FunctionDeclaration {
    try {
      switch (fun.functionGenerator.type) {
        case 'contextNode':
          /**
           * 有点无上下文
           */
          return b.functionDeclaration(
            b.identifier(`c${fun.name}`),
            [ 
              b.identifier('context'),
              ...fun.params.map(name => b.identifier(name))
            ],
            b.blockStatement([]),
          );
        case 'simpleCall':
          /**
           * 简单调用，节点无上下文，只有单一输入输出执行
           * 
           * function r(context, MIN, MAX) {
           *   context.makeSimpleCall(() => {
           *     return Math.floor(Math.random() * (MAX - MIN)) + MIN
           *   });
           * }
           */

          if (typeof fun.functionGenerator.code === 'object' && !n.BlockStatement.check(fun.functionGenerator.code))
            throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_BAD_PARAM, `functionGenerator.code need string type or BlockStatement type`);

          return b.functionDeclaration(
            b.identifier(`f${fun.name}`),
            [ 
              b.identifier('context'),
              ...fun.params.map(name => b.identifier(name))
            ],
            b.blockStatement([
              b.expressionStatement(
                b.callExpression(
                  b.memberExpression(b.identifier('context'), b.identifier('makeSimpleCall')),
                  [
                    b.arrayExpression(fun.outputParams.map(p => b.stringLiteral(`${fun.uid}:${p}`))),
                    b.arrowFunctionExpression([],
                      typeof fun.functionGenerator.code === 'string' ? 
                        b.blockStatement([ parse(fun.functionGenerator.code).program.body[0] ]) :  //string code
                        fun.functionGenerator.code as n.BlockStatement //Prased ast
                    ) 
                  ] 
                ),
              ),
            ])
            
          );
        default:
          throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_BAD_PARAM, `unknown functionGenerator.type ${fun.functionGenerator.type}`);
      }
    } catch(e) {
      if (e instanceof NodeGraphCompilerError)
        throw e;
      throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_PARSE_AST, `Failed generate node ${fun.name}, error: ${(e as Error).stack || e}`);
    }
  }

  private compileDocunmentInternal(data: NodeDocunmentCompileData, cache: NodeDocunmentCompileCache|undefined) {
    if (!cache)
      cache = {
        mainUsingNodeBasicFunction: new Map<string, NodeGraphCompileNodeBasic>(),
        mainAst: b.program([]),
      };

    if (this.settings.basicHelperCode)
      cache.mainAst.body.push(...parse(this.settings.basicHelperCode).program.body);

    if (data.doc.mainGraph)
      cache.mainGraph = this.compileGraph(data.doc.mainGraph, data, cache.mainGraph, cache);

    for (const [,fun] of cache.mainUsingNodeBasicFunction)
      cache.mainAst.body.push(this.generateNodeBaseFunction(fun));

    return cache;
  }
  private compileGraph(graph: NodeGraph, data: NodeDocunmentCompileData, cache: NodeGraphCompileCache|undefined, topCache: NodeDocunmentCompileCache) {
    const that = this;
    
    if (!cache)
      cache = {
        uid: graph.uid,
        ast: [],
        children: [] 
      };
    cache.ast.splice(0);

    //递归构建子集
    for (let i = 0; i < graph.children.length; i++)
      cache.children[i] = this.compileGraph(graph.children[i], data, cache.children[i], topCache);

    //追加所有使用的节点基础库至主图中
    graph.nodes.forEach((node) => {
      if (!topCache.mainUsingNodeBasicFunction.has(node.guid)) {
        const compile = this.getNodeCompile(node);
        if (compile?.functionGenerator) {
          topCache.mainUsingNodeBasicFunction.set(node.guid, {
            name: replaceGuidSplit(node.guid),
            uid: node.uid,
            functionGenerator: compile.functionGenerator,
            params: node.inputPorts.filter(p => !p.paramType.isExecute).map(p => p.guid),
            outputParams: node.outputPorts.filter(p => !p.paramType.isExecute).map(p => p.guid),
            enteryExecute: node.inputPorts.filter(p => p.paramType.isExecute).map(p => p.guid),
            exitExecute: node.outputPorts.filter(p => p.paramType.isExecute).map(p => p.guid),
          });
        }
      }
    });

    //递归构建函数
    function buildTreeFunction(startNode: Node) : n.BlockStatement {
      const visitedNodes : Node[] = [];

      function buildNodeParamPortTree(inputParams : ExpressionKind[], port: NodePort) {

        if (port.connectedFromPort[0]?.startPort) {
  
          const anotherPort = port.connectedFromPort[0].startPort;
          const anotherNode = anotherPort.parent;
          const compileSettings = that.getNodeCompile(anotherNode);
          if (!compileSettings)
            throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_BAD_PARAM, `Node ${anotherNode.uid} does not have compile settings but in param line.`);

          //被链接的节点如果是立即节点，则进行递归构建表达式，否则，直接从栈中获取数据
          if (compileSettings.callGenerator?.type === 'immediateStatement') {
            const nestInputParams : ExpressionKind[] = [];
            
            if (!compileSettings.callGenerator.generate)
              throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_BAD_PARAM, `Node ${anotherNode.uid} does not have callGenerator.generate function.`);

            //反向递归循环构建参数列表,只循环参数链接
            for (const port2 of anotherNode.inputPorts) {
              if (!port2.paramType.isExecute) 
                buildNodeParamPortTree(nestInputParams, port2);
            }

            inputParams.push(compileSettings.callGenerator.generate(nestInputParams));
          } else {
            //直接从栈中获取数据
            //context.getTemp('NODEUID:PORTGUID')
            inputParams.push(
              b.callExpression(
                b.memberExpression(b.identifier('context'), b.identifier('getTemp')),
                [ b.identifier(`${anotherNode.uid}:${anotherPort.guid}`) ]
              )
            )
          }
        } else {
          //没有链接，使用端口默认值
          switch (typeof port.initialValue) {
            case 'string':
              inputParams.push(b.stringLiteral(port.initialValue));
            break;
            case 'number':
              inputParams.push(b.numericLiteral(port.initialValue));
              break;
            case 'bigint':
              inputParams.push(b.bigIntLiteral('' + port.initialValue));
              break;
            case 'boolean':
              inputParams.push(b.booleanLiteral(port.initialValue));
              break;
            default:
              break;
          }

        }

      }
      function buildNodeTree(statement: n.BlockStatement, node: Node) {
        const compileSettings = that.getNodeCompile(node);
        if (!compileSettings) {
          printWarning(TAG, `Node ${node.uid} does not have compile settings but in call line.`);
          return;
        }
  
        if (visitedNodes.includes(node)) {
          if (compileSettings.functionGenerator?.type !== 'contextNode')
            throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_CYCLICALLY_NO_CONTEXT, `Attempting to cyclically call a node without context ${node.uid}`);
  
  
  
          return;
        }
        visitedNodes.push(node);
  
        const inputParams : ExpressionKind[] = [];
  
        //反向递归循环构建参数列表,只循环参数链接
        for (const port of node.inputPorts) {
          if (!port.paramType.isExecute) 
            buildNodeParamPortTree(inputParams, port);
        }
  
        //构建调用
        switch (compileSettings.callGenerator?.type) {
          default:
          case 'simpleCall': {
            if (compileSettings.functionGenerator?.type === 'contextNode') {
  
            } else {
              statement.body.push(
                b.expressionStatement(
                  b.callExpression(b.identifier(`f${replaceGuidSplit(node.guid)}`), inputParams)
                )
              )
            }
            break;
          }
          case 'branchStatement': {
  
            break;
          }
        }
  
  
        //递归构建下一链接的节点,只循环执行链接
        for (const port of node.outputPorts) {
          for (const connector of port.connectedToPort) {
            if (port.paramType.isExecute && connector.endPort)
              buildNodeTree(statement, connector.endPort.parent);
          }
        }
      }

      const root = b.blockStatement([]);
      buildNodeTree(root, startNode);
      return root;
    }

    //不同类型的图表将生成不同类型的函数
    switch (graph.type) {
      //主函数
      case 'main': {
        const entryNode = graph.getOneNodeByGUID(BaseNodes.getScriptBaseNodeIn().guid);
        if (!entryNode)
          throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_NO_ENTRY, 'No main entry node');
        cache.ast.push(b.functionDeclaration(b.identifier('main'), [], buildTreeFunction(entryNode)));
        cache.ast.push(b.expressionStatement(b.callExpression(b.identifier('main'), [])));
        topCache.mainAst.body.push(...cache.ast);
        break;
      }
      //函数
      case 'static':
      case 'function': {
        const entryNode = graph.getOneNodeByGUID(BaseNodes.getScriptBaseGraphIn().guid);
        if (!entryNode)
          throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_NO_ENTRY, 'No graph entry node');


        topCache.mainAst.body.push(...cache.ast);
        break;
      }
      //类
      case 'class':
        
        break;
      //构造函数
      case 'constructor':
        
        break;
      //子图表
      case 'subgraph':
        
        break;
    }

    return cache;
  }
}

function replaceGuidSplit(guid: string) {
  return guid.replace(/-/g, '');
}

interface NodeDocunmentCompileData {
  doc: NodeDocunment, 
  dev: boolean,
}
interface NodeDocunmentCompileCache {
  mainGraph?: NodeGraphCompileCache|undefined;
  mainUsingNodeBasicFunction: Map<string, NodeGraphCompileNodeBasic>;
  mainAst: n.Program;
}
interface NodeGraphCompileCache {
  uid: string,
  children: NodeGraphCompileCache[],
  ast: StatementKind[],
}
interface NodeGraphCompileNodeBasic {
  name: string,
  uid: string,
  functionGenerator: INodeCompileFunctionGenerator,
  params: string[],
  outputParams: string[],
  enteryExecute: string[],
  exitExecute: string[],
}