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
import { SerializableObject } from "@/node-blueprint/Base/Serializable/SerializableObject";

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
export const NODE_GRAPH_COMPILER_ERROR_NON_SERIALIZABLE = 5;

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
  private getNodeStringInfo(node: Node) {
    return `${node.name} (${node.uid}, ${node.guid})`;
  }
  private getNodePortStringInfo(port: NodePort) {
    return `${port.name} (${port.parent.uid}:${port.guid})`;
  }
  private getNodePortTempKey(port: NodePort) {
    return `${port.parent.uid}:${port.guid}`;
  }

  private replaceGuidSplit(guid: string) {
    return guid.replace(/-/g, '');
  }
  private hashString(str: string, seed = 0) {
    let h1 = 0xdeadbeef ^ seed,
      h2 = 0x41c6ce57 ^ seed;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
  
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  
  buildVariableName(name: string) {
    return `v${this.hashString(name)}`;
  }
  buildValue(name: string, value: any) {
    switch (typeof value) {
      case 'string':
        return b.stringLiteral(value);
      case 'number':
        return b.numericLiteral(value);
      case 'bigint':
        return b.bigIntLiteral('' + value);
      case 'boolean':
        return b.booleanLiteral(value);
      case 'undefined':
        return b.identifier('undefined');
      case 'object': {
        if (value === null)
          return b.identifier('null');
        if (value instanceof SerializableObject)
          return parse(value.save()).program.body[0];
        return parse(JSON.stringify(value)).program.body[0];
      }
      default:
        throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_NON_SERIALIZABLE, `Value ${name} is not serializable`);
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
            b.blockStatement([]), //TODO
          );
        case 'simpleCall': {
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

          let functionBody = typeof fun.functionGenerator.code === 'string' ? 
            parse(fun.functionGenerator.code).program.body[0] : 
            fun.functionGenerator.code(fun.node, fun);
          if (typeof functionBody === 'string')
            functionBody = b.blockStatement([ parse(functionBody).program.body[0] ])  //string code
          if (!n.BlockStatement.check(functionBody))
            functionBody = b.blockStatement([ functionBody ]);

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
                      b.arrayExpression(fun.outputParams.map(p => b.stringLiteral(`${fun.node.uid}:${p}`))),
                      b.functionExpression(null, [], functionBody) 
                    ] 
                  ),
                ),
              ])
            );
          }
        default:
          throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_BAD_PARAM, `unknown functionGenerator.type ${fun.functionGenerator.type}`);
      }
    } catch(e) {
      if (e instanceof NodeGraphCompilerError)
        throw e;
      throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_PARSE_AST, `Failed generate node ${this.getNodeStringInfo(fun.node)}, error: ${(e as Error).stack || e}`);
    }
  }


  private buildNodeParamPortTree(visitTree: NodeGraphCompileTreeVisitedNodesTree, inputParams : ExpressionKind[], port: NodePort) {

    if (port.connectedFromPort[0]?.startPort) {

      const anotherPort = port.connectedFromPort[0].startPort;
      const anotherNode = anotherPort.parent;
      const compileSettings = this.getNodeCompile(anotherNode);
      if (!compileSettings)
        throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_BAD_PARAM, `Node ${this.getNodeStringInfo(anotherNode)} does not have compile settings but in param line.`);

      //被链接的节点如果是立即节点，则进行递归构建表达式，否则，直接从栈中获取数据
      if (
        !visitTree.checkImmediateVisited(anotherNode) //立即节点已访问过，则直接使用缓存
        && compileSettings.callGenerator?.type === 'immediateStatement'
      ) {
        visitTree.pushVisitedImmediate(anotherNode);
        
        const nestInputParams : ExpressionKind[] = [];
        
        //反向递归循环构建参数列表,只循环参数链接
        for (const port2 of anotherNode.inputPorts) {
          if (!port2.paramType.isExecute) 
            this.buildNodeParamPortTree(visitTree, nestInputParams, port2);
        }

        let result : ExpressionKind;
        //简单运算符节点
        const op = compileSettings.callGenerator.simpleBinaryImmediate;
        switch (op) {
          case "==":
          case "!=":
          case "===":
          case "!==" :
          case "<" :
          case "<=" :
          case ">" :
          case ">=" :
          case "<<" :
          case ">>" :
          case ">>>":
          case "+" :
          case "-" :
          case "*" :
          case "/" :
          case "%" :
          case "&" :
          case "|" :
          case "^" :
          case "in" :
          case "instanceof":
          case "**": {
            let lastOp : n.BinaryExpression|undefined;
            let lastParam : ExpressionKind|undefined = nestInputParams.pop();
            while(lastParam) {
              const param = nestInputParams.pop();
              if (param)
                lastOp = b.binaryExpression(op as any, param, lastOp ?? lastParam);
              lastParam = param;
            }
            if (!lastOp)
              throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_BAD_PARAM, `Node ${this.getNodeStringInfo(anotherNode)} failed to generate simpleBinaryImmediate.`);
            result = lastOp;
            break;
          }
          default: {
            //自定义生成
            if (!compileSettings.callGenerator.generateImmediate)
              throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_BAD_PARAM, `Node ${this.getNodeStringInfo(anotherNode)} does not have callGenerator.generate function.`);
            result = compileSettings.callGenerator.generateImmediate(this, anotherNode, nestInputParams);
            break;
          }
        }


        //如果此立即节点有多个链接，则缓存到临时变量中方便下次直接获取
        if (anotherPort.connectedToPort.length > 1) {
          result = b.callExpression(
            b.memberExpression(b.identifier('context'), b.identifier('setTemp')),
            [ 
              b.stringLiteral(this.getNodePortTempKey(anotherPort)) ,
              result
            ]
          );
        }

        inputParams.push(result);

      } else {
        //直接从栈中获取数据 context.getTemp('NODEUID:PORTGUID')
        inputParams.push(
          b.callExpression(
            b.memberExpression(b.identifier('context'), b.identifier('getTemp')),
            [ b.stringLiteral(this.getNodePortTempKey(anotherPort)) ]
          )
        )
      }
    } else {
      //没有链接，使用端口默认值
      inputParams.push(this.buildValue(`Port ${this.getNodePortStringInfo(port)} initialValue`, port.initialValue));
    }
  }
  private buildNodeTree(visitTree: NodeGraphCompileTreeVisitedNodesTree, statement: n.BlockStatement, node: Node) {
    const compileSettings = this.getNodeCompile(node);
    if (!compileSettings) {
      printWarning(TAG, `Node ${this.getNodeStringInfo(node)} does not have compile settings but in call line.`);
      return;
    }

    //防止循环调用。循环调用只能调用有上下文的节点
    if (visitTree.checkNodeVisited(node)) {
      if (compileSettings.functionGenerator?.type !== 'contextNode')
        throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_CYCLICALLY_NO_CONTEXT, `Attempting to cyclically call a node without context ${this.getNodeStringInfo(node)}`);



      return;
    }
    visitTree.pushVisited(node);

    //调用参数
    const inputParams : ExpressionKind[] = [];

    //反向递归循环构建参数列表,只循环参数链接
    for (const port of node.inputPorts) {
      if (!port.paramType.isExecute) 
        this.buildNodeParamPortTree(visitTree, inputParams, port);
    }

    try {

      const outPorts =  node.outputPorts.filter(p => p.paramType.isExecute);

      //构建调用
      switch (compileSettings.callGenerator?.type) {
        default:
        case 'simpleCall': {
          //简单调用，只需要生成调用语句
          inputParams.push(b.identifier('context'));
          if (compileSettings.functionGenerator?.type === 'contextNode') {
            statement.body.push(
              b.variableDeclaration('const', [ b.variableDeclarator(
                b.identifier(`ci${this.replaceGuidSplit(node.guid)}`), 
                b.callExpression(b.identifier(`f${this.replaceGuidSplit(node.guid)}`), inputParams)
              ) ])
            );
          } else {
            statement.body.push(
              b.expressionStatement(
                b.callExpression(b.identifier(`f${this.replaceGuidSplit(node.guid)}`), inputParams)
              )
            );
          }
          //递归构建下一链接的节点,只循环执行链接
          for (const port of outPorts) {
            for (const connector of port.connectedToPort) {
              if (connector.endPort)
                this.buildNodeTree(visitTree, statement, connector.endPort.parent);
            }
          }
          break;
        }
        case 'simpleStatement': {
          //简单语句
          if (!compileSettings.callGenerator.generateSimpleStatement)
            throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_BAD_PARAM, `Node ${node.uid} does not have callGenerator.generateSimpleStatement function.`);

          //生成语句
          let result = compileSettings.callGenerator.generateSimpleStatement(this, node, inputParams);
          //语句存在返回值
          const outParamPorts = node.outputPorts.filter(p => !p.paramType.isExecute);
          if (outParamPorts.length > 0 && compileSettings.callGenerator.simpleStatementNeedRetuen) {
            result = b.expressionStatement(b.callExpression(
              b.memberExpression(b.identifier('context'), b.identifier('makeTemp')), 
              [ b.stringLiteral(this.getNodePortTempKey(outParamPorts[0])), result ]
            ))
          }

          statement.body.push(result);
          
          //递归构建下一链接的节点,只循环执行链接
          for (const port of outPorts) {
            for (const connector of port.connectedToPort) {
              if (connector.endPort)
                this.buildNodeTree(visitTree, statement, connector.endPort.parent);
            }
          }
          break;
        }
        case 'branchStatement': {
          //分支类型，需要生成多个分支语句
          const outBranchs : {
            port: NodePort,
            needNewContext: boolean,
            blockStatement: n.BlockStatement,
          }[] = [];

          if (!compileSettings.callGenerator.generateBranch)
            throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_BAD_PARAM, `Node ${node.uid} does not have callGenerator.generateBranch function.`);

          outPorts.forEach((port) => {
            outBranchs.push({
              port,
              needNewContext: false,
              blockStatement: b.blockStatement([])
            });
          });

          //预先确定信息，确定是否需要新上下文
          compileSettings.callGenerator.generateBranch(this, node, true, inputParams, outBranchs);

          //提前按分支递归构建下一链接的节点,只循环执行链接
          for (const branch of outBranchs) {

            //构建下一链接的节点
            for (const connector of branch.port.connectedToPort) {
              if (connector.endPort)
                this.buildNodeTree(new NodeGraphCompileTreeVisitedNodesTree(visitTree), branch.blockStatement, connector.endPort.parent);
            }
        
            //生成新上下文
            if (branch.needNewContext)
              branch.blockStatement = b.blockStatement([
                b.expressionStatement(b.callExpression(
                  b.memberExpression(b.identifier('context'), b.identifier('makeNestCall')), 
                  [ b.functionExpression(null,[ b.identifier('context'), ], branch.blockStatement) ]
                ))
              ]);
          }

          //节点自行控制每个分支的调用情况
          statement.body.push(
            ...compileSettings.callGenerator.generateBranch(this, node, false, inputParams, outBranchs)
          );
          break;
        }
      }
    } catch(e) {
      if (e instanceof NodeGraphCompilerError)
        throw e;
      throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_PARSE_AST, `Failed generate node ${this.getNodeStringInfo(node)}, error: ${(e as Error).stack || e}`);
    }
  }

  private buildTreeFunction(startNode: Node, cb: (statement: n.BlockStatement) => void) : n.BlockStatement {
    //递归构建函数
    const body = b.blockStatement([]);
    cb(body);
    this.buildNodeTree(new NodeGraphCompileTreeVisitedNodesTree(), body, startNode);
    return b.blockStatement([
      b.expressionStatement(
        b.callExpression(b.identifier('createCallContext'), [
          b.functionExpression(null,[
            b.identifier('context'),
          ], body)
        ])
      )
    ]);
  }

  private buildGraphVariablesFunction(graph: NodeGraph, blockStatement: n.BlockStatement) {
    //构建变量
    for (const variable of graph.variables) {
      blockStatement.body.push(b.variableDeclaration('var', [ b.variableDeclarator(
        b.identifier(this.buildVariableName(variable.name)),
        this.buildValue(`variable ${variable}`, variable.defaultValue),
      ) ]))
    }
  }

  private compileGraph(graph: NodeGraph, data: NodeDocunmentCompileData, cache: NodeGraphCompileCache|undefined, topCache: NodeDocunmentCompileCache) {
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
            name: this.replaceGuidSplit(node.guid),
            node,
            functionGenerator: compile.functionGenerator,
            params: node.inputPorts.filter(p => !p.paramType.isExecute).map(p => p.guid),
            outputParams: node.outputPorts.filter(p => !p.paramType.isExecute).map(p => p.guid),
            enteryExecute: node.inputPorts.filter(p => p.paramType.isExecute).map(p => p.guid),
            exitExecute: node.outputPorts.filter(p => p.paramType.isExecute).map(p => p.guid),
          });
        }
      }
    });

    //不同类型的图表将生成不同类型的函数
    switch (graph.type) {
      //主函数
      case 'main': {
        const entryNode = graph.getOneNodeByGUID(BaseNodes.getScriptBaseNodeIn().guid);
        if (!entryNode)
          throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_NO_ENTRY, 'No main entry node');

        cache.ast.push(b.functionDeclaration(b.identifier('main'), [], 
          this.buildTreeFunction(entryNode, (statement) => { 
            this.buildGraphVariablesFunction(graph, statement);
          })
        ));
        cache.ast.push(b.expressionStatement(b.callExpression(b.identifier('main'), [])));
        topCache.mainAst.body.push(...cache.ast);
        break;
      }
      //函数/构造函数
      case 'constructor':
      case 'static':
      case 'function': {
        const entryNode = graph.getOneNodeByGUID(BaseNodes.getScriptBaseGraphIn().guid);
        if (!entryNode)
          throw new NodeGraphCompilerError(NODE_GRAPH_COMPILER_ERROR_NO_ENTRY, 'No graph entry node');


        switch(graph.type) {
          case 'static': 
            topCache.mainAst.body.push(...cache.ast);
            break;

        }
        break;
      }
      //类
      case 'class':
        
        break;
      //子图表
      case 'subgraph':
        
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
  mainAst: n.Program;
}
interface NodeGraphCompileCache {
  uid: string,
  children: NodeGraphCompileCache[],
  ast: StatementKind[],
}
interface NodeGraphCompileNodeBasic {
  name: string,
  node: Node,
  functionGenerator: INodeCompileFunctionGenerator,
  params: string[],
  outputParams: string[],
  enteryExecute: string[],
  exitExecute: string[],
}
class NodeGraphCompileTreeVisitedNodesTree {
  constructor( parent?: NodeGraphCompileTreeVisitedNodesTree) {
    this.parent = parent;
  }
  parent: NodeGraphCompileTreeVisitedNodesTree|undefined;
  visitedNodes: Node[] = [];
  visitedImmediateNodes: Node[] = [];

  checkNodeVisited(node: Node) : boolean {
    if (this.visitedNodes.includes(node))
      return true;
    return this.parent?.checkNodeVisited(node) ?? false;
  }
  pushVisited(node: Node) {
    this.visitedNodes.push(node);
  }

  checkImmediateVisited(node: Node) : boolean {
    return this.visitedImmediateNodes.includes(node);
  }
  pushVisitedImmediate(node: Node) {
    this.visitedImmediateNodes.push(node);
  }
}