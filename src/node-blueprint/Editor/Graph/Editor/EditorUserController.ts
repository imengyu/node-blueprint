import { nextTick } from "vue";
import { NodeEditor } from "../Flow/NodeEditor";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import type { NodePortEditor } from "../Flow/NodePortEditor";
import type { Node, INodeDefine, NodeBreakPoint, CustomStorageObject } from "@/node-blueprint/Base/Flow/Node/Node";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import type { NodeConnector } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import type { NodePort } from "@/node-blueprint/Base/Flow/Node/NodePort";
import { NodeConnectorEditor } from "../Flow/NodeConnectorEditor";
import BaseNodes, { getGraphCallNodeGraph, type IGraphCallNodeOptions } from "@/node-blueprint/Nodes/Lib/BaseNodes";
import { NodeVariable } from "@/node-blueprint/Base/Flow/Graph/NodeVariable";
import { printError } from "@/node-blueprint/Base/Logger/DevLog";
import type { NodeGraph } from "@/node-blueprint/Base/Flow/Graph/NodeGraph";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";


export interface NodeEditorUserAddNodeOptions<T> {
  /**
   * 添加之后设置单元的位置，如果不提供，则默认设置到视口中心位置
   */
  addNodeInPos?: Vector2|undefined, 
  /**
   * 如果指定了 addNodeInPos，是否将 addNodeInPos 减去当前的单元大小（也就是居中放置），默认：false
   */
  addNodePosRefernceCenter?: boolean,
  /**
   * 初始化单元的 options 数据
   */
  intitalOptions?: T|undefined,
}
export interface NodeEditorUserControllerContext {
  /**
   * 用户添加单元
   * @param define 单元定义
   * @param options 自定义配置 
   */
  userAddNode<T = CustomStorageObject>(define: INodeDefine, options: NodeEditorUserAddNodeOptions<T>) : Node|null;
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
  userAddVariableNode(uid: string, name: string, type: 'get'|'set', pos?: Vector2): Node|null;
  /**
   * 提升为变量
   * @param port 
   * @returns 
   */
  userPromotePortToVariable(port: NodePort): void; 
  /**
   * 提升为函数
   */
  userPromoteSubgraphToFunction(node: Node): void;
  /**
   * 折叠为函数/子图表
   * @param to 设置折叠为函数还是子图表
   */
  userCollapseSelectedNodesTo(to: 'function'|'subgraph'): void;
  /**
   * 展开子图表
   * @param node 选中节点
   */
  userExpandSubgraph(node: Node): void;

  /**
   * 展开子图表
   * @param subgraph 子图表
   */
  expandSubgraph(subgraph: NodeGraph) : void;
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

const TAG = 'EditorUserController';

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
   * 提升为变量
   * @param port 
   * @returns 
   */
  function userPromotePortToVariable(port: NodePort) {
    const graph = context.getCurrentGraph();
    const name = graph.getUseableVariableName(port.isInput ? 'Input' : 'Output');

    //添加变量
    graph.variables.push(new NodeVariable().load({
      name,
      type: port.paramType,
      defaultValue: port.paramType.define?.defaultValue(),
      static: false,
      customData: {}
    }));

    //添加节点
    const node = userAddVariableNode(
      graph.uid, 
      name, 
      port.isInput ? 'get' : 'set', 
      (port as NodePortEditor).getPortPositionViewport().substract(new Vector2(port.isInput ? 180 : -100, 0))
    );
    if (!node)
      return false;

    //连接端口与变量节点
    const connector = context.connectConnector(
      node.getPortByGUID(port.isInput ? 'OUTPUT' : 'INPUT') as NodePortEditor,
      port as NodePortEditor
    );
    if (!connector)
      return false;

    context.userInterfaceNextTick(() => {
      //拉直连接
      context.straightenConnector(port as NodePortEditor, connector);
    });
   
    return true;
  }
  /**
   * 用户添加单元
   * @param define 单元定义
   * @param addNodeInPos 添加之后设置单元的位置，如果不提供，则默认设置到视口中心位置
   */
  function userAddNode<T = CustomStorageObject>(define: INodeDefine, options: NodeEditorUserAddNodeOptions<T>) {
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
    if (options.intitalOptions)
      newNode.options = options.intitalOptions;
    //事件
    newNode.events.onCreate?.(newNode);

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
    } else if(options.addNodeInPos) { //在指定位置添加单元
      newNode.position.set(options.addNodeInPos);
      //居中放置
      if (options.addNodePosRefernceCenter) {
        userInterfaceNextTick(() => {
          const size = newNode.getRealSize();
          newNode.position.x -= size.x / 2;
          newNode.position.y -= size.y / 2;
          newNode.updateRegion();
        });
      }
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
  /**
   * 提升为函数
   */
  function userPromoteSubgraphToFunction(node: Node) {

    //将图表类型更改为函数或者静态函数
    //移动图表至文档根
    //更改调用节点设置
    const options = (node.options as unknown as IGraphCallNodeOptions);
    const callGraphName = options.callGraphName;
    const graph = context.getCurrentGraph().getChildGraphByName(callGraphName);
    if (!graph) {
      printError(TAG, `Not found graph for node ${node.uid}`);
      return;
    }
    const doc = graph.getParentDocunment();
    if (!doc) {
      printError(TAG, `Not found ParentDocunment for graph ${graph.uid}`);
      return;
    }
    const mainGraph = doc.mainGraph;
    if (!mainGraph) {
      printError(TAG, `Not found mainGraph for doc ${doc.name}`);
      return;
    }

    graph.type = mainGraph.type === 'class' ? 'function' : 'static';

    ArrayUtils.remove((graph.parent as NodeGraph).children, graph);
    mainGraph.children.push(graph);
    graph.parent = mainGraph;

    context.sendMessageToFilteredNodes(`GraphCall${callGraphName}`, BaseNodes.messages.GRAPH_PROMOTE, { type: 'function' });
  }
  /**
   * 展开子图表
   */
  function userExpandSubgraph(node: Node) {
    context.userActionConfirm(
      'warning', 
      '确定展开选中的图表/函数？如果有其它节点调用此子图表，将会失去调用'
    ).then((confirm) => {
      if (confirm) {
        const callGraph = getGraphCallNodeGraph(context, node);
        if (callGraph)
          expandSubgraph(callGraph);
        else
          context.showSmallTip('调用图标丢失');
      }
    });
  }
  /**
   * 添加图表变量节点
   * @param uid 
   * @param name 
   * @param type 
   */
  function userAddVariableNode(uid: string, name: string, type: 'get'|'set', pos?: Vector2) {
    const currentGraph = context.getCurrentGraph();
    if (currentGraph.uid !== uid)
      return null;

    const variable = currentGraph.variables.find(v => v.name === name);
    if (!variable) {
      userActionAlert('error', `未找到变量 ${name}`);
      return null;
    }

    if (type === 'get') {
      return userAddNode(BaseNodes.getScriptBaseVariableGet(), {
        addNodeInPos: pos ?? context.getMouseInfo().mouseCurrentPosViewPort,
        intitalOptions: { variable: variable.name },
      });
    } else {
      return userAddNode(BaseNodes.getScriptBaseVariableSet(), {
        addNodeInPos: pos ?? context.getMouseInfo().mouseCurrentPosViewPort,
        intitalOptions: { variable: variable.name },
      });
    }
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
    const node = userAddNode(BaseNodes.getScriptBaseCommentNode(), {
      addNodeInPos: new Vector2(rect.x - 15, rect.y - 15 - 50)
    });
    if (node) {
      node.customSize.set(rect.w + 30, rect.h + 30 + 50);
    }
  }

  /**
   * 折叠为子图表/提升为函数
   */
  function userCollapseSelectedNodesTo(to: 'function'|'subgraph') {
    const selectedNodes = context.getSelectNodes();
    if (selectedNodes.length < 0)
      return;

  }
  /**
   * 展开子图表
   * 
   * 移除子图表。
   * 将子图表中的节点拷贝至当前图表（除了输入输出）。
   * 将子图表端口与调用节点端口一一对应，重建连接
   * 删除调用节点
   * @param subgraph 子图表
   */
  function expandSubgraph(subgraph: NodeGraph) {
    const currentGraph = context.getCurrentGraph();

    currentGraph.children.push(...subgraph.children);
    ArrayUtils.remove(currentGraph.children, subgraph);

    const callNodes = context.filterNodes(`GraphCall${subgraph.name}`);
    for (const callNode of callNodes) {
      const callPos = callNode.position;
      const copyNodeUidMapping = new Map<string, string>();
      const filteredNodeArray : NodeEditor[] = [];

      for (const node of subgraph.nodes.values()) {
        if (!node.isGraphInOutNode)
          filteredNodeArray.push(node as NodeEditor);
      }

      const region = context.calcNodesRegion(filteredNodeArray);

      for (const node of filteredNodeArray) {
        if (!node.isGraphInOutNode) {
          const newNode = context.userAddNode(node.define, {
            addNodeInPos: node.position.clone().substract(region.getPoint()).add(callPos),
            intitalOptions: node.options,
          });
          if (newNode)
            copyNodeUidMapping.set(node.uid, newNode.uid);
        }
      }
      for (const connector of subgraph.connectors) {
        if (!connector.startPort || !connector.endPort)
          continue;

        const startNodeUid = copyNodeUidMapping.get(connector.startPort.parent.uid);
        const endNodeUid = copyNodeUidMapping.get(connector.endPort.parent.uid);
        const startNode = startNodeUid ? currentGraph.nodes.get(startNodeUid) : undefined;
        const endNode = endNodeUid ? currentGraph.nodes.get(endNodeUid) : undefined;
        let startPort: NodePort|null = null;
        let endPort: NodePort|null = null;

        if (connector.startPort.parent.isGraphInOutNode) {
          //链接入节点
          const callerPort = callNode.getPortByGUID(connector.startPort.guid);
          startPort = callerPort ? callerPort.connectedFromPort[0].startPort : null;
          endPort = endNode?.getPortByGUID(connector.endPort.guid) ?? null;
        }
        else if(connector.endPort.parent.isGraphInOutNode) {
          //链接出节点
          const callerPort = callNode.getPortByGUID(connector.endPort.guid);
          startPort = startNode?.getPortByGUID(connector.startPort.guid) ?? null;
          endPort = callerPort ? callerPort.connectedToPort[0].endPort : null;
        }
        else {
          startPort = startNode?.getPortByGUID(connector.startPort.guid) ?? null;
          endPort = endNode?.getPortByGUID(connector.endPort.guid) ?? null;
        }
        
        if (startPort && endPort)
          context.connectConnector(startPort as NodePortEditor, endPort as NodePortEditor);
        else
          printError(TAG, `expandSubgraph: Failed to connect ${connector.startPort.guid} to ${connector.endPort.guid} connector uid: (${connector.uid})`);
      }

      context.userDeleteNode(callNode);
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
  context.userPromotePortToVariable = userPromotePortToVariable;
  context.userPromoteSubgraphToFunction = userPromoteSubgraphToFunction;
  context.userExpandSubgraph = userExpandSubgraph;
  context.userCollapseSelectedNodesTo = userCollapseSelectedNodesTo;

  context.userActionConfirm = userActionConfirm;
  context.userActionAlert = userActionAlert;
  context.userInterfaceNextTick = userInterfaceNextTick;

  context.expandSubgraph = expandSubgraph;
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