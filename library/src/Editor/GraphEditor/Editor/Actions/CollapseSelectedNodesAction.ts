import { NodeGraph, type INodeGraphDefine } from "@/Core/Graph/NodeGraph";
import { EditorHistoryAction } from "../History/Action";
import type { EditorHistoryNodeInfo } from "../History/InfoStorage";
import { printWarning } from "@/Common/Logger/DevLog";
import BaseNodes, { type IGraphCallNodeOptions } from "@/Nodes/Lib/BaseNodes";
import { Vector2 } from "@/Common/Base/Vector2";
import type { NodeConnector } from "@/Core/Node/NodeConnector";
import type { INodePortDefine, NodePort } from "@/Core/Node/NodePort";
import { NodeConnectorEditor } from "@/Core/Editor/NodeConnectorEditor";
import { AddNodeAction } from "./AddNodeAction";
import type { NodeEditor } from "@/Core/Editor/NodeEditor";
import type { NodePortEditor } from "@/Core/Editor/NodePortEditor";
import { DeleteSelectedNodesAction } from "./DeleteSelectedNodesAction";

export type CollapseSelectedNodesType = 'function'|'subgraph';
export type CollapseSelectedNodesParam = {
  to: CollapseSelectedNodesType,
  nodes: EditorHistoryNodeInfo[],
};

//TODO: 完成
export class CollapseSelectedNodesAction extends EditorHistoryAction<CollapseSelectedNodesParam, void, void> {
  constructor(to: CollapseSelectedNodesType) {
    super("展开子图表", (actionContext) => ({
      to,
      nodes: actionContext.toNodesInfoAndCancelIfEmpty(actionContext.context.selectionManager.getSelectNodes())
    }));
  }

  override async onStepExecute(inputParams: CollapseSelectedNodesParam) {
    const selectedNodes = this.context.selectionManager.getSelectNodes();
    if (selectedNodes.length < 0)
      return;

    for (const node of selectedNodes) {
      if (node.define.canNotDelete) {
        this.context.interfaceUtiles.userActionAlert('warning', '不能将基础节点折叠为子图表');
        return;
      }
    }

    const currentGraph = this.context.graphManager.getCurrentGraph();
    const region = this.context.viewPortManager.calcNodesRegion(selectedNodes);

    //创建子图表
    let childGraphDefine : INodeGraphDefine|null = null;
    let childGraphParent : NodeGraph|null = null;

    switch (inputParams.to) {
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
        throw new Error(`Unknow option ${inputParams.to}`);
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
    const innerConnectors = new Set<NodeConnectorEditor>();
    const inputConnectors = new Set<NodeConnectorEditor>();
    const outputConnectors = new Set<NodeConnectorEditor>();

    const solveConnector = (connector: NodeConnectorEditor, input: boolean) => {
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
    const callNode = await this.context.runAction<NodeEditor>(new AddNodeAction<IGraphCallNodeOptions>(BaseNodes.getScriptBaseGraphCall(), {
      addNodeInPos: region.getPoint(),
      intitalOptions: {
        callGraphName: childGraph.name,
        callGraphType: inputParams.to,
      },
    }));
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
        this.context.connectorManager.connectConnector(
          connector.startPort, 
          callNode!.getPortByGUID(portGuid) as NodePortEditor
        );
    }
    for (const connector of outputConnectors) {
      const portGuid = outerPortMapping.get(connector.uid);
      if (portGuid)
        this.context.connectorManager.connectConnector(
          callNode!.getPortByGUID(portGuid) as NodePortEditor,
          connector.endPort
        );
    }

    //删除当前图表中的节点
    await this.context.runAction(new DeleteSelectedNodesAction());
  }
}