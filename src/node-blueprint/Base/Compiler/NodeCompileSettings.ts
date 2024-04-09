import type { ast } from "./Common/AstDef";



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
  type: 'singleCall'|'contextNode',
  code: string|ast.BlockStatement
}
export interface INodeCompileSettings {
  functionGenerator?: INodeCompileFunctionGenerator;
}