import { printWarning } from "@/node-blueprint/Base/Logger/DevLog";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import { NodeRegistry } from "@/node-blueprint/Base/Flow/Registry/NodeRegistry";
import { Rect } from "@/node-blueprint/Base/Utils/Base/Rect";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import type { Node } from "@/node-blueprint/Base/Flow/Node/Node";
import type { INodeConnectorSaveData, INodeSaveData } from "@/node-blueprint/Base/Flow/Graph/NodeGraph";
import type { NodeConnectorEditor } from "../Flow/NodeConnectorEditor";
import type { IKeyValueObject } from "@/node-blueprint/Base/Utils/BaseTypes";

/**
 * 编辑器的剪贴板控制器上下文函数
 */
export interface NodeEditorClipBoardControllerContext {

  clipBoardManager: {
    /**
     * 剪切选中的单元
     * @returns 
     */
    cutSelectionNodes: () => void;
    /**
     * 复制选中的单元
     * @returns 
     */
    copySelectionNodes: () => void;
    /**
     * 从剪贴板粘贴单元
     * @returns 
     */
    pasteNodes: () => void;
    /**
     * 获取剪贴板是否可以粘贴单元
     * @returns 
     */
    isPasteable: () => boolean;
  }
}

/**
 * 编辑器的剪贴板控制器
 * @param options 
 * @returns 
 */
export function useEditorClipBoardController(context: NodeGraphEditorInternalContext) {
  
  const TAG = "EditorClipBoardController";

  function cutOrCopySelectionNodes(cut : boolean) {
    const selectedNodes = context.getSelectNodes();
    const selectedConnectors = new Set<NodeConnectorEditor>();

    if (selectedNodes.length === 0)
      return;

    //从选中节点中选择他们的连接线
    for (const selectedNode of selectedNodes) {
      for (const connector of selectedNode.connectors)
        selectedConnectors.add(connector);
    }

    const storedData = {
      nodes: selectedNodes.map(p => {
        return {
          guid: p.guid,
          uid: p.uid,
          node: p.save('graph'),
        } as INodeSaveData
      }),
      connectors: Array.from(selectedConnectors).map(p => p.save('graph')),
      selectedNodesRect: (
        selectedNodes.length > 2 ? selectedNodes.reduce((r, node) => {
          ///计算出选中节点的方框
          let rect = r as any as Rect;
          if (!(rect instanceof Rect))
            rect = r.getRect();
          rect.grow(node.getRect());
          return rect as any
        }) : selectedNodes[0].getRect()
      ).save(),
    };

    if (cut)
      context.deleteSelectedNodes();

    //写入剪贴板
    navigator.clipboard.writeText(JSON.stringify(storedData)).catch(handleClipboardError);
  }

  function cutSelectionNodes() {
    cutOrCopySelectionNodes(true);
  }
  function copySelectionNodes() {
    cutOrCopySelectionNodes(false);
  }
  async function pasteNodes() {
    let res = '';
    let json = {} as {
      selectedNodesRect: IKeyValueObject,
      nodes: INodeSaveData[],
      connectors: INodeConnectorSaveData[],
    };
    try {
      res = await navigator.clipboard.readText();
    } catch (e) {
      handleClipboardError(e);
      return;
    }

    if (res === '')
      return;
    try {
      json = JSON.parse(res);
    } catch (e) {
      printWarning(TAG, null, `Failed to prase clipboard text`, e);
      return;
    }

    const nodeRegistry = NodeRegistry.getInstance();

    //计算出选中节点的方框，其中的节点位置与方框相减得出相对位置
    const selectedNodesRect = new Rect().load(json.selectedNodesRect);
    const mousePos = new Vector2(context.getMouseInfo().mouseCurrentPosViewPort).substract(selectedNodesRect.getSize().divide(2));

    //对应新拷贝的节点
    const nodeIdMap = new Map<string, Node>();

    //重新添加节点
    for (const node of json.nodes) {
      const define = nodeRegistry.getNodeByGUID(node.guid);
      if (!define) {
        printWarning(TAG, null, `Failed to paste node for GUID "${node.guid}", it may not be registered.`);
        continue;
      }
  
      //新添加的位置是鼠标位置为参考加上相对位置
      const newPos = new Vector2(mousePos).add(
        new Vector2().load(node.node.position as any).substract(selectedNodesRect.getPoint())
      );

      console.log('newPos', newPos.toString());
      console.log('newPos2',node.node.position);
      console.log('newPos3', new Vector2().load(node.node.position as any).substract(selectedNodesRect.getPoint()).toString());
      
      delete (node.node as any).uid;

      const newNode = context.userAddNode(define, {
        noErrorAlert: true,
        addNodeInPos: newPos,  
        intitalShadow: node.node,
      });

      if (newNode)
        nodeIdMap.set(node.uid, newNode);
    }

    //重新添加连接线
    for (const connector of json.connectors) {

      //复制后节点uid变化，需要重新对应
      const newStartPortNodeUid = nodeIdMap.get(connector.startPort.nodeUid);
      const newEndPortNodeUid = nodeIdMap.get(connector.endPort.nodeUid);

      if (!newStartPortNodeUid || !newEndPortNodeUid)
        continue;

      const startPortInstance = context.getNodePortByUid(newStartPortNodeUid.uid, connector.startPort.portUid);
      const endPortInstance = context.getNodePortByUid(newEndPortNodeUid.uid, connector.endPort.portUid);

      if (!startPortInstance || !endPortInstance)
        continue;

      context.connectConnector(startPortInstance, endPortInstance);
    }
    
    context.markGraphChanged();
  }
  function isPasteable() {
    return true;
  }

  function handleClipboardError(e: unknown) {
    context.userActionAlert('warning', "无法读取或者设置剪贴板，错误：" + e);
  }

  context.clipBoardManager = {
    cutSelectionNodes,
    copySelectionNodes,
    pasteNodes,
    isPasteable,
  };

  return {}
}