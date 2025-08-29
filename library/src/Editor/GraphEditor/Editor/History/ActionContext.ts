import type { NodeGraph } from "@/node-blueprint/Base/Flow/Graph/NodeGraph";
import type { NodeGraphEditorInternalContext } from "../../NodeGraphEditor";
import type { NodeConnectorEditor } from "../Flow/NodeConnectorEditor";
import type { NodeEditor } from "../Flow/NodeEditor";
import type { NodePortEditor } from "../Flow/NodePortEditor";
import { EditorHistoryNodeInfo, EditorHistoryNodeConnectorInfo, EditorHistoryNodePortInfo, EditorHistoryNodeGraphInfo } from "./InfoStorage";

/**
 * 用于可恢复操作的上下文
 */
export class EditorHistoryActionContext {
  private cancel = false;
  private disableException = false;
  private returnData : unknown = null;
  private readonly context: NodeGraphEditorInternalContext;

  public constructor(context: NodeGraphEditorInternalContext) {
    this.context = context;
  }

  /**
   * 获取当前操作是否禁用异常捕获。否则将直接抛出异常至调用方
   */
  isDisableException() {
    return this.disableException;
  }
  /**
   * 获取当前操作在 getTargetParams 阶段是否被取消.
   */
  isCanceled() {
    return this.cancel;
  }
  /**
   * 标志当前操作在 getTargetParams 阶段取消，后续的执行操作不会继续。
   */
  cancelAction() {
    this.cancel = true;;
  }
  /**
   * 设置当前操作禁用异常捕获
   */
  setDisableException() {
    this.disableException = true;;
  }

  /**
   * 设置当前操作的返回值，用于 `beginUndoableAction` 中整体函数的返回值。
   * @param returnData 
   */
  setDoingReturn(returnData: unknown) {
    this.returnData = returnData;
  }
  getExecuteReturn() {
    return this.returnData
  }

  /**
   * 对 `context.historyManager.beginNoUndoableRegion()` 的封装。可传入回调也可单独与 `endNoUndoableRegion` 成对使用。
   * @param cb 不传入回调时，与 `endNoUndoableRegion` 成对使用。传入回调时，回调中自动调用区间。
   */
  beginNoUndoableRegion(cb?: () => void) {
    if (cb) {
      this.context.historyManager.beginNoUndoableRegion();
      cb();
      this.context.historyManager.endNoUndoableRegion();
    } else
      this.context.historyManager.beginNoUndoableRegion();
  }
  /**
   * 与 `beginNoUndoableRegion` 成对使用。
   */
  endNoUndoableRegion() {
    this.context.historyManager.endNoUndoableRegion();
  }

  /**
   * 转换 节点实例 为独立的信息，用于可撤销操作之间的数据传输。
   */
  toNodeInfo(node: NodeEditor) { return new EditorHistoryNodeInfo(this.context, node); }
  /**
   * 转换 连接线实例 为独立的信息，用于可撤销操作之间的数据传输。
   */
  toNodeConnectorInfo(connectior: NodeConnectorEditor) { return new EditorHistoryNodeConnectorInfo(this.context, connectior); }
  /**
   * 转换 节点端口实例 为独立的信息，用于可撤销操作之间的数据传输。
   */
  toNodePortInfo(port: NodePortEditor) { return new EditorHistoryNodePortInfo(this.context, port); }
  /**
   * 转换 节点端口实例 为独立的信息，用于可撤销操作之间的数据传输。
   */
  toNodeGraphInfo(graph: NodeGraph) { return new EditorHistoryNodeGraphInfo(this.context, graph); }
  
  /**
   * 转换 节点实例数组 为独立的信息，用于可撤销操作之间的数据传输。如果输入数组为空，则自动取消当前操作。
   */
  toNodesInfoAndCancelIfEmpty(nodes: NodeEditor[]) { return nodes.map(n => new EditorHistoryNodeInfo(this.context, n)); }
  /**
   * 转换 节点端口数组实例 为独立的信息，用于可撤销操作之间的数据传输。如果输入数组为空，则自动取消当前操作。
   */
  toNodePortsInfoAndCancelIfEmpty(ports: NodePortEditor[]) { return ports.map(n => new EditorHistoryNodePortInfo(this.context, n)); }
  /**
   * 转换 连接线实例数组 为独立的信息，用于可撤销操作之间的数据传输。如果输入数组为空，则自动取消当前操作。
   */
  toNodeConnectorsInfoAndCancelIfEmpty(connectiors: NodeConnectorEditor[]) { return connectiors.map(n => new EditorHistoryNodeConnectorInfo(this.context, n)); }

  fromNodesInfo(info: EditorHistoryNodeInfo[]) { return info.map(i => i.requestInstance()) as NodeEditor[]; }
  fromNodePortsInfo(info: EditorHistoryNodePortInfo[]) { return info.map(i => i.requestInstance()) as NodePortEditor[]; }
  fromNodeConnectorsInfo(info: EditorHistoryNodeConnectorInfo[]) { return info.map(i => i.requestInstance()) as NodeConnectorEditor[]; }
}