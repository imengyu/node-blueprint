import { NodeEditor } from "../Flow/NodeEditor";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import type { NodePortEditor } from "../Flow/NodePortEditor";
import type { INodeDefine, Node, NodeBreakPoint } from "@/node-blueprint/Base/Flow/Node/Node";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import type { NodeConnector } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import type { NodePort } from "@/node-blueprint/Base/Flow/Node/NodePort";

export interface NodeEditorUserControllerContext {
  /**
   * 用户添加单元
   * @param define 单元定义
   * @param addNodeInPos 添加之后设置单元的位置，如果不提供，则默认设置到视口中心位置
   */
  userAddNode(define: INodeDefine, addNodeInPos?: Vector2|undefined) : void;
  /**
   * 用户删除单元
   * @param node 
   * @returns 
   */
  userDeleteNode(node: Node) : void;

  /**
   * 删除选中连接线
   */
  deleteSelectedConnectors() : void;
  /**
   * 删除选中的单元
   */
  deleteSelectedNodes() : void;
  /**
   * 删除选中单元的连接
   */
  unConnectSelectedNodeConnectors() : void;
  /**
   * 设置选中单元断点状态
   */
  setSelectedNodeBreakpointState(state : NodeBreakPoint) : void;
  /**
   * 拉直连接
   * @param refPort 拉直参考端口
   * @param connector 连接
   * @returns 
   */
  straightenConnector(refPort : NodePort, connector : NodeConnector) : void;
  /**
   * 对齐节点
   * @param baseNode 参考基准节点
   * @param align 对齐方向
   */
  alignSelectedNode(baseNode : Node, align : 'left'|'top'|'right'|'bottom'|'center-x'|'center-y') : void;
  /**
   * 移动视口至节点中心位置
   * @param baseNode 
   */
  moveViewportToNode(baseNode : Node) : void;
}

/**
 * 流程图用户操作管理器
 * @param options 
 * @returns 
 */
export function useEditorUserController(context: NodeGraphEditorInternalContext) {


  /**
   * 删除选中连接线
   */
  function deleteSelectedConnectors() {
    context.getSelectConnectors().forEach((c) => context.unConnectConnector(c));
  }
  /**
   * 删除选中单元的连接
   */
  function unConnectSelectedNodeConnectors() {
    context.getSelectNodes().forEach((node) => context.unConnectNodeConnectors(node));
  }
  /**
   * 删除选中的单元
   */
  function deleteSelectedNodes() {
    context.getSelectNodes().forEach((node) => {
      if (node.define.canNotDelete) 
        return;
      context.removeNode(node as NodeEditor, true);
    });
    ArrayUtils.clear(context.getSelectNodes());
  }

  /**
   * 拉直连接
   * @param refPort 拉直参考端口
   * @param connector 连接
   * @returns 
   */
  function straightenConnector(refPort : NodePort, connector : NodeConnector) {

    if(!connector.startPort || !connector.endPort)
      return;

    const refPos = (refPort as NodePortEditor).getPortPositionViewport();
    let node : Node|null = null;
    let oldPos : Vector2|null = null;

    if(connector.startPort == refPort) {
      node = connector.endPort.parent;
      oldPos = (connector.endPort as NodePortEditor).getPortPositionViewport();
    }
    else if(connector.endPort == refPort)  {
      node = connector.startPort.parent;
      oldPos = (connector.startPort as NodePortEditor).getPortPositionViewport();
    }

    if(node && oldPos) {
      const offPos = oldPos.y - node.position.y;
      node.position = new Vector2(node.position.x, refPos.y - offPos);
      updateNodeForMoveEnd(node);
    }

    context.markGraphChanged();
  }
  /**
   * 对齐节点
   * @param baseNode 参考基准节点
   * @param align 对齐方向
   */
  function alignSelectedNode(baseNode : Node, align : 'left'|'top'|'right'|'bottom'|'center-x'|'center-y') {
    const selectedNodes = context.getSelectNodes();
    const baseNodeSize = (baseNode as NodeEditor).getRealSize();
    switch(align) {
      case 'left':
        selectedNodes.forEach((b) => {
          b.position = new Vector2(baseNode.position.x, b.position.y);
          updateNodeForMoveEnd(b);
        });
        break;
      case 'top':
        selectedNodes.forEach((b) => {
          b.position = (new Vector2(b.position.x, baseNode.position.y));
          updateNodeForMoveEnd(b);
        });
        break;
      case 'center-x': {
        const center = baseNode.position.x + baseNodeSize.x / 2;
        selectedNodes.forEach((b) => {
          b.position = (new Vector2(center + (b as NodeEditor).getRealSize().x / 2, b.position.y));
          updateNodeForMoveEnd(b);
        });
        break;
      }
      case 'center-y': {
        const center = baseNode.position.y + baseNodeSize.y / 2;
        selectedNodes.forEach((b) => {
          b.position = (new Vector2(b.position.x, center + (b as NodeEditor).getRealSize().y / 2));
          updateNodeForMoveEnd(b);
        });
        break;
      }
      case 'right': {
        const right = baseNode.position.x + baseNodeSize.x;
        selectedNodes.forEach((b) => {
          b.position = (new Vector2(right - baseNodeSize.x, b.position.y));
          updateNodeForMoveEnd(b);
        });
        break;
      }
      case 'bottom': {
        const bottom = baseNode.position.y + baseNodeSize.y;
        selectedNodes.forEach((b) => {
          b.position = (new Vector2(b.position.x, bottom - baseNodeSize.y));
          updateNodeForMoveEnd(b);
        });
        break;
      }
    }
    context.markGraphChanged();
  }
  /**
   * 设置选中单元断点状态
   */
  function setSelectedNodeBreakpointState(state : NodeBreakPoint) {
    context.getSelectNodes().forEach((b) => b.breakpoint = state);
    context.markGraphChanged();
  }

  /**
   * 用户删除单元
   * @param node 
   * @returns 
   */
  function userDeleteNode(node: Node) {
    if (node.define.canNotDelete) 
      return false;
    context.removeNode(node as NodeEditor, true);
    return true;
  }
  /**
   * 用户添加单元
   * @param define 单元定义
   * @param addNodeInPos 添加之后设置单元的位置，如果不提供，则默认设置到视口中心位置
   */
  function userAddNode(define: INodeDefine, addNodeInPos?: Vector2|undefined) {
    //TODO: 检查单元是否只能有一个
    // if(define.oneNodeOnly && currentGraph?.getNodesByGUID(define.guid).length > 0) {      
    //   DebugWorkProviderInstance.ModalProvider('warning', '提示', '当前文档中已经有 ' + nodeData.baseInfo.name + ' 了，此单元只能有一个', () => {});
    //   return;
    // }
    //自定义检查回调
    // if(typeof nodeData.callbacks.onAddCheck == 'function') {
    //   let err = nodeData.callbacks.onAddCheck(nodeData, this.currentGraph);
    //   if(err != null) {
    //     DebugWorkProviderInstance.ModalProvider('warning', '提示', err, () => {});
    //     return;
    //   }
    // }

    let newNode = new NodeEditor(define);
    if(addNodeInPos) { //在指定位置添加单元
      newNode.position = addNodeInPos;
      context.addNode(newNode)
    } 
    else { //在屏幕中央位置添加单元
      const center = context.getViewPort().rect().calcCenter();
      newNode.position = center;
      context.addNode(newNode);
    }

    if(context.isConnectToNew()) { //添加单元并连接
      const connectingEndPos = context.getConnectingInfo().endPos;
      newNode.position = connectingEndPos;
      context.addNode(newNode);

      setTimeout(() => {
        //重新定位单元位置至连接线末端位置
        let port = context.endConnectToNew(newNode);
        let pos = new Vector2();
        pos.set((port as NodePortEditor).getPortPositionViewport());
        pos.x = connectingEndPos.x - (pos.x - newNode.position.x);
        pos.y = connectingEndPos.y - (pos.y - newNode.position.y);
        newNode.position.set(pos);
      }, 100);
    } 
  }

  //单元位置或大小更改，刷新单元
  function updateNodeForMoveEnd(node: Node) {
    (node as NodeEditor).editorHooks.callbackUpdateNodeForMoveEnd?.();
  }
  /**
   * 移动视口至节点中心位置
   * @param baseNode 
   */
  function moveViewportToNode(baseNode : Node) {
    
  }

  context.userAddNode = userAddNode;
  context.userDeleteNode = userDeleteNode;
  context.deleteSelectedNodes = deleteSelectedNodes;
  context.deleteSelectedConnectors = deleteSelectedConnectors;
  context.unConnectSelectedNodeConnectors = unConnectSelectedNodeConnectors;
  context.straightenConnector = straightenConnector;
  context.alignSelectedNode = alignSelectedNode;
  context.setSelectedNodeBreakpointState = setSelectedNodeBreakpointState;
  context.moveViewportToNode = moveViewportToNode;

  return {
  }
}