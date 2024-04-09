import type { INodeCompilePackage } from "@/node-blueprint/Base/Compiler/NodeCompileSettings";
import LibBasicHelperCode from "./LibBasic.js?raw";

export const LibJsCompilerData : INodeCompilePackage = {
  target: 'js',
  basic: {
    basicHelperCode: LibBasicHelperCode,
  },
  nodes: {
    '2076EDF9-91D4-5C77-28A1-D6390ECD5BFC': {
      functionGenerator: {
        type: 'singleCall',
        code: 'return Math.floor(Math.random() * (MAX - MIN)) + MIN',
      },
    },
  },
}