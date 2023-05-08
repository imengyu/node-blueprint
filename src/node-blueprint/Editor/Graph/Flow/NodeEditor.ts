import { Node, type INodeDefine } from "@/node-blueprint/Base/Flow/Node/Node";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import { ChunkInstance } from "../Cast/ChunkedPanel";
import type { NodeConnectorEditor } from "./NodeConnectorEditor";

/**
 * [仅编辑器] 编辑器使用的节点相关数据类
 */
export class NodeEditor extends Node {

  constructor(define: INodeDefine) {
    super(define);
    this.forceSerializableClassProperties.ports = 'NodePortEditor';
    this.noSerializableProperties.push(
      'mouseConnectingPort',
      'selected',
      'breakpointTriggered',
      'chunkInfo',
      'connectors',
      'lastBlockPos',
      'lastBlockSize',
      'editorHooks',
    );
    this.load(define);
  }

  /**
   * 钩子，仅供编辑器使用
   */
  public editorHooks = {
    callbackUpdateNodeForMoveEnd: null as null|(() => void),
    callbackUpdateRegion: null as null|(() => void),
    callbackOnAddToEditor: null as null|(() => void),
    callbackOnRemoveFromEditor: null as null|(() => void),
    callbackGetRealSize: null as null|(() => Vector2),
    callbackGetCurrentSizeType: null as null|(() => number),
    callbackTwinkle: null as null|((time: number) => void),
  };

  public mouseConnectingPort = false;
  public selected = false;
  public breakpointTriggered = false;
  public chunkInfo = new ChunkInstance(undefined, 'node');
  public connectors = [] as NodeConnectorEditor[];
  public lastBlockPos = new Vector2();
  public lastBlockSize = new Vector2();
  /**
   * 保存块当前位置，以供移动使用
   */
  public saveLastBlockPos() {
    this.lastBlockPos.set(this.position);
  }

  //通用函数
  
  /**
   * 触发闪烁
   * @param time 闪烁时长，毫秒
   */
  public twinkle(time = 1000) {
    this.editorHooks.callbackTwinkle?.(time);
  }
  /**
   * 获取节点真实大小
   */
  public getRealSize() {
    return this.editorHooks.callbackGetRealSize?.() || this.customSize;
  }
  /**
   * 获取单元当前调整大小类型
   * @returns 
   */
  public getGetCurrentSizeTypee() : number  {
    return this.editorHooks.callbackGetCurrentSizeType?.() || 0;
  }
}