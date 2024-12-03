import type { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import type { NodeGraphEditorContext, NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import type { NodePort } from "@/node-blueprint/Base/Flow/Node/NodePort";
import type { NodeConnector } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import type { NodeEditor } from "../Flow/NodeEditor";
import type { NodePortEditor } from "../Flow/NodePortEditor";
import type { NodeConnectorEditor } from "../Flow/NodeConnectorEditor";
import StringUtils from "@/node-blueprint/Base/Utils/StringUtils";
import ContextMenuGlobal, { type MenuItem, type MenuOptions } from '@imengyu/vue3-context-menu';
import BaseNodes, { type IGraphCallNodeOptions } from "@/node-blueprint/Nodes/Lib/BaseNodes";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import { ConcatableArray } from "@/node-blueprint/Base/Utils/Array/ConcatableArray";

export interface NodeEditorContextMenuContext {
  contextMenuManager: {
    /**
     * 显示连接线右键菜单
     * @param screenPos 屏幕坐标
     */
    showConnectorRightMenu(screenPos : Vector2) : void;
    /**
     * 显示右键菜单
     * @param options 右键菜单参数，具体请参考 https://github.com/imengyu/vue3-context-menu
     */
    showContextMenu(options: MenuOptions) : void;
    /**
     * 显示节点对应右键菜单
     * @param node 节点
     * @param screenPos 屏幕坐标
     */
    showNodeRightMenu(node: NodeEditor, screenPos : Vector2) : void;
    /**
     * 显示端口对应右键菜单
     * @param port 端口
     * @param screenPos 屏幕坐标
     */
    showPortRightMenu(port : NodePortEditor, screenPos : Vector2)  : void;
    /**
     * 显示输入框的右键菜单
     * @param screenPos 
     * @param input 
     */
    showInputRightMenu(screenPos : Vector2, input: HTMLInputElement|undefined) : void;
    /**
     * 显示添加参数节点菜单
     * @param variableName 参数名称
     * @param callback 用户点击回调
     */
    showAddVariableMenu(variableName: string, callback: (action: 'get'|'set') => void) : void;
    /**
     * 注册节点自定义右键菜单处理器，在处理器中会返回选中节点信息，
     * 你可以返回自定义菜单条目，这些条目会追加到最终右键菜单中
     * @param handler 处理器
     * @returns 返回回调用于取消注册
     */
    registerNodeCustomMenuHandler(handler: NodeContextMenuHandler): () => boolean;
    /**
     * 注册连接线自定义右键菜单处理器，在处理器中会返回选中节点信息，
     * 你可以返回自定义菜单条目，这些条目会追加到最终右键菜单中
     * @param handler 处理器
     * @returns 返回回调用于取消注册
     */
    registerConnectorCustomMenuHandler(handler: NodeConnectorContextMenuHandler): () => boolean;
  }
}

export interface NodeContextMenuItem extends Omit<MenuItem, "onClick"> {
  onClick?: (this: NodeEditor) => void;
}

export type NodeContextMenuHandler = (context: NodeGraphEditorContext, selectedNodes: NodeEditor[]) => MenuItem[];
export type NodeConnectorContextMenuHandler = (context: NodeGraphEditorContext, selectedConnectors: NodeConnectorEditor[]) => MenuItem[];

/**
 * 编辑器的右键菜单处理
 * @param options 
 * @returns 
 */
export function useEditorContextMenuHandler(context: NodeGraphEditorInternalContext) {
  
  function onCanvasContextMenu(e: MouseEvent) {

    e.preventDefault();
    e.stopPropagation();

    const info = context.mouseManager.getMouseInfo();

    //选中连接线，弹出连接线菜单
    if (context.connectorManager.isAnyConnectorHover()) {
      //设置连接线为旋转状态
      context.connectorManager.selectHoverConnectors();
      //显示菜单
      showConnectorRightMenu(
        info.mouseDownPosScreen
      );
    }
    //鼠标未移动，则显示添加界面
    else if (!info.mouseMoved)
      context.dialogManager.showAddNodePanel(
        info.mouseDownPosScreen,
        undefined,
        undefined,
        info.mouseCurrentPosViewPort.clone(),
        false
      );
  }

  const customNodeMenuHandler : NodeContextMenuHandler[] = [];
  const customConnectorMenuHandler : NodeConnectorContextMenuHandler[] = [];

  /**
   * 注册节点自定义右键菜单处理器，在处理器中会返回选中节点信息，
   * 你可以返回自定义菜单条目，这些条目会追加到最终右键菜单中
   * @param handler 处理器
   * @returns 返回回调用于取消注册
   */
  function registerNodeCustomMenuHandler(handler: NodeContextMenuHandler) {
    customNodeMenuHandler.push(handler);
    return () => ArrayUtils.remove(customNodeMenuHandler, handler);
  }  
  /**
  * 注册连接线自定义右键菜单处理器，在处理器中会返回选中节点信息，
  * 你可以返回自定义菜单条目，这些条目会追加到最终右键菜单中
  * @param handler 处理器
  * @returns 返回回调用于取消注册
  */
  function registerConnectorCustomMenuHandler(handler: NodeConnectorContextMenuHandler) {
    customConnectorMenuHandler.push(handler);
    return () => ArrayUtils.remove(customConnectorMenuHandler, handler);
  }

  //Connector Menu
  function showContextMenu(options: MenuOptions) {
    ContextMenuGlobal.showContextMenu({ 
      zIndex: 100,
      theme: 'flat',
      ...options,
    });
  }

  //Connector Menu
  function showConnectorRightMenu(screenPos : Vector2) {
    const selectedConnectors = context.selectionManager.getSelectConnectors();
    
    let menuItems : MenuItem[] = [
      { 
        label: "断开连接", 
        onClick: () => context.userActionsManager.deleteSelectedConnectors()
      },
    ].concat(selectedConnectors.length === 1 ? [
      { 
        label: "按起始端位置拉直",
        onClick: () => {
          if (selectedConnectors[0].startPort)
            context.userActionsManager.straightenConnector(selectedConnectors[0].startPort as NodePortEditor, selectedConnectors[0]) 
        },
      },
      { 
        label: "按结束端位置拉直", 
        onClick: () => {
          if (selectedConnectors[0].endPort)
            context.userActionsManager.straightenConnector(selectedConnectors[0].endPort as NodePortEditor, selectedConnectors[0]) 
        },
      },
    ] : []);

    for (const iterator of customConnectorMenuHandler)
      menuItems = menuItems.concat(iterator(context as NodeGraphEditorContext, selectedConnectors));

    showContextMenu({
      x: screenPos.x,
      y: screenPos.y,
      items: menuItems,
      zIndex: 100,
    });
  }

  //Node Menu
  function showNodeRightMenu(node: NodeEditor, screenPos : Vector2) {

    const selectedCount = context.selectionManager.getSelectNodeCount();
    const selectedNodes = context.selectionManager.getSelectNodes();

    const menuItems = new ConcatableArray<NodeContextMenuItem>();

    if(selectedCount === 1) {
      //获取节点的右键菜单
      const ret = selectedNodes[0].events.onEditorShowContextMenu?.(selectedNodes[0], context);
      if (ret && ret.menu?.items)
        menuItems.concat(ret.menu.items);
      if (selectedNodes[0].menu?.items)
        menuItems.concat(selectedNodes[0].menu.items);
    }

    menuItems.concat(
      [
        { 
          label: "删除", 
          disabled: selectedCount === 1 ? selectedNodes[0].define.canNotDelete : false,
          onClick: () => context.userActionsManager.deleteSelectedNodes(),
          divided: true 
        },
        { 
          label: "剪切",
          disabled: selectedCount === 1 ? selectedNodes[0].define.canNotDelete : false,
          onClick: () => context.clipBoardManager.cutSelectionNodes(),
        },
        { label: "复制", onClick: () => context.clipBoardManager.copySelectionNodes() },
        { label: "粘贴", 
          disabled: !context.clipBoardManager.isPasteable(), 
          onClick: () => context.clipBoardManager.pasteNodes(),
          divided: true 
        },
        { label: "断开连接", onClick: () => context.userActionsManager.unConnectSelectedNodeConnectors(), divided: true },
        { label: "对齐", disabled: selectedCount < 2, children: [
          { label: "左对齐", onClick: () => context.userActionsManager.alignSelectedNode(node, 'left') },
          { label: "上对齐", onClick: () => context.userActionsManager.alignSelectedNode(node, 'top') },
          { label: "右对齐", onClick: () => context.userActionsManager.alignSelectedNode(node, 'right') },
          { label: "下对齐", onClick: () => context.userActionsManager.alignSelectedNode(node, 'bottom') },
          { label: "中对齐", onClick: () => context.userActionsManager.alignSelectedNode(node, 'center-x') },
          { label: "中部对齐", onClick: () => context.userActionsManager.alignSelectedNode(node, 'center-y') },
        ] },
        { label: "断点", children: [
          { label: "无", onClick: () => context.userActionsManager.setSelectedNodeBreakpointState('none') },
          { label: "启用", onClick: () => context.userActionsManager.setSelectedNodeBreakpointState('enable') },
          { label: "禁用", onClick: () => context.userActionsManager.setSelectedNodeBreakpointState('disable') },
        ], divided: true },
        { 
          label: "提升为函数", 
          hidden: selectedCount === 1 ? (
            selectedNodes[0].guid !== BaseNodes.getScriptBaseGraphCall().guid
            || (selectedNodes[0].options as unknown as IGraphCallNodeOptions).callGraphType === 'function'
          ) : false,
          onClick: () => context.userActionsManager.promoteSubgraphToFunction(selectedNodes[0]) 
        },
        { 
          label: "展开子图表", 
          hidden: selectedCount === 1 ? selectedNodes[0].guid !== BaseNodes.getScriptBaseGraphCall().guid : false,
          onClick: () => context.userActionsManager.expandSubgraphConfirm(selectedNodes[0]) 
        },
        { 
          label: "折叠为子图表", 
          onClick: () => context.userActionsManager.collapseSelectedNodesTo('subgraph'),
        },
        { 
          label: "折叠为函数", 
          onClick: () => context.userActionsManager.collapseSelectedNodesTo('function'),
          divided: true,
        },
        { 
          label: "为选中项创建注释", 
          disabled: selectedCount === 0,
          onClick: () => context.userActionsManager.genCommentForSelectedNode() 
        },
      ]
    );

    //追加通用处理器的菜单项
    for (const iterator of customNodeMenuHandler)
      menuItems.concat(iterator(context as NodeGraphEditorContext, selectedNodes));

    //重新设置菜单项的点击事件，使其可以接受到当前节点参数
    const finalMenuItems = menuItems.getArray()!;
    const loopMenuClick = (items : NodeContextMenuItem[]) => {
      items.forEach((item) => {
        if(item.children) 
          loopMenuClick(item.children);
        if(typeof item.onClick === 'function') {
          const old = item.onClick;
          item.onClick = function() {
            old.call(selectedNodes[0]);
          };
        }
      })
    }
    loopMenuClick(finalMenuItems);

    showContextMenu({
      x: screenPos.x,
      y: screenPos.y,
      items: finalMenuItems,
      zIndex: 100,
    });
  }
  //Port Menu
  function showPortRightMenu(port : NodePortEditor, screenPos : Vector2) {
    const addCoonItem = (connector : NodeConnector, isUp : boolean) => {
      const currentPort = (isUp ? connector.startPort : connector.endPort) as NodePort;
      menuJumpItems.push({ label: (isUp ? '上' : '下') + '级连接 ' + currentPort.parent.define.name, children: [
          { 
            label: '跳转到' + (isUp ? '上' : '下') + '级',
            onClick: () => {
              const node = currentPort.parent as NodeEditor;
              context.selectionManager.selectNode(node, false);
              context.viewPortManager.moveViewportToNode(node);
              node.twinkle();
            }
          },
          { label: '断开连接', onClick: () => context.connectorManager.unConnectConnector(connector as NodeConnectorEditor) },
          { label: '拉直连接', onClick: () => context.userActionsManager.straightenConnector(port, connector) }
        ] 
      });
    };
    const menuJumpItems : Array<MenuItem> = [];
    if(port.connectedFromPort.length > 0) 
      port.connectedFromPort.forEach((e) => addCoonItem(e, true));
    if(port.connectedToPort.length > 0) 
      port.connectedToPort.forEach((e) => addCoonItem(e, false));

    let menuItems : Array<MenuItem> = [
      { 
        label: "删除参数", onClick: () => context.userActionsManager.deletePort(port), 
        disabled: !port.dyamicAdd, 
        divided: true 
      },
      { label: "断开所有连接", onClick: () => context.connectorManager.unConnectPortConnectors(port) },
      { label: "提升为变量", onClick: () => context.userActionsManager.promotePortToVariable(port), divided: true },
    ];
    menuItems = menuItems.concat(menuJumpItems);

    showContextMenu({
      x: screenPos.x,
      y: screenPos.y,
      items: menuItems,
    });
  }

  //显示输入框的右键菜单
  function showInputRightMenu(screenPos : Vector2, input: HTMLInputElement|undefined) {
    const selection = document.getSelection()?.toString();
    const menuItems : MenuItem[] = [
      {
        label: "剪切",
        onClick: () => {
          input?.focus();
          document.execCommand("cut");
        },
        disabled: StringUtils.isNullOrEmpty(selection),
      },
      {
        label: "复制",
        onClick: () => {
          input?.focus();
          document.execCommand("copy");
        },
        disabled: StringUtils.isNullOrEmpty(selection),
      },
      {
        label: "粘贴",
        onClick: () => {
          input?.focus();
          document.execCommand("paste");
        },
        divided: true,
      },
      {
        label: "全选",
        onClick: () => {
          input?.focus();
          document.execCommand("seletcAll");
        },
      },
      {
        label: "删除",
        onClick: () => {
          input?.focus();
          document.execCommand("delete");
        },
        disabled: StringUtils.isNullOrEmpty(selection),
      },
    ];

    showContextMenu({
      x: screenPos.x,
      y: screenPos.y,
      items: menuItems,
    });
  }

  //显示添加参数节点菜单
  function showAddVariableMenu(variableName: string, callback: (action: 'get'|'set') => void) {
    const screenPos = context.mouseManager.getMouseInfo().mouseCurrentPosScreen;
    showContextMenu({
      x: screenPos.x,
      y: screenPos.y,
      items: [
        {
          label: `获取变量 ${variableName}`,
          onClick() {
            callback('get');
          },
        },
        {
          label: `设置变量 ${variableName}`,
          onClick() {
            callback('set');
          },
        },
      ],
    });
  }

  context.contextMenuManager = {
    showAddVariableMenu,
    showInputRightMenu,
    showNodeRightMenu,
    showPortRightMenu,
    showContextMenu,
    showConnectorRightMenu,
    registerNodeCustomMenuHandler,
    registerConnectorCustomMenuHandler,
  };
  
  return {
    onCanvasContextMenu,
  }
}