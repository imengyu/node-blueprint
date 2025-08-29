import type { INodeCompileCallGenerator, INodeCompilePackage } from "@/node-blueprint/Base/Compiler/NodeCompileSettings";
import LibBasicHelperCode from "./LibBasic.js?raw";
import LibDebugHelperCode from "./LibDebug.js?raw";
import { builders as b } from "ast-types";

const TypeEntryNode : INodeCompileCallGenerator = {
  type: 'immediateStatement',
  generateImmediate(compiler, data, node, params) {
    return params[0];
  },
};

export const LibJsCompilerData : INodeCompilePackage = {
  target: 'js',
  basic: {
    basicHelperCode: LibBasicHelperCode,
    basicDebugCode: LibDebugHelperCode,
  },
  nodes: {
    '0324C0EC-CE44-05B8-A62D-0ECE0D19DC9F': {
      functionGenerator: {
        type: 'simpleCall',
        code: '_CORE_CONNECTOR.begin()',
      },
    },
    '77885802-92C8-569B-1E7F-48938943A549': {
      functionGenerator: {
        type: 'simpleCall',
        code: '_CORE_CONNECTOR.exit()',
      },
    },
    '522E5C4D-16E1-9D48-1916-19830B6F5B35': {
      functionGenerator: {
        type: 'simpleCall',
        code: "return _CORE_CONNECTOR.platform()",
      },
    },
    '6C01D858-CF4D-D9EF-C18E-DE5DAE400702': {
      callGenerator: {
        type: 'branchStatement',
        generateBranch(_, data, node, isPre, params, branchs) {
          if (isPre) {
            branchs[0].needNewContext = true;
            branchs[0].asyncContextExecGenerate = () => {
              //setTimeout(function () { finishCb() }, time)
              return b.blockStatement([ b.expressionStatement(b.callExpression(
                b.identifier('setTimeout'),
                [ 
                  b.functionExpression(null, [], b.blockStatement([
                    b.expressionStatement(
                      b.callExpression(b.identifier('finishCb'), [])
                    )
                  ])),
                  params[0]
                ]
              )) ])
            };
            return;
          }
          return branchs.map(a => a.blockStatement);
        },
      },
    },
    'A81899CF-766B-F511-B179-90A81BBB088B': {
      callGenerator: TypeEntryNode,
    },
    'EE8345CE-14FB-3CE5-C5CD-30CF3A102DE5': {
      callGenerator: TypeEntryNode,
    },
    '90833609-8CF7-2324-A4C0-781344701C06': {
      callGenerator: TypeEntryNode,
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
    '31CCFD61-0164-015A-04B1-732F0A7D6661': {
      callGenerator: {
        type: 'immediateStatement',
        simpleBinaryImmediate: '+',
      },
    },
    '1FF0A894-C51E-F2ED-AEC8-9156ED490895': {
      callGenerator: {
        type: 'immediateStatement',
        simpleBinaryImmediate: '>',
      },
    },
    'CFFCEB53-B68C-98AE-3363-455BDE728F88': {
      callGenerator: {
        type: 'immediateStatement',
        simpleBinaryImmediate: '<',
      },
    },
    'E8DB1B75-FDBD-1A0A-6D99-F91FAEAB3131': {
      callGenerator: {
        type: 'branchStatement',
        generateBranch(compiler, data, node, isPre, params, branchs) {
          if (isPre)
            return;
          if (branchs[0].blockStatement.body.length > 0 && branchs[1].blockStatement.body.length > 0)
            return [ b.ifStatement(
              params[0], 
              branchs[0].blockStatement, 
              branchs[1].blockStatement
            ) ];
          else if (branchs[0].blockStatement.body.length > 0)
            return [ b.ifStatement(
              params[0], 
              branchs[0].blockStatement
            ) ];
          else 
            return [ b.ifStatement(
              b.unaryExpression('!', params[0], true),
              branchs[1].blockStatement
            ) ];
        },
      },
    },
    '2C75DB8A-1061-ABE0-B7E9-09953C335050': {
      callGenerator: {
        type: 'simpleStatement',
        debugStatemenGenerateBefore: true,
        generateSimpleStatement() {
          return b.breakStatement();
        },
      },
    },
    '949F91AA-D35E-E9E8-8B4B-36EDBD5B1AAD': {
      callGenerator: {
        type: 'branchStatement',
        generateBranch(compiler, data, node, isPre, params, branchs) {
          if (isPre)
            return;
          return [ 
            b.forStatement(
              b.variableDeclaration('let', [ b.variableDeclarator(b.identifier('index'), params[0]) ]),
              b.binaryExpression('<', b.identifier('index'), params[1]),
              b.assignmentExpression('+=', b.identifier('index'), params[2]),
              branchs[1].blockStatement
            ),
            ...branchs[0].blockStatement.body
          ]
        },
      },
    },
    '04414FD9-45A2-980B-813C-2957849BEF47': {
      callGenerator: {
        type: 'immediateStatement',
        generateImmediate: (compiler, data, node) => b.identifier(compiler.buildVariableName(node.options.variable as string)),
      }
    },
    'C9E5A4F2-B7FC-D2C4-724B-DB770A1AFBA6': {
      callGenerator: {
        type: 'simpleStatement',
        simpleStatementNeedRetuen: true,
        generateSimpleStatement: (compiler, data, node, params) => b.assignmentExpression(
          '=',
          b.identifier(compiler.buildVariableName(node.options.variable as string)),
          params[0]
        ),
      }
    },
    '8C7DA763-05C1-61AF-DCD2-174CB6C2C273': {
      callGenerator: {
        type: 'immediateStatement',
        generateImmediate(compiler, data, node, params) {
          return b.binaryExpression('+', b.stringLiteral(''), params[0]);
        },
      },
    },
    '8C7DA763-05C1-61AF-DCD2-174CB6C2C275': {
      callGenerator: {
        type: 'immediateStatement',
        generateImmediate(compiler, data, node, params) {
          return b.callExpression(b.identifier('parseInt'), params);
        },
      },
    },
    '8C7DA763-05C1-61AF-DCD2-174CB6C2C279': {
      callGenerator: {
        type: 'immediateStatement',
        generateImmediate(compiler, data, node, params) {
          return b.callExpression(b.identifier('parseFloat'), params);
        },
      },
    },
    '48F82F9A-F6F2-886F-C8CC-0EB7079D3F42': {
      callGenerator: {
        type: 'immediateStatement',
        generateImmediate(compiler, data, node, params) {
          return b.callExpression(b.identifier('Boolean'), params);
        },
      },
    }
  },
}