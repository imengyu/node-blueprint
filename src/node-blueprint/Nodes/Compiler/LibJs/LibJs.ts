import type { INodeCompilePackage } from "@/node-blueprint/Base/Compiler/NodeCompileSettings";
import LibBasicHelperCode from "./LibBasic.js?raw";

export const LibJsCompilerData : INodeCompilePackage = {
  target: 'js',
  basic: {
    basicHelperCode: LibBasicHelperCode,
  },
  nodes: {
    '0324C0EC-CE44-05B8-A62D-0ECE0D19DC9F': {
      functionGenerator: {
        type: 'simpleCall',
        code: '_CC_CONNECTOR.begin()',
      },
    },
    '77885802-92C8-569B-1E7F-48938943A549': {
      functionGenerator: {
        type: 'simpleCall',
        code: '_CC_CONNECTOR.exit()',
      },
    },
    'A81899CF-766B-F511-B179-90A81BBB088B': {
      callGenerator: {
        type: 'immediateStatement',
        generate(params) {
          return params[0];
        },
      },
    },
    'EE8345CE-14FB-3CE5-C5CD-30CF3A102DE5': {
      callGenerator: {
        type: 'immediateStatement',
        generate(params) {
          return params[0];
        },
      },
    },
    '90833609-8CF7-2324-A4C0-781344701C06': {
      callGenerator: {
        type: 'immediateStatement',
        generate(params) {
          return params[0];
        },
      },
    },
    '2076EDF9-91D4-5C77-28A1-D6390ECD5BFC': {
      functionGenerator: {
        type: 'simpleCall',
        code: 'return Math.floor(Math.random() * (MAX - MIN)) + MIN',
      },
    },
    '4B6EA737-9702-A383-A268-AADC332038DF': {
      functionGenerator: {
        type: 'simpleCall',
        code: '_DEBUG_CONNECTOR.console(LEVEL,TAG,PRINT)',
      },
    },
  },
}