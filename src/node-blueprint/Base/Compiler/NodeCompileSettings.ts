import type { Node } from "../Flow/Node/Node";
import type { NodePort } from "../Flow/Node/NodePort";
import type { INodeGraphCompiler, NodeDocunmentCompileData } from "./NodeGraphCompiler";

export interface INodeCompileBasicSetting {
  basicHelperCode?: string,
  basicDebugCode?: string,
}

export interface INodeCompilePackage {
  target: string,
  basic: INodeCompileBasicSetting,
  nodes: {
    [index: string]: INodeCompileSettings;
  },
}

export interface INodeCompileFunctionGenerator {
  type: 'simpleCall'|'contextNode',
  code: string|((data: NodeDocunmentCompileData, node: Node, fun: any) => any)
}
export interface INodeCompileCallGenerator {
  type: 'simpleCall'|'immediateStatement'|'branchStatement'|'simpleStatement',
  simpleBinaryImmediate?: string,
  simpleStatementNeedRetuen?: boolean,
  debugStatemenGenerateBefore?: boolean,
  generateSimpleStatement?: (compiler: INodeGraphCompiler, data: NodeDocunmentCompileData, node: Node, params: any) => any,
  generateImmediate?: (compiler: INodeGraphCompiler, data: NodeDocunmentCompileData, node: Node, params: any) => any,
  generateBranch?: (compiler: INodeGraphCompiler, data: NodeDocunmentCompileData, node: Node, isPre: boolean, params: any, branchs: { 
    port: NodePort,
    needNewContext: boolean,
    asyncContextExecGenerate?: any,
    blockStatement: any,
  }[]) => any,
}
export interface INodeCompileSettings {
  functionGenerator?: INodeCompileFunctionGenerator;
  callGenerator?: INodeCompileCallGenerator;
}