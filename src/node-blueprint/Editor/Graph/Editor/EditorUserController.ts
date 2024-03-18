import { nextTick } from "vue";
import { NodeEditor } from "../Flow/NodeEditor";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import type { NodePortEditor } from "../Flow/NodePortEditor";
import type { Node, INodeDefine, NodeBreakPoint, CustomStorageObject } from "@/node-blueprint/Base/Flow/Node/Node";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import type { NodeConnector } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import type { NodePort } from "@/node-blueprint/Base/Flow/Node/NodePort";
import { NodeConnectorEditor } from "../Flow/NodeConnectorEditor";
import BaseNodes from "@/node-blueprint/Nodes/Lib/BaseNodes";

export interface NodeEditorUserControllerContext {
  /**
   * 用户添加单元
   * @param define 单元定义
   * @param addNodeInPos 添加之后设置单元的位置，如果不提供，则默认设置到视口中心位置
   */
  userAddNode(define: INodeDefine, addNodeInPos?: Vector2|undefined, intitalOptions?: CustomStorageObject|undefined) : Node|null;
  /**
   * 用户删除单元
   * @param node 
   * @returns 
   */
  userDeleteNode(node: NodeEditor) : void;
  /**
   * 用户删除操作
   */
  userDelete() : void;
  /**
   * 用户删除端口
   * @param nodePort 
   */
  userDeletePort(nodePort: NodePortEditor) : void;
  /**
   * 用户操作显示弹出框
   * @param type 类型
   * @param message 信息
   */
  userActionConfirm(type: 'error'|'warning'|'help', message: string) : Promise<boolean>;
  /**
   * 用户操作显示弹出框
   * @param type 类型
   * @param message 信息
   */
  userActionAlert(type: 'error'|'warning'|'help', message: string) : void;
  /**
   * 递交回调至下一个界面更新执行
   * @param cb 
   */
  userInterfaceNextTick(cb: () => void): void;
  /**
   * 添加图表变量节点
   * @param uid 图表UID
   * @param name 变量名称
   * @param type 添加类型
   */
  userAddVariableNode(uid: string, name: string, type: 'get'|'set'): void;

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
  straightenConnector(refPort : NodePortEditor, connector : NodeConnector) : void;
  /**
   * 对齐节点
   * @param baseNode 参考基准节点
   * @param align 对齐方向
   */
  alignSelectedNode(baseNode : NodeEditor, align : 'left'|'top'|'right'|'bottom'|'center-x'|'center-y') : void;
  /**
   * 移动视口至节点中心位置
   * @param baseNode 
   */
  moveViewportToNode(baseNode : NodeEditor) : void; 

  /**
   * 为选中项创建注释
   */
  genCommentForSelectedNode() : void;
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
    context.unSelectAllNodes();
  }

  /**
   * 拉直连接
   * @param refPort 拉直参考端口
   * @param connector 连接
   * @returns 
   */
  function straightenConnector(refPort : NodePortEditor, connector : NodeConnectorEditor) {

    if(!connector.startPort || !connector.endPort)
      return;

    const refPos = refPort.getPortPositionViewport();
    let node : Node|null = null;
    let oldPos : Vector2|null = null;

    if(connector.startPort === refPort) {
      node = connector.endPort.parent;
      oldPos = (connector.endPort as NodePortEditor).getPortPositionViewport();
    }
    else if(connector.endPort === refPort)  {
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
  function alignSelectedNode(baseNode : NodeEditor, align : 'left'|'top'|'right'|'bottom'|'center-x'|'center-y') {
    const selectedNodes = context.getSelectNodes();
    const baseNodeSize = baseNode.getRealSize();
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
          b.position = (new Vector2(center + b.getRealSize().x / 2, b.position.y));
          updateNodeForMoveEnd(b);
        });
        break;
      }
      case 'center-y': {
        const center = baseNode.position.y + baseNodeSize.y / 2;
        selectedNodes.forEach((b) => {
          b.position = (new Vector2(b.position.x, center + b.getRealSize().y / 2));
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
   * 用户操作显示弹出框
   * @param type 类型
   * @param message 信息
   */
  function userActionAlert(type: 'error'|'warning'|'help', message: string) {
    context.showModal({
      icon: type,
      content: message
    });
  }
  /**
   * 用户操作显示弹出框
   * @param type 类型
   * @param message 信息
   */
  function userActionConfirm(type: 'error'|'warning'|'help', message: string) {
    return context.showConfirm({
      icon: type,
      content: message
    });
  }
  function userInterfaceNextTick(cb: () => void) {
    nextTick(cb);
  }

  /**
   * 用户删除端口
   * @param port 
   */
  function userDeletePort(port: NodePort) {
    if (port.dyamicAdd) {
      const parent = port.parent as NodeEditor;
      parent.deletePort(port.guid);

      for (let i = parent.connectors.length - 1; i >= 0; i--) {
        const connector = parent.connectors[i];
        if (connector.startPort === port || connector.endPort === port)
          context.unConnectConnector(connector as NodeConnectorEditor);
      }
    }
  }
  /**
   * 用户删除单元
   * @param node 
   * @returns 
   */
  function userDeleteNode(node: NodeEditor) {
    if (node.define.canNotDelete) 
      return false;
    context.removeNode(node, true);
    return true;
  }
  /**
   * 用户添加单元
   * @param define 单元定义
   * @param addNodeInPos 添加之后设置单元的位置，如果不提供，则默认设置到视口中心位置
   */
  function userAddNode(define: INodeDefine, addNodeInPos?: Vector2|undefined, intitalOptions?: CustomStorageObject|undefined) {
    const currentGraph = context.getCurrentGraph();

    //检查单元是否只能有一个
    if(define.oneNodeOnly && currentGraph?.getNodesByGUID(define.guid).length > 0) {     
      userActionAlert('warning', '当前文档中已经有 ' + define.name + ' 了，此单元只能有一个');
      return null;
    }
    //自定义检查回调
    if(typeof define.events?.onAddCheck === 'function') {
      const err = define.events.onAddCheck(define, currentGraph);
      if(err !== null) {
        userActionAlert('warning', err);
        return null;
      }
    }

    const newNode = new NodeEditor(define);
    newNode.load();
    //配置
    if (intitalOptions)
      newNode.options = intitalOptions;

    if(context.isConnectToNew()) { //添加单元并连接
      const connectingEndPos = context.getConnectingInfo().endPos;
      newNode.position.set(connectingEndPos);
      context.addNode(newNode);
      const [ port, _connector ] = context.endConnectToNew(newNode);  
      const pos = new Vector2();

      //强制同步连接线位置，保证显示正确
      if (_connector && _connector instanceof NodeConnectorEditor) {
        const connector = (_connector as NodeConnectorEditor);
        connector.forceSetPos(undefined, connectingEndPos);
      }

      //延时以保证VUE将节点原件加载完成，获取端口的位置
      userInterfaceNextTick(() => {
        if (port) {
          //重新定位单元位置至连接线末端位置
          pos.set(port.getPortPositionViewport());
          pos.x = connectingEndPos.x - (pos.x - newNode.position.x);
          pos.y = connectingEndPos.y - (pos.y - newNode.position.y);
          newNode.position.set(pos);
          newNode.updateRegion();
        }
      });
    } else if(addNodeInPos) { //在指定位置添加单元
      newNode.position.set(addNodeInPos);
      context.addNode(newNode)
    } else { //在屏幕中央位置添加单元
      const center = context.getViewPort().rect().calcCenter();
      newNode.position.set(center);
      context.addNode(newNode);
    }

    return newNode;
  }
  /**
   * 用户删除操作
   */
  function userDelete() {
    if(context.isKeyAltDown())
      context.deleteSelectedConnectors();
    else 
      context.deleteSelectedNodes();
  }

  //单元位置或大小更改，刷新单元
  function updateNodeForMoveEnd(node: Node) {
    (node as NodeEditor).editorHooks.callbackUpdateNodeForMoveEnd?.();
  }
  /**
   * 移动视口至节点中心位置
   * @param node 
   */
  function moveViewportToNode(node : Node) {
    const size = (node as NodeEditor).getRealSize();
    const viewPort = context.getViewPort();
    const offset = new Vector2(
      size.x / 2 - viewPort.size.x / 2, 
      size.y / 2 - viewPort.size.y / 2, 
    );
    viewPort.scaleScreenSizeToViewportSize(offset);
    viewPort.position = new Vector2(node.position).add(offset);
  }

  /**
   * 为选中项创建注释
   */
  function genCommentForSelectedNode() {
    const selectedNodes = context.getSelectNodes();
    if (selectedNodes.length < 0)
      return;

    const rect = context.calcNodesRegion(selectedNodes);
    const node = userAddNode(BaseNodes.getScriptBaseCommentNode(), new Vector2(rect.x - 15, rect.y - 15 - 50));
    if (node) {
      node.customSize.set(rect.w + 30, rect.h + 30 + 50);
    }
  }

  /**
   * 添加图表变量节点
   * @param uid 
   * @param name 
   * @param type 
   */
  function userAddVariableNode(uid: string, name: string, type: 'get'|'set') {
    const currentGraph = context.getCurrentGraph();
    if (currentGraph.uid !== uid)
      return;

    const variable = currentGraph.variables.find(v => v.name === name);
    if (!variable) {
      userActionAlert('error', `未找到变量 ${name}`);
      return;
    }

    if (type === 'get') {
      const node = userAddNode(BaseNodes.getScriptBaseVariableGet(), context.getMouseInfo().mouseCurrentPosViewPort);
      if (node)
        node.options.variable = variable.name;
    } else {
      const node = userAddNode(BaseNodes.getScriptBaseVariableSet(), context.getMouseInfo().mouseCurrentPosViewPort);
      if (node)
        node.options.variable = variable.name;
    }
  }


  let autoNodeSizeChangeCheckerTimer = 0;

  function autoNodeSizeChangeCheckerStartStop(start: boolean) {
    if (autoNodeSizeChangeCheckerTimer) {
      clearInterval(autoNodeSizeChangeCheckerTimer);
      autoNodeSizeChangeCheckerTimer = 0;
    }
    if (start) {
      autoNodeSizeChangeCheckerTimer = setInterval(() => {
        context.getSelectNodes().forEach((n) => n.editorHooks.callbackDoAutoResizeCheck?.())
      }, 1000);
    }
  }

  context.userAddNode = userAddNode;
  context.userDeleteNode = userDeleteNode;
  context.userDeletePort = userDeletePort;
  context.userDelete = userDelete;
  context.userAddVariableNode = userAddVariableNode;

  context.userActionConfirm = userActionConfirm;
  context.userActionAlert = userActionAlert;
  context.userInterfaceNextTick = userInterfaceNextTick;

  context.deleteSelectedNodes = deleteSelectedNodes;
  context.deleteSelectedConnectors = deleteSelectedConnectors;
  context.unConnectSelectedNodeConnectors = unConnectSelectedNodeConnectors;
  context.straightenConnector = straightenConnector;
  context.alignSelectedNode = alignSelectedNode;
  context.setSelectedNodeBreakpointState = setSelectedNodeBreakpointState;
  context.moveViewportToNode = moveViewportToNode;
  context.genCommentForSelectedNode = genCommentForSelectedNode;

  context.autoNodeSizeChangeCheckerStartStop = autoNodeSizeChangeCheckerStartStop;

  return {}
}