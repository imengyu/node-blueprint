import type { Node } from "../Flow/Node/Node";
import type { NodePort } from "../Flow/Node/NodePort";
import type { INodeGraphCompiler } from "./NodeGraphCompiler";

export interface INodeCompileBasicSetting {
  basicHelperCode?: string,
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
  code: string|((node: Node, fun: any) => any)
}
export interface INodeCompileCallGenerator {
  type: 'simpleCall'|'immediateStatement'|'branchStatement'|'simpleStatement',
  simpleBinaryImmediate?: string,
  simpleStatementNeedRetuen?: boolean,
  generateSimpleStatement?: (compiler: INodeGraphCompiler, node: Node, params: any) => any,
  generateImmediate?: (compiler: INodeGraphCompiler, node: Node, params: any) => any,
  generateBranch?: (compiler: INodeGraphCompiler, node: Node, isPre: boolean, params: any, branchs: { 
    port: NodePort,
    needNewContext: boolean,
    blockStatement: any,
  }[]) => any,
}
export interface INodeCompileSettings {
  functionGenerator?: INodeCompileFunctionGenerator;
  callGenerator?: INodeCompileCallGenerator;
}