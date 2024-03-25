import { nextTick } from "vue";
import { NodeEditor } from "../Flow/NodeEditor";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import type { NodePortEditor } from "../Flow/NodePortEditor";
import type { Node, INodeDefine, NodeBreakPoint, CustomStorageObject } from "@/node-blueprint/Base/Flow/Node/Node";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import type { NodeConnector } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import type { INodePortDefine, NodePort } from "@/node-blueprint/Base/Flow/Node/NodePort";
import { NodeConnectorEditor } from "../Flow/NodeConnectorEditor";
import BaseNodes, { getGraphCallNodeGraph, type IGraphCallNodeOptions } from "@/node-blueprint/Nodes/Lib/BaseNodes";
import { NodeVariable } from "@/node-blueprint/Base/Flow/Graph/NodeVariable";
import { printError, printWarning } from "@/node-blueprint/Base/Logger/DevLog";
import { NodeGraph, type INodeGraphDefine } from "@/node-blueprint/Base/Flow/Graph/NodeGraph";
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
   * Deletes a dynamic port from the editor.
   * @param port - The dynamic port to delete.
   */
  deleteDynamicPort(port: NodePort) : void;
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
 * Custom hook for the Editor User Controller.
 * This hook provides various utility functions for manipulating the editor nodes and connectors.
 *
 * @param context The internal context of the Node Graph Editor.
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
   * Deletes a dynamic port from the editor.
   * @param port - The dynamic port to delete.
   */
  function deleteDynamicPort(port: NodePort) {
    if (!port.dyamicAdd)
      throw new Error('The port is not a dynamic port.');
    const parent = port.parent as NodeEditor;
    parent.deletePort(port);
    for (let i = parent.connectors.length - 1; i >= 0; i--) {
      const connector = parent.connectors[i];
      if (connector.startPort === port || connector.endPort === port)
        context.unConnectConnector(connector as NodeConnectorEditor);
    }
  }

  /**
   * 用户删除端口
   * @param port 
   */
  function userDeletePort(port: NodePort) {
    if (port.dyamicAdd) {
      if (port.isCallingDelete) {
        context.deleteDynamicPort(port as NodePortEditor);
      } else {
        port.isCallingDelete = true;
        const ret = port.parent.events.onUserDeletePort?.(port.parent as NodeEditor, context, port);
        port.isCallingDelete = false;
        if (!ret) {
          context.deleteDynamicPort(port as NodePortEditor);
          return;
        }
        ret.then((result) => {
          if (result)
            context.deleteDynamicPort(port as NodePortEditor);
        });
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
   * 折叠为子图表/函数
   * 
   * 获取已选节点列表，计算矩形。
   * 在指定位置生成子图表。
   * 搬运节点至子图表中。
   * 筛选所有外部端口。
   * 创建调用节点。
   * 所有外部端口与调用节点端口一一对应，重建连接
   */
  function userCollapseSelectedNodesTo(to: 'function'|'subgraph') {
    const selectedNodes = context.getSelectNodes();
    if (selectedNodes.length < 0)
      return;

    for (const node of selectedNodes) {
      if (node.define.canNotDelete) {
        userActionAlert('warning', '不能将基础节点折叠为子图表');
        return;
      }
    }

    const currentGraph = context.getCurrentGraph();
    const region = context.calcNodesRegion(selectedNodes);

    //创建子图表
    let childGraphDefine : INodeGraphDefine|null = null;
    let childGraphParent : NodeGraph|null = null;

    switch (to) {
      case 'function': {
        //在顶级创建函数
        const mainGraph = currentGraph.getParentDocunment()?.mainGraph;
        if (!mainGraph) throw new Error('!mainGraph');

        childGraphDefine = {
          name: mainGraph.getUseableGraphName('Function'),
          type: mainGraph.type === 'class' ? 'function' : 'static',
        };
        childGraphParent = mainGraph;
        break;
      }
      case 'subgraph':
        //在当前级创建子图表
        childGraphDefine = {
          name: currentGraph.getUseableGraphName('Subgraph'),
          type: 'subgraph',
        }
        childGraphParent = currentGraph;
        break;
      default:
        printWarning(TAG, `Unknow option ${to}`);
        return;
    }

    const childGraph = new NodeGraph(childGraphDefine, childGraphParent, true);
    childGraph.load(childGraphDefine);
    childGraph.initNew();
    currentGraph.children.push(childGraph);

    //如果选中节点有调用子图表节点，则需要将对应子图表复制到新的子图表中
    const callGuid = BaseNodes.getScriptBaseGraphCall().guid;
    for (const node of selectedNodes) {
      if (node.guid === callGuid) {
        const options = node.getOptions<IGraphCallNodeOptions>();
        const callGraph = currentGraph.getChildGraphByName(options.callGraphName);
        if (
          options.callGraphType === 'subgraph' 
          && callGraph !== null
          && childGraph.getChildGraphByName(options.callGraphName) === null
        ) {
          childGraph.children.push(callGraph.clone());
        }
      }
    }

    //获取子图表的进入节点，计算其他节点的相对位置
    const inNode = childGraph.getNodesByGUID(BaseNodes.getScriptBaseGraphIn().guid)[0];
    const outNode = childGraph.getNodesByGUID(BaseNodes.getScriptBaseGraphOut().guid)[0];
    const inOffset = new Vector2(200, 0);
    if (!inNode) throw new Error('!inNode');
    if (!outNode) throw new Error('!outNode');

    for (const node of selectedNodes) {
      //拷贝节点并设置位置
      node.position = node.position.substract(region.getPoint()).add(inNode.position).add(inOffset);
      childGraph.nodes.set(node.uid, node);
    }   

    //移动子图表中的结束节点至最右侧
    outNode.position = new Vector2(inNode.position.x + inOffset.x * 2 + region.w, inNode.position.y);

    //连接线处理：
    //如果连接线另外一个节点位于子图表中，则可以直接连接
    //否则需要创建子图表输入输出端口并连接
    const innerConnectors = new Set<NodeConnector>();
    const inputConnectors = new Set<NodeConnector>();
    const outputConnectors = new Set<NodeConnector>();

    const solveConnector = (connector: NodeConnector, input: boolean) => {
      const otherSidePort = input ? connector.startPort : connector.endPort;
      if (otherSidePort && childGraph?.nodes.get(otherSidePort.parent.uid)) 
        innerConnectors.add(connector);
      else
        (input ? inputConnectors : outputConnectors).add(connector);
    };

    for (const node of selectedNodes) {
      for (const port of node.inputPorts) 
        for (const connetcor of port.connectedFromPort) 
          solveConnector(connetcor, true);
      for (const port of node.outputPorts) 
        for (const connetcor of port.connectedToPort) 
          solveConnector(connetcor, false);
    }

    //内部连接线，直接复制
    for (const connector of innerConnectors)
      childGraph.connectors.push(connector);

    //筛选与外部链接的连接线并创建对应端口
    //创建内部输入输出节点的端口
    const innerPortMapping = new Map<string, NodePort>();
    const outerPortMapping = new Map<string, string>();
    for (const connector of inputConnectors) {
      if (connector.startPort) {
        const portDef : INodePortDefine = {
          guid: childGraph.getUseablePortName(true),
          name: connector.startPort.name,
          paramType: connector.startPort.paramType,
          direction: "input"
        };
        childGraph.inputPorts.push(portDef);
        const port = inNode.addPort(portDef, true, undefined, 'output');
        innerPortMapping.set(connector.uid, port);
        outerPortMapping.set(connector.uid, portDef.guid);
      }
    }
    for (const connector of outputConnectors) {
      if (connector.endPort) {
        const portDef : INodePortDefine = {
          guid: childGraph.getUseablePortName(false),
          name: connector.endPort.name,
          paramType: connector.endPort.paramType,
          direction: "output"
        };
        childGraph.outputPorts.push(portDef);
        const port = outNode.addPort(portDef, true, undefined, 'input');
        innerPortMapping.set(connector.uid, port);
        outerPortMapping.set(connector.uid, portDef.guid);
      }
    }

    //创建内部输入输出节点与内部节点的连接
    for (const connector of inputConnectors) {
      if (!connector.endPort)
        throw new Error('!connector.endPort');
      const port = innerPortMapping.get(connector.uid);
      if (port) {
        childGraph.connectors.push(new NodeConnectorEditor().load({
          uid: connector.uid,
          startPort: port,
          endPort: connector.endPort,
        }));
      }
    }
    for (const connector of outputConnectors) {
      if (!connector.startPort)
        throw new Error('!connector.startPort');
      const port = innerPortMapping.get(connector.uid);
      if (port) {
        childGraph.connectors.push(new NodeConnectorEditor().load({
          uid: connector.uid,
          startPort: connector.startPort,
          endPort: port,
        }));
      }
    }

    //创建外部调用节点
    const callNode = context.userAddNode<IGraphCallNodeOptions>(BaseNodes.getScriptBaseGraphCall(), {
      addNodeInPos: region.getPoint(),
      intitalOptions: {
        callGraphName: childGraph.name,
        callGraphType: to,
      },
    });
    if (!callNode)
      throw new Error('!callNode');

    //创建外部节点的端口
    for (const inputPort of childGraph.inputPorts) {
      if (!inputPort.style) 
        inputPort.style = {};
      inputPort.style.forceNoDelete = true;
      callNode?.addPort(inputPort, true, undefined, 'input');
    }
    for (const outputPort of childGraph.outputPorts) {
      if (!outputPort.style) 
        outputPort.style = {};
      outputPort.style.forceNoDelete = true;
      callNode?.addPort(outputPort, true, undefined, 'output');
    }

    //创建外部节点与调用节点的连接
    for (const connector of inputConnectors) {
      const portGuid = outerPortMapping.get(connector.uid);
      if (portGuid)
        context.connectConnector(
          connector.startPort as NodePortEditor, 
          callNode!.getPortByGUID(portGuid) as NodePortEditor
        );
    }
    for (const connector of outputConnectors) {
      const portGuid = outerPortMapping.get(connector.uid);
      if (portGuid)
        context.connectConnector(
          callNode!.getPortByGUID(portGuid) as NodePortEditor,
          connector.endPort as NodePortEditor
        );
    }

    //删除当前图表中的节点
    context.deleteSelectedNodes();
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
  context.deleteDynamicPort = deleteDynamicPort;
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