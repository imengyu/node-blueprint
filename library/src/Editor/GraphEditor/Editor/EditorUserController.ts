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
    userInterfaceNextTick(cb: () => void): Promise<void>;
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
      return new Promise<void>((resolve) => {
        nextTick(() => {
          resolve();
          cb();
        });
      });
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