import { nextTick, ref, type Ref } from "vue";
import { NodeEditor } from "@/Core/Editor/NodeEditor";
import { Vector2 } from "@/Common/Base/Vector2";
import { NodePortEditor } from "@/Core/Editor/NodePortEditor";
import { NodeConnectorEditor } from "@/Core/Editor/NodeConnectorEditor";
import { NodeVariable } from "@/Core/Graph/NodeVariable";
import { printError, printWarning } from "@/Common/Logger/DevLog";
import { NodeRegistry } from "@/Core/Registry/NodeRegistry";
import { NodeGraph, type INodeConnectorSaveData, type INodeGraphDefine, type INodeSaveData } from "@/Core/Graph/NodeGraph";
import { NodeGraphEditorInternalMessages } from "./Messages/EditorInternalMessages";
import { Rect } from "@/Common/Base/Rect";
import type { Node, INodeDefine, NodeBreakPoint, CustomStorageObject } from "@/Core/Node/Node";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import type { NodeConnector } from "@/Core/Node/NodeConnector";
import type { INodePortDefine, NodePort } from "@/Core/Node/NodePort";
import BaseNodes, { getGraphCallNodeGraph, type IGraphCallNodeOptions } from "@/Nodes/Lib/BaseNodes";
import { removeItemFromArrayBy } from "@/Common/ArrayTools";


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
   * 初始化单元的shadow数据
   */
  intitalShadow?: INodeDefine;
  /**
   * 初始化单元的 options 数据
   */
  intitalOptions?: T|undefined,
  /**
   * If set to true will log error to console, failse will ALERT error with messagebox.
   * 
   * @default false
   */
  noErrorAlert?: boolean,
  /**
   * 是否重用UID
   */
  reuseUid?: string;
}
export interface NodeEditorUserControllerContext {
  interfaceUtiles: {
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
     * 等待下一个界面更新
     */
    userInterfaceWaitNextTick(): Promise<void>;
    /**
     * 显示位置指示器
     * @param rectViewPort 视口矩形坐标 
     */
    showPositionIndicator(rectViewPort: Rect) : void;
    /**
     * 显示节点或者端口位置指示器
     * @param nodeOrPort 节点或者端口 
     */
    showNodePositionIndicator(nodeOrPort : NodeEditor|NodePortEditor): void;
  },
  userActionsManager: {
    /**
     * 用户添加单元
     * @param define 单元定义
     * @param options 自定义配置 
     */
    addNode<T = CustomStorageObject>(define: INodeDefine, options: NodeEditorUserAddNodeOptions<T>) : Promise<Node|null>;
    /**
     * 用户删除操作
     */
    delete() : Promise<void>;
    /**
     * 用户删除端口
     * @param nodePort 
     */
    deletePort(nodePort: NodePortEditor) : Promise<void>;
    /**
     * 添加图表变量节点
     * @param uid 图表UID
     * @param name 变量名称
     * @param type 添加类型
     */
    addVariableNode(uid: string, name: string, type: 'get'|'set', pos?: Vector2): Promise<Node|null>;
    /**
     * 提升为变量
     * @param port 
     * @returns 
     */
    promotePortToVariable(port: NodePort): Promise<void>; 
    /**
     * 提升图表节点为函数
     * @param node 必须是调用图表节点 
     */
    promoteSubgraphToFunction(node: Node): Promise<void>;
    /**
     * 折叠当前选中的节点为函数或者子图表
     * @param to 
     */
    collapseSelectedNodesTo(to: 'function'|'subgraph'): Promise<void>;
    /**
     * 展开子图表
     * @param node 选中节点
     */
    expandSubgraphConfirm(node: Node): Promise<void>;
    /**
     * 展开子图表
     * @param subgraph 子图表
     */
    expandSubgraph(subgraph: NodeGraph) : Promise<void>;
    /**
     * Deletes a dynamic port from the editor.
     * 
     * * 历史记录：此函数会保存历史记录
     * @param port - The dynamic port to delete.
     */
    deleteDynamicPort(port: NodePort) : Promise<void>;
    /**
     * 删除选中连接线
     * 
     * * 历史记录：此函数会保存历史记录
     */
    deleteSelectedConnectors() : Promise<void>;
    /**
     * 删除选中的单元
     * 
     * * 历史记录：此函数会保存历史记录
     */
    deleteSelectedNodes() : Promise<void>;
    /**
     * 删除选中单元的连接
     * 
     * * 历史记录：此函数会保存历史记录
     */
    unConnectSelectedNodeConnectors() : Promise<void>;
    /**
     * 设置选中单元断点状态
     * 
     * * 历史记录：此函数会保存历史记录
     * @param node 
     * @param state 
     */
    setNodeBreakpointState(node: Node, state : NodeBreakPoint) : Promise<void>;
    /**
     * 设置选中单元断点状态
     * 
     * * 历史记录：此函数会保存历史记录
     */
    setSelectedNodeBreakpointState(state : NodeBreakPoint) : Promise<void>;
    /**
     * 拉直连接
     * 
     * * 历史记录：此函数会保存历史记录
     * @param refPort 拉直参考端口
     * @param connector 连接
     * @returns 
     */
    straightenConnector(refPort : NodePortEditor, connector : NodeConnector) : Promise<void>;
    /**
     * 对齐节点
     * 
     * * 历史记录：此函数会保存历史记录
     * @param baseNode 参考基准节点
     * @param align 对齐方向
     */
    alignSelectedNode(baseNode : NodeEditor, align : 'left'|'top'|'right'|'bottom'|'center-x'|'center-y') : Promise<void>;
    /**
     * 为选中项创建注释
     * 
     * * 历史记录：此函数会保存历史记录
     */
    genCommentForSelectedNode() : Promise<void>;
  },
}

const TAG = 'EditorUserController';

/**
 * Custom hook for the Editor User Controller.
 * This hook provides various utility functions for manipulating the editor nodes and connectors.
 *
 * @param context The internal context of the Node Graph Editor.
 */
export function useEditorUserController(context: NodeGraphEditorInternalContext) {

  const positionIndicatorOn = ref(false);
  const positionIndicatorPos = ref(new Rect());

  let autoNodeSizeChangeCheckerTimer = 0;

  function autoNodeSizeChangeCheckerStartStop(start: boolean) {
    if (autoNodeSizeChangeCheckerTimer) {
      clearInterval(autoNodeSizeChangeCheckerTimer);
      autoNodeSizeChangeCheckerTimer = 0;
    }
    if (start) {
      autoNodeSizeChangeCheckerTimer = setInterval(() => {
        context.selectionManager.getSelectNodes().forEach((n) => n.editorHooks.callbackDoAutoResizeCheck?.())
      }, 1000) as any as number;
    }
  }
  function updateNodeForMoveEnd(node: Node) {
    (node as NodeEditor).editorHooks.callbackUpdateNodeForMoveEnd?.();
  }

  //删除节点
  function deleteNode(node: NodeEditor) {
    if (node.define.canNotDelete) 
      return false;
    context.graphManager.removeNode(node, true);
    return true;
  }
  //重做步骤重做相关连接线
  function restoreConectors(restoreData: INodeConnectorSaveData[]) {
    for (const connector of restoreData) {
      const startPortInstance = context.graphManager.getNodePortByUid(connector.startPort.nodeUid, connector.startPort.portUid);
      const endPortInstance = context.graphManager.getNodePortByUid(connector.endPort.nodeUid, connector.endPort.portUid);
      if (!startPortInstance || !endPortInstance)
        continue;
      context.connectorManager.connectConnector(startPortInstance, endPortInstance, connector.uid);
    }
  }
  //下方是包装操作，无历史记录
  async function deletePort(port: NodePort) {
    if (port.dyamicAdd) {
      if (port.isCallingDelete) {
        await context.userActionsManager.deleteDynamicPort(port as NodePortEditor);
      } else {
        port.isCallingDelete = true;
        const ret = port.parent.events.onUserDeletePort?.(port.parent as NodeEditor, context, port);
        port.isCallingDelete = false;
        if (!ret) {
          await context.userActionsManager.deleteDynamicPort(port as NodePortEditor);
          return;
        }
        if (ret instanceof Promise) {
          const rs = await ret; 
          if (rs)
            await context.userActionsManager.deleteDynamicPort(port as NodePortEditor);
        }
        else if (ret === true)
          await context.userActionsManager.deleteDynamicPort(port as NodePortEditor);
      }
    }
  }
  async function deleteHandler() {
    if(context.keyboardManager.isKeyAltDown())
      await context.userActionsManager.deleteSelectedConnectors();
    else 
      await context.userActionsManager.deleteSelectedNodes();
  }
  async function expandSubgraphConfirm(node: Node) {
    const confirm = await context.interfaceUtiles.userActionConfirm(
      'warning', 
      '确定展开选中的图表/函数？如果有其它节点调用此子图表，将会失去调用'
    );
    if (confirm) {
      const callGraph = getGraphCallNodeGraph(context, node);
      if (callGraph)
        context.userActionsManager.expandSubgraph(callGraph);
      else
        context.dialogManager.showSmallTip('调用图标丢失');
    }
  }

  context.userActionsManager = {
    deleteSelectedConnectors() {
      return context.historyManager.beginUndoableAction(
        "删除选中的连接线", 
        (actionContext) => actionContext.toNodeConnectorsInfoAndCancelIfEmpty(
          context.selectionManager.getSelectConnectors()
        ),
        async (info, actionContext) => {
          const connectors = actionContext.fromNodeConnectorsInfo(info);
          //删除选中的连接线
          connectors.forEach((c) => context.connectorManager.unConnectConnector(c));
          return connectors.map(p => p.save('graph')) as INodeConnectorSaveData[];;
        },
        (restoreData) => {
          restoreConectors(restoreData);
        }
      );
    },
    unConnectSelectedNodeConnectors() {
      return context.historyManager.beginUndoableAction(
        "取消选中单元的所有连接线", 
        (actionContext) => actionContext.toNodesInfoAndCancelIfEmpty(
          context.selectionManager.getSelectNodes()
        ),
        async (info, actionContext) => {
          const nodes = actionContext.fromNodesInfo(info);
          const deletedConnectors : INodeConnectorSaveData[] = [];

          //取消选中单元的所有连接线
          nodes.forEach((node) => 
            deletedConnectors.push(
              ...context.connectorManager
                .unConnectNodeConnectors(node)
                .map(p => p.save('graph')) as INodeConnectorSaveData[]
            )
          );
          return deletedConnectors;
        }, 
        (restoreData) => {
          restoreConectors(restoreData);
        }
      );
    },
    deleteSelectedNodes() {
      return context.historyManager.beginUndoableAction(
        "删除选中单元", 
        (actionContext) => actionContext.toNodesInfoAndCancelIfEmpty(
          context.selectionManager.getSelectNodes()
        ),
        async(info, actionContext) => {
          const nodes = actionContext.fromNodesInfo(info);
          const deletedNodes : INodeSaveData[] = [];

          //删除选中单元
          for (const node of nodes) {
            if (node.define.canNotDelete) 
              continue;
            if (context.graphManager.removeNode(node, true))
              deletedNodes.push({
                uid: node.uid,
                guid: node.guid,
                node: node.save('graph')
              });
          }
          context.selectionManager.unSelectAllNodes();

          return deletedNodes;
        }, 
        (restoreData) => {
          const registry = NodeRegistry.getInstance();
          for (const node of restoreData) {
            const define = registry.getNodeByGUID(node.guid);
            if (!define)
              continue;
            context.userActionsManager.addNode(define, {
              noErrorAlert: true,
              intitalShadow: node.node,
              reuseUid: node.uid,
            });
          }
        }
      );
    },
    deleteDynamicPort(_port: NodePort) {
      if (!_port.dyamicAdd)
        throw new Error('The port is not a dynamic port.');

      return context.historyManager.beginUndoableAction(
        "删除动态端口", 
        (actionContext) => actionContext.toNodePortInfo(_port as NodePortEditor),
        async (info, actionContext) => {
          const port = info.requestInstance();

          const deletedInfo = {
            nodeInfo: actionContext.toNodeInfo(port.parent as NodeEditor),
            portInfo: port.save() as INodePortDefine,
            connectorsInfo: [] as INodeConnectorSaveData[],
          };

          //删除端口
          const parent = port.parent as NodeEditor;
          parent.deletePort(port);

          //删除端口所属连接线
          for (let i = parent.connectors.length - 1; i >= 0; i--) {
            const connector = parent.connectors[i];
            if (connector.startPort === port || connector.endPort === port)
              deletedInfo.connectorsInfo.push(
                context.connectorManager
                  .unConnectConnector(connector as NodeConnectorEditor)
                  .save('graph')
              );
          }

          return deletedInfo;
        }, 
        (restoreData) => {
          const node = restoreData.nodeInfo.requestInstance();
          node.addPort(restoreData.portInfo, true);
          restoreConectors(restoreData.connectorsInfo);
        }
      );
    },
    straightenConnector(_refPort : NodePortEditor, _connector : NodeConnectorEditor) {
      return context.historyManager.beginUndoableAction(
        "拉直连接", 
        (actionContext) => ({
          refPort: actionContext.toNodePortInfo(_refPort),
          connector: actionContext.toNodeConnectorInfo(_connector),
        }),
        async (info, actionContext) => {
          const refPort = info.refPort.requestInstance();
          const connector = info.connector.requestInstance();

          if (!refPort || !connector)
            return;
          if(!connector.startPort || !connector.endPort)
            return;

          //获取参考位置
          const refPos = refPort.getPortPositionViewport();
          let node : Node|null = null;
          let oldPos : Vector2|null = null;
    
          //获取另一端的节点
          if(connector.startPort === refPort) {
            node = connector.endPort.parent;
            oldPos = (connector.endPort as NodePortEditor).getPortPositionViewport();
          }
          else if(connector.endPort === refPort)  {
            node = connector.startPort.parent;
            oldPos = (connector.startPort as NodePortEditor).getPortPositionViewport();
          }
    
          if(node && oldPos) {
            //设置位置
            const offPos = oldPos.y - node.position.y;

            return actionContext
              .toNodeInfo(node as NodeEditor)
              .storeChangedProperty('position', new Vector2(node.position.x, refPos.y - offPos))
              .afterChanged(() =>  updateNodeForMoveEnd(node));
          }
          return;
        }, 
        (info) => {
          //还原节点位置
          info.restoreChangedProperty('position');
        }
      );
    },
    alignSelectedNode(_baseNode : NodeEditor, _align : 'left'|'top'|'right'|'bottom'|'center-x'|'center-y') {
      return context.historyManager.beginUndoableAction(
        "对齐选中节点", 
        (actionContext) => ({
          selectedNodes: actionContext.toNodesInfoAndCancelIfEmpty(context.selectionManager.getSelectNodes()),
          baseNode: actionContext.toNodeInfo(_baseNode),
          align: _align,
        }),
        async (info) => {
          const baseNode = info.baseNode.requestInstance();
          const baseNodeSize = baseNode.getRealSize();
          switch(info.align) {
            case 'left':
              info.selectedNodes.forEach((node) => {
                node
                  .storeChangedProperty<Vector2>('position', (oldValue) => new Vector2(baseNode.position.x, oldValue.y))
                  .afterChanged((b) =>  updateNodeForMoveEnd(b));
              });
              break;
            case 'top':
              info.selectedNodes.forEach((node) => {
                node
                  .storeChangedProperty<Vector2>('position', (oldValue) => new Vector2(oldValue.x, baseNode.position.y))
                  .afterChanged((b) =>  updateNodeForMoveEnd(b));
              });
              break;
            case 'center-x': {
              const center = baseNode.position.x + baseNodeSize.x / 2;
              info.selectedNodes.forEach((node) => {
                node
                  .storeChangedProperty<Vector2>('position', (oldValue, instance) => new Vector2(center + instance.getRealSize().x / 2, oldValue.y))
                  .afterChanged((b) =>  updateNodeForMoveEnd(b));
              });
              break;
            }
            case 'center-y': {
              const center = baseNode.position.y + baseNodeSize.y / 2;
              info.selectedNodes.forEach((node) => {
                node
                  .storeChangedProperty<Vector2>('position', (oldValue, instance) => new Vector2(oldValue.x, center + instance.getRealSize().y / 2))
                  .afterChanged((b) =>  updateNodeForMoveEnd(b));
              });
              break;
            }
            case 'right': {
              const right = baseNode.position.x + baseNodeSize.x;
              info.selectedNodes.forEach((node) => {
                node
                  .storeChangedProperty<Vector2>('position', (oldValue) => new Vector2(right - baseNodeSize.x, oldValue.y))
                  .afterChanged((b) =>  updateNodeForMoveEnd(b));
              });
              break;
            }
            case 'bottom': {
              const bottom = baseNode.position.y + baseNodeSize.y;
              info.selectedNodes.forEach((node) => {
                node
                  .storeChangedProperty<Vector2>('position', (oldValue) => new Vector2(oldValue.x, bottom - baseNodeSize.y))
                  .afterChanged((b) =>  updateNodeForMoveEnd(b));
              });
              break;
            }
          }
        }, 
        (_, info) => {
          info.selectedNodes.forEach((node) => node.restoreChangedProperty('position'));
        }
      );
    },
    setSelectedNodeBreakpointState(state : NodeBreakPoint) {
      return context.historyManager.beginUndoableAction(
        "设置选中节点的断点状态", 
        (actionContext) => actionContext.toNodesInfoAndCancelIfEmpty(
          context.selectionManager.getSelectNodes()
        ),
        async (info, actionContext) => {
          //设置选中节点的断点状态
          const nodes = actionContext.fromNodesInfo(info);
          nodes.forEach((n) => this.setNodeBreakpointState(n, state));
        }
      );
    },
    setNodeBreakpointState(_node: Node, _state : NodeBreakPoint) {
      return context.historyManager.beginUndoableAction(
        "设置节点的断点状态", 
        (actionContext) => ({
          node: actionContext.toNodeInfo(_node as NodeEditor),
          state: _state,
        }),
        async (info) => {
          info.node
            .storeChangedProperty('breakpoint', info.state)
            .afterChanged((node) => context.postUpMessage(NodeGraphEditorInternalMessages.NodeBreakpointStateChanged, { node }));
        }, 
        (_, info) => {
          info.node
            .restoreChangedProperty('breakpoint')
            .afterChanged((node) => context.postUpMessage(NodeGraphEditorInternalMessages.NodeBreakpointStateChanged, { node }));
        }
      );
    },
    genCommentForSelectedNode() {  
      return context.historyManager.beginUndoableAction(
        "为选中项创建注释", 
        (actionContext) => actionContext.toNodesInfoAndCancelIfEmpty(context.selectionManager.getSelectNodes()),
        async (info, actionContext) => {

          //计算选中节点的矩形，并创建住宿节点
          const selectedNodes = actionContext.fromNodesInfo(info);
          const rect = context.viewPortManager.calcNodesRegion(selectedNodes);

          actionContext.beginNoUndoableRegion();

          const node = await this.addNode(BaseNodes.getScriptBaseCommentNode(), {
            //设置位置
            addNodeInPos: new Vector2(rect.x - 15, rect.y - 15 - 50)
          });

          actionContext.endNoUndoableRegion();

          if (!node)
            return;

          //调整大小为矩形大小
          node.customSize.set(rect.w + 30, rect.h + 30 + 50);

          return actionContext.toNodeInfo(node as NodeEditor);
        }, 
        (restoreData) => {
          deleteNode(restoreData.requestInstance());
        }
      );
    },
    promotePortToVariable(_port: NodePort) {
      return context.historyManager.beginUndoableAction(
        "提升端口为变量", 
        (actionContext) => actionContext.toNodePortInfo(_port as NodePortEditor),
        async (info, actionContext) => {

          const port = info.requestInstance();
          const graph = context.graphManager.getCurrentGraph();
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
          const node = await this.addVariableNode(
            graph.uid, 
            name, 
            port.isInput ? 'get' : 'set', 
            (port as NodePortEditor).getPortPositionViewport().substract(new Vector2(port.isInput ? 180 : -100, 0))
          );
          if (!node)
            return;

          //连接端口与变量节点
          const connector = context.connectorManager.connectConnector(
            node.getPortByGUID(port.isInput ? 'OUTPUT' : 'INPUT') as NodePortEditor,
            port as NodePortEditor
          );
          if (!connector)
            return;

          context.interfaceUtiles.userInterfaceNextTick(() => {
            //拉直连接
            this.straightenConnector(port as NodePortEditor, connector);
          });

          return {
            connector: actionContext.toNodeConnectorInfo(connector as NodeConnectorEditor),
            name,
          }
        }, 
        (restoreData) => {
          const graph = context.graphManager.getCurrentGraph();
          context.connectorManager.unConnectConnector(restoreData.connector.requestInstance());
          removeItemFromArrayBy(graph.variables, (g) => g.name === restoreData.name);
        }
      );
    },
    addNode<T = CustomStorageObject>(_define: INodeDefine, _options: NodeEditorUserAddNodeOptions<T>) {
      return context.historyManager.beginUndoableAction(
        "添加节点",
        () => ({
          define: _define,
          options: _options,
        }),
        async (info, actionContext) => {
          const { define, options } = info;
          const currentGraph = context.graphManager.getCurrentGraph();

          //检查单元是否只能有一个
          if(define.oneNodeOnly && currentGraph?.getNodesByGUID(define.guid).length > 0) {  
            if (options.noErrorAlert)   
              printWarning(TAG, null, '当前文档中已经有 ' + define.name + ' 了，此单元只能有一个');
            else
              context.interfaceUtiles.userActionAlert('warning', '当前文档中已经有 ' + define.name + ' 了，此单元只能有一个');
            return null;
          }
          //自定义检查回调
          if(typeof define.events?.onAddCheck === 'function') {
            const err = define.events.onAddCheck(define, currentGraph);
            if(err !== null) {
              if (options.noErrorAlert)   
                printWarning(TAG, null, err);
              else
                context.interfaceUtiles.userActionAlert('warning', err);
              return null;
            }
          }
          //重用UID
          if (options.reuseUid && context.graphManager.getNodeByUid(options.reuseUid) !== null)
            throw new Error(`Connector reuse uid failed, uid ${options.reuseUid} already used.`);

          const newNode = new NodeEditor(define);
          newNode.load();
          if (options.intitalShadow) {
            const shadowSettings = newNode.loadShadow(options.intitalShadow, 'graph');
            newNode.mergeShadow(shadowSettings);
          }
          //配置
          if (options.intitalOptions)
            newNode.options = options.intitalOptions;
          if (options.reuseUid)
            newNode.uid = options.reuseUid;
          //事件
          newNode.events.onCreate?.(newNode);

          if(context.connectorManager.isConnectToNew()) { //添加单元并连接
            const connectingEndPos = context.connectorManager.getConnectingInfo().endPos;
            newNode.position.set(connectingEndPos);
            context.graphManager.addNode(newNode);
            const [ port, _connector ] = context.connectorManager.endConnectToNew(newNode);  
            const pos = new Vector2();

            //强制同步连接线位置，保证显示正确
            if (_connector && _connector instanceof NodeConnectorEditor) {
              const connector = (_connector as NodeConnectorEditor);
              connector.forceSetPos(undefined, connectingEndPos);
            }

            //延时以保证VUE将节点原件加载完成，获取端口的位置
            context.interfaceUtiles.userInterfaceNextTick(() => {
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
              await context.interfaceUtiles.userInterfaceWaitNextTick();
              
              const size = newNode.getRealSize();
              newNode.position.x -= size.x / 2;
              newNode.position.y -= size.y / 2;
              newNode.updateRegion();
            }
            context.graphManager.addNode(newNode)
          } else { //在屏幕中央位置添加单元
            const center = context.viewPortManager.getViewPort().rect().calcCenter();
            newNode.position.set(center);
            context.graphManager.addNode(newNode);
          }

          actionContext.setDoingReturn(newNode);

          return actionContext.toNodeInfo(newNode);
        },
        (restoreData) => {
          deleteNode(restoreData.requestInstance());
        },
      );
    },
    promoteSubgraphToFunction(_node: Node) {
      return context.historyManager.beginUndoableAction(
        "提升图表节点为函数",
        (actionContext) => actionContext.toNodeInfo(_node as NodeEditor),
        async (info) => {
          //将图表类型更改为函数或者静态函数
          //移动图表至文档根
          //更改调用节点设置
          const node = info.requestInstance();
          const options = (node.options as unknown as IGraphCallNodeOptions);
          const callGraphName = options.callGraphName;
          const graph = context.graphManager.getCurrentGraph().getChildGraphByName(callGraphName);
          if (!graph) {
            printError(TAG, null, `Not found graph for node ${node.uid}`);
            return;
          }
          const doc = graph.getParentDocunment();
          if (!doc) {
            printError(TAG, null, `Not found ParentDocunment for graph ${graph.uid}`);
            return;
          }
          const mainGraph = doc.mainGraph;
          if (!mainGraph) {
            printError(TAG, null, `Not found mainGraph for doc ${doc.name}`);
            return;
          }

          const restoreData = {
            graph,
            graphOldParent: graph.parent as NodeGraph,
            mainGraph,
            callGraphName,
          };

          graph.type = mainGraph.type === 'class' ? 'function' : 'static';

          restoreData.graphOldParent.removeChildren(graph);
          mainGraph.addChildren(graph);

          context.graphManager.sendMessageToFilteredNodes(`GraphCall${callGraphName}`, BaseNodes.messages.GRAPH_PROMOTE, { type: 'function' });
        
          return restoreData;
        },
        (restoreData) => {
          restoreData.mainGraph.removeChildren(restoreData.graph);
          restoreData.graphOldParent.addChildren(restoreData.graph);

          context.graphManager.sendMessageToFilteredNodes(`GraphCall${restoreData.callGraphName}`, BaseNodes.messages.GRAPH_PROMOTE, { type: 'subgraph' });
        },
      );
    },
    expandSubgraph(subgraph: NodeGraph) {
      /**
       * 触发展开图表
       *   添加节点到图表 ... n
       *   链接图表调用节点
       *   删除图表调用节点
       *   删除子图表 <-- 此步骤影响其他编辑器
       */

      return context.historyManager.beginUndoableAction(
        "展开子图表",
        (actionContext) => {

          return {
            subgraph: actionContext.toNodeGraphInfo
          }
        },
        async (info, actionContext) => {
          
          const currentGraph = context.graphManager.getCurrentGraph();

          currentGraph.children.push(...subgraph.children);
          currentGraph.children.remove(subgraph);
      
          const callNodes = context.graphManager.filterNodes(`GraphCall${subgraph.name}`);
          for (const callNode of callNodes) {
            const callPos = callNode.position;
            const copyNodeUidMapping = new Map<string, string>();
            const filteredNodeArray : NodeEditor[] = [];
      
            for (const node of subgraph.nodes.values()) {
              if (!node.isGraphInOutNode)
                filteredNodeArray.push(node as NodeEditor);
            }
      
            const region = context.viewPortManager.calcNodesRegion(filteredNodeArray);
      
            for (const node of filteredNodeArray) {
              if (!node.isGraphInOutNode) {
                const newNode = await this.addNode(node.define, {
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
                context.connectorManager.connectConnector(startPort as NodePortEditor, endPort as NodePortEditor);
              else
                printError(TAG, null, `expandSubgraph: Failed to connect ${connector.startPort.guid} to ${connector.endPort.guid} connector uid: (${connector.uid})`);
            }
      
            deleteNode(callNode);
          }
        },
        (restoreData) => {
          
        }
      );
    },
    collapseSelectedNodesTo(to: 'function'|'subgraph') {
      return context.historyManager.beginUndoableAction(
        "展开子图表",
        () => ({}),
        async (info, actionContext) => {
          

          const selectedNodes = context.selectionManager.getSelectNodes();
          if (selectedNodes.length < 0)
            return;
      
          for (const node of selectedNodes) {
            if (node.define.canNotDelete) {
              context.interfaceUtiles.userActionAlert('warning', '不能将基础节点折叠为子图表');
              return;
            }
          }
      
          const currentGraph = context.graphManager.getCurrentGraph();
          const region = context.viewPortManager.calcNodesRegion(selectedNodes);
      
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
              printWarning(TAG, null, `Unknow option ${to}`);
              return;
          }
      
          const childGraph = new NodeGraph(childGraphDefine, childGraphParent, true);
          childGraph.load(childGraphDefine);
          childGraph.initNew();
          currentGraph.addChildren(childGraph);
      
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
          const callNode = await context.userActionsManager.addNode<IGraphCallNodeOptions>(BaseNodes.getScriptBaseGraphCall(), {
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
              context.connectorManager.connectConnector(
                connector.startPort as NodePortEditor, 
                callNode!.getPortByGUID(portGuid) as NodePortEditor
              );
          }
          for (const connector of outputConnectors) {
            const portGuid = outerPortMapping.get(connector.uid);
            if (portGuid)
              context.connectorManager.connectConnector(
                callNode!.getPortByGUID(portGuid) as NodePortEditor,
                connector.endPort as NodePortEditor
              );
          }
      
          //删除当前图表中的节点
          context.userActionsManager.deleteSelectedNodes();
        },
        (restoreData) => {
          
        }
      );
    },
    //下方是包装操作，无历史记录
    async addVariableNode(uid: string, name: string, type: 'get'|'set', pos?: Vector2) {
      const currentGraph = context.graphManager.getCurrentGraph();
      if (currentGraph.uid !== uid)
        return null;

      const variable = currentGraph.variables.find(v => v.name === name);
      if (!variable) {
        context.interfaceUtiles.userActionAlert('error', `未找到变量 ${name}`);
        return null;
      }

      if (type === 'get') {
        return this.addNode(BaseNodes.getScriptBaseVariableGet(), {
          addNodeInPos: pos ?? context.mouseManager.getMouseInfo().mouseCurrentPosViewPort,
          intitalOptions: { variable: variable.name },
        });
      } else {
        return this.addNode(BaseNodes.getScriptBaseVariableSet(), {
          addNodeInPos: pos ?? context.mouseManager.getMouseInfo().mouseCurrentPosViewPort,
          intitalOptions: { variable: variable.name },
        });
      }
    },
    deletePort,
    delete: deleteHandler,
    expandSubgraphConfirm,
  };
  context.interfaceUtiles = {
    userActionAlert(type: 'error'|'warning'|'help', message: string) {
      context.dialogManager.showModal({
        icon: type,
        content: message
      });
    },
    userActionConfirm(type: 'error'|'warning'|'help', message: string) {
     return context.dialogManager.showConfirm({
        icon: type,
        content: message
      });
    },
    userInterfaceNextTick(cb: () => void) {
      nextTick(cb);
    },
    userInterfaceWaitNextTick() {
      return new Promise((resolve) => {
        nextTick(resolve);
      });
    },
    showNodePositionIndicator(nodeOrPort : NodeEditor|NodePortEditor) {
      if (nodeOrPort instanceof NodeEditor) {
        const rect = nodeOrPort.getRect();
        rect.x -= 4;
        rect.y -= 4;
        this.showPositionIndicator(rect);
      }
      else {
        const pos = nodeOrPort.getPortPositionViewport();
        this.showPositionIndicator(new Rect(pos.x - 20, pos.y - 15, 50, 23));
      }
    },
    showPositionIndicator(rectViewPort: Rect) {
      positionIndicatorPos.value = rectViewPort;
      if (positionIndicatorOn.value) {
        positionIndicatorOn.value = false;
        nextTick(() => positionIndicatorOn.value = true)
      } else {
        positionIndicatorOn.value = true;
      }
    },
  };
  context.internalManager.autoNodeSizeChangeCheckerStartStop = autoNodeSizeChangeCheckerStartStop;

  //Register shortcuts
  context.keyboardManager.registerShortcut({
    key: 'Delete',
    callback() {
      context.userActionsManager.delete();
    },
  });
  context.keyboardManager.registerShortcut({
    key: 'Digit0',
    callback() {
      context.zoomManager.zoomSet(100);
    },
  });
  context.keyboardManager.registerShortcut({
    key: 'KeyA',
    callback() {
      if(context.keyboardManager.isKeyAltDown()) context.selectionManager.selectAllConnectors();
      else if(context.keyboardManager.isKeyControlDown()) context.selectionManager.selectAllNodes();
    },
  });
  context.keyboardManager.registerShortcut({
    key: 'KeyZ',
    keyControl: true,
    callback: () => context.historyManager.undoStep(),
  });
  context.keyboardManager.registerShortcut({
    key: 'KeyY',
    keyControl: true,
    callback: () => context.historyManager.redoStep(),
  });
  context.keyboardManager.registerShortcut({
    key: 'KeyC',
    keyControl: true,
    callback: () => context.clipBoardManager.copySelectionNodes(),
  });
  context.keyboardManager.registerShortcut({
    key: 'KeyX',
    keyControl: true,
    callback: () => context.clipBoardManager.cutSelectionNodes(),
  });
  context.keyboardManager.registerShortcut({
    key: 'KeyV',
    keyControl: true,
    callback: () => context.clipBoardManager.pasteNodes(),
  });

  return {
    positionIndicatorOn,
    positionIndicatorPos: positionIndicatorPos as Ref<Rect>,
  }
}