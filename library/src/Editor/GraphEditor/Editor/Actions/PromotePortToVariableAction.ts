import type { NodePortEditor } from "@/Core/Editor/NodePortEditor";
import type { EditorHistoryNodeConnectorInfo, EditorHistoryNodePortInfo } from "../History/InfoStorage";
import { NodeVariable } from "@/Core/Graph/NodeVariable";
import { EditorHistoryAction } from "../History/Action";
import { Vector2 } from "@/Common/Base/Vector2";
import { addVariableNode } from "./Shared/Nodes";
import { StraightenConnectorAction } from "./StraightenConnectorAction";
import { removeItemFromArrayBy } from "@/Common/ArrayTools";

export class PromotePortToVariableAction extends EditorHistoryAction<EditorHistoryNodePortInfo, { connector: EditorHistoryNodeConnectorInfo; name: string; }, void> {
  constructor(port: NodePortEditor) {
    super("提升端口为变量", (actionContext) => actionContext.toNodePortInfo(port));
  }

  protected override async onStepExecute(inputParams: EditorHistoryNodePortInfo) {
    const port = inputParams.requestInstance();
    const graph = this.context.graphManager.getCurrentGraph();
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
    const node = await addVariableNode(
      this.context,
      graph.uid, 
      name, 
      port.isInput ? 'get' : 'set', 
      (port as NodePortEditor).getPortPositionViewport().substract(new Vector2(port.isInput ? 180 : -100, 0))
    );
    if (!node)
      return;

    //连接端口与变量节点
    const connector = this.context.connectorManager.connectConnector(
      node.getPortByGUID(port.isInput ? 'OUTPUT' : 'INPUT') as NodePortEditor,
      port as NodePortEditor
    );
    if (!connector)
      return;

    this.context.interfaceUtiles.userInterfaceNextTick(() => {
      //拉直连接
      this.context.runAction(new StraightenConnectorAction(port, connector));
    });

    return {
      connector: this.actionContext.toNodeConnectorInfo(connector),
      name,
    }
  }
  protected override async onStepUndo(restoreData: { connector: EditorHistoryNodeConnectorInfo; name: string; }) {
    const graph = this.context.graphManager.getCurrentGraph();
    this.context.connectorManager.unConnectConnector(restoreData.connector.requestInstance());
    removeItemFromArrayBy(graph.variables, (g) => g.name === restoreData.name);
  }
}