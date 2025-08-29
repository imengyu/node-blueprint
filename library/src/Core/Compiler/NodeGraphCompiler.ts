import type { NodeDocunment } from "../Flow/Graph/NodeDocunment";
import { NodeRegistry } from "../Flow/Registry/NodeRegistry";
import { printWarning } from "../Logger/DevLog";
import { Singleton } from "../Singleton/Singleton";
import { NodeGraphCompilerJS } from "./Implementation/JavaScript/NodeGraphCompilerJS";
import type { INodeCompileBasicSetting, INodeCompilePackage } from "./NodeCompileSettings";

const TAG = 'NodeGraphCompiler';

/**
 * 图表编译器定义
 */
export interface INodeGraphCompiler {
  getTarget() : string;
  setBasic(data: INodeCompileBasicSetting) : void;
  buildValue(name: string, value: any): any;
  buildVariableName(name: string): string;

  /**
   * 清除编译缓存
   */
  clearCompileCache(): void;
  /**
   * 编译文档
   */
  compileDocunment(doc: NodeDocunment, dev: boolean): string;
}

/**
 * 图表编译器定义
 */
export interface NodeDocunmentCompileData {
  /**
   * 表示当前正在编译的文档
   */
  doc: NodeDocunment, 
  /**
   * 表示当前是不是调试版本编译
   */
  dev: boolean,
}

/**
 * 图表编译器调用类
 */
export class NodeGraphCompiler extends Singleton {

  constructor() {
    super(TAG);
  }
  static getInstance() {
    return Singleton.getSingletonInstance(TAG) as NodeGraphCompiler;
  }

  private compiler = new Map<string, INodeGraphCompiler>();

  /**
   * 注册指定类型的编译器
   * @param target 类型
   * @param compiler 编译器接口
   * @returns 
   */
  registerCompiler(target: string, compiler: INodeGraphCompiler) {
    if (this.compiler.has(target)) {
      printWarning(TAG, null, "Compiler type " + target + " alreday registered !");
      return;
    }
    this.compiler.set(target, compiler);
  }
  /**
   * 取消注册指定类型的编译器
   * @param target 类型
   */
  unregisterCompiler(target: string) {
    this.compiler.delete(target);
  }
  /**
   * 获取可用的编译器
   */
  getAvailableCompilers() {
    return Array.from(this.compiler.values());
  }

  /**
   * 注册编译包
   * @param packageData 包
   */
  registerCompilePackage(packageData: INodeCompilePackage) {
    const compiler = this.getCompiler(packageData.target);
    const registry = NodeRegistry.getInstance();
    for (const guid in packageData.nodes) {
      const nodeDef = registry.getNodeByGUID(guid);
      if (nodeDef) {
        if (!nodeDef.compile) nodeDef.compile = {};
        nodeDef.compile[packageData.target] = packageData.nodes[guid];
      }
    }
    compiler.setBasic(packageData.basic);
  }

  /**
   * 获取编译器实例
   */
  getCompiler(target: string) {
    if (!this.compiler.has(target))
      throw new Error(`Not found Compiler for target ${target}`);
    return this.compiler.get(target)!;
  }

  /**
   * 清除编译缓存
   */
  clearCompileCache(target: string) {
    this.getCompiler(target).clearCompileCache();
  }

  /**
   * 编译文档
   */
  compileDocunment(doc: NodeDocunment, target: string, dev: boolean) {
    return this.getCompiler(target).compileDocunment(doc, dev);
  }
}

export function registerInternalCompilers() {
  const ins = NodeGraphCompiler.getInstance();
  ins.registerCompiler('js', new NodeGraphCompilerJS())
}

export class NodeGraphCompilerError extends Error {
  constructor(code: number, message: string) {
    super(message);
    this.code = code;
  }

  readonly code: number;
}