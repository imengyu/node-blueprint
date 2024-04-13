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
  code: string|object
}
export interface INodeCompileSettings {
  functionGenerator?: INodeCompileFunctionGenerator;
  callGenerator?: {
    type: 'simpleCall'|'immediateStatement'|'branchStatement',
    generate?: (params: any, branchs?: any[]) => any,
  },
}