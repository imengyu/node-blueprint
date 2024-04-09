import { parse } from "recast";

export namespace ast {

  export interface Program {
    type: 'Program',
    sourceType: string,
    body: StatementListItem[],
  }

  export interface Identifier {
    type: 'Identifier',
    name: string,
  }
  export interface Literal {
    type: 'Literal',
    value: string,
  }

  //Statements

  export type Statement = BlockStatement | BreakStatement | ContinueStatement |
      DebuggerStatement | DoWhileStatement | EmptyStatement |
      ExpressionStatement | ForStatement | ForInStatement |
      ForOfStatement | FunctionDeclaration | IfStatement |
      LabeledStatement | ReturnStatement | SwitchStatement |
      ThrowStatement | TryStatement | VariableDeclaration |
      WhileStatement;

  export interface EmptyStatement {
    type: 'EmptyStatement',
  }
  export interface ExpressionStatement {
    type: 'ExpressionStatement',
    expression: Expression,
    directive?: string,
  }

  /**
   * A series of statements enclosed by a pair of curly braces form a block statement:
   */
  export interface BlockStatement {
    type: 'BlockStatement',
    body: StatementListItem[],
  }

  export interface SwitchStatement {
    type: 'SwitchStatement',
    discriminant: Expression,
    cases: SwitchCase[],
  }
  export interface SwitchCase {
    type: 'SwitchCase',
    test: Expression | null,
    consequent: Statement[],
  }
  export interface ThrowStatement {
    type: 'ThrowStatement',
    argument: Expression,
  }
  export interface TryStatement {
    type: 'TryStatement',
    block: BlockStatement,
    handler: CatchClause | null,
    finalizer: BlockStatement | null,
  }
  export interface LabeledStatement {
    type: 'LabeledStatement',
    label: Identifier,
    body: Statement,
  }
  export interface CatchClause {
    type: 'CatchClause',
    param: Identifier | BindingPattern,
    body: BlockStatement,
  }
  export interface ReturnStatement {
    type: 'ReturnStatement',
    argument: Expression | null,
  }
  export interface IfStatement {
    type: 'IfStatement',
    test: Expression,
    consequent: Statement,
    alternate?: Statement,
  }
  export interface BreakStatement {
    type: 'BreakStatement',
    label: Identifier | null,
  }
  export interface ContinueStatement {
    type: 'ContinueStatement',
    label: Identifier | null,
  }
  export interface DebuggerStatement {
    type: 'DebuggerStatement',
  }
  export interface DoWhileStatement {
    type: 'DoWhileStatement',
    body: Statement,
    test: Expression,
  }
  export interface ForStatement {
    type: 'ForStatement',
    init: Expression | VariableDeclaration | null,
    test: Expression | null,
    update: Expression | null,
    body: Statement,
  }
  export interface ForInStatement {
    type: 'ForInStatement',
    left: Expression,
    right: Expression,
    body: Statement,
    each: false,
  }
  export interface ForOfStatement {
    type: 'ForOfStatement',
    left: Expression,
    right: Expression,
    body: Statement,
  }
  export interface WhileStatement {
    type: 'WhileStatement',
    test: Expression,
    body: Statement,
  }

  //Declaration

  export type Declaration = ClassDeclaration | FunctionDeclaration |  VariableDeclaration;
  export type StatementListItem = Declaration | Statement;
  export type FunctionParameter = AssignmentPattern | Identifier | BindingPattern;

  export interface ClassDeclaration {
    type: 'ClassDeclaration',
    id: Identifier | null,
    superClass: Identifier | null,
    body: ClassBody,
  }
  export interface FunctionDeclaration {
    type: 'FunctionDeclaration',
    id: Identifier | null,
    params: FunctionParameter[],
    body: BlockStatement,
    generator: boolean,
    async: boolean,
    expression: false,
  }
  export interface VariableDeclarator {
    type: 'VariableDeclarator',
    id: Identifier | BindingPattern,
    init: Expression | null,
  }
  export interface VariableDeclaration {
    type: 'VariableDeclaration',
    declarations: VariableDeclarator[],
    kind: string,
  }

  export type BindingPattern = ArrayPattern | ObjectPattern;

  //Expressions

  export type Expression = ThisExpression | Identifier | Literal |
      ArrayExpression | ObjectExpression | FunctionExpression | ArrowFunctionExpression | ClassExpression |
      MemberExpression | Super | MetaProperty |
      NewExpression | CallExpression | UpdateExpression | AwaitExpression | UnaryExpression |
      BinaryExpression | LogicalExpression | ConditionalExpression |
      YieldExpression | AssignmentExpression | SequenceExpression;

  export interface ArrayPattern {
      type: 'ArrayPattern',
      elements: ArrayPatternElement[],
  }

  export type ArgumentListElement = Expression | SpreadElement;
  export type ArrayExpressionElement = Expression | SpreadElement;
  export type ArrayPatternElement = AssignmentPattern | Identifier | BindingPattern | RestElement | null;

  export interface RestElement {
      type: 'RestElement',
      argument: Identifier | BindingPattern,
  }
  export interface AssignmentPattern {
      type: 'AssignmentPattern',
      left: Identifier | BindingPattern,
      right: Expression,
  }
  export interface ObjectPattern {
      type: 'ObjectPattern',
      properties: Property[],
  }
  export interface ThisExpression {
      type: 'ThisExpression',
  }
  export interface ArrayExpression {
      type: 'ArrayExpression',
      elements: ArrayExpressionElement[],
  }
  export interface ObjectExpression {
      type: 'ObjectExpression',
      properties: Property[],
  }
  export interface Property {
      type: 'Property',
      key: Expression,
      computed: boolean,
      value: Expression | null,
      kind: 'get' | 'set' | 'init',
      method: false,
      shorthand: boolean,
  }
  export interface FunctionExpression {
      type: 'FunctionExpression',
      id: Identifier | null,
      params: FunctionParameter[],
      body: BlockStatement,
      generator: boolean,
      async: boolean,
      expression: boolean,
  }
  export interface ArrowFunctionExpression {
      type: 'ArrowFunctionExpression',
      id: Identifier | null,
      params: FunctionParameter[],
      body: BlockStatement | Expression,
      generator: boolean,
      async: boolean,
      expression: false,
  }
  export interface ClassExpression {
      type: 'ClassExpression',
      id: Identifier | null,
      superClass: Identifier | null,
      body: ClassBody,
  }
  export interface ClassBody {
      type: 'ClassBody',
      body: MethodDefinition[],
  }
  export interface MethodDefinition {
      type: 'MethodDefinition',
      key: Expression | null,
      computed: boolean,
      value: FunctionExpression | null,
      kind: 'method' | 'constructor',
      static: boolean,
  }
  export interface MemberExpression {
      type: 'MemberExpression',
      computed: boolean,
      object: Expression,
      property: Expression,
  }
  export interface Super {
      type: 'Super',
  }
  export interface MetaProperty {
      type: 'MetaProperty',
      meta: Identifier,
      property: Identifier,
  }
  export interface CallExpression {
      type: 'CallExpression',
      callee: Expression,
      arguments: ArgumentListElement[],
  }
  export interface NewExpression {
      type: 'NewExpression',
      callee: Expression,
      arguments: ArgumentListElement[],
  }
  export interface SpreadElement {
      type: 'SpreadElement',
      argument: Expression,
  }
  export interface UpdateExpression {
      type: 'UpdateExpression',
      operator: '++' | '--',
      argument: Expression,
      prefix: boolean,
  }
  export interface AwaitExpression {
      type: 'AwaitExpression',
      argument: Expression,
  }
  export interface UnaryExpression {
      type: 'UnaryExpression',
      operator: '+' | '-' | '~' | '!' | 'delete' | 'void' | 'typeof',
      argument: Expression,
      prefix: true,
  }
  export interface BinaryExpression {
      type: 'BinaryExpression',
      operator: 'instanceof' | 'in' | '+' | '-' | '*' | '/' | '%' | '**' |
          '|' | '^' | '&' | '==' | '!=' | '===' | '!==' |
          '<' | '>' | '<=' | '<<' | '>>' | '>>>',
      left: Expression,
      right: Expression,
  }
  export interface LogicalExpression {
      type: 'LogicalExpression',
      operator: '||' | '&&',
      left: Expression,
      right: Expression,
  }
  export interface ConditionalExpression {
      type: 'ConditionalExpression',
      test: Expression,
      consequent: Expression,
      alternate: Expression,
  }
  export interface YieldExpression {
      type: 'YieldExpression',
      argument: Expression | null,
      delegate: boolean,
  }
  export interface AssignmentExpression {
      type: 'AssignmentExpression',
      operator: '=' | '*=' | '**=' | '/=' | '%=' | '+=' | '-=' |
          '<<=' | '>>=' | '>>>=' | '&=' | '^=' | '|=',
      left: Expression,
      right: Expression,
  }
  export interface SequenceExpression {
      type: 'SequenceExpression',
      expressions: Expression[],
  }


  export const maker = {
    program(sourceType?: string, body?: StatementListItem[]) : Program {
      return {
        type: 'Program',
        sourceType: sourceType ?? 'script',
        body: body ?? [],
      }
    },
    functionDeclaration(
      id: Identifier | null, 
      params: FunctionParameter[],
      body: BlockStatement,
      generator = false,
      async = false,
    ) : FunctionDeclaration {
      return {
        type: 'FunctionDeclaration',
        id,
        params,
        body,
        generator,
        async,
        expression: false,
      }
    },
    blockStatement(body?: StatementListItem[]) : BlockStatement {
      return {
        type: 'BlockStatement',
        body: body ?? [],
      }
    },
    rawStatements(body: string) : StatementListItem[] {
      return parse(body).program.body;
    },
    identifier(name: string) : Identifier {
      return {
        type: 'Identifier',
        name,
      }
    },
    literal(value: string) : Literal {
      return {
        type: 'Literal',
        value,
      }
    },
    
  }

}