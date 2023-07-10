import type { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import type { NodePort } from "@/node-blueprint/Base/Flow/Node/NodePort";
import type { NodeConnector } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import type { NodeEditor } from "../Flow/NodeEditor";
import type { NodePortEditor } from "../Flow/NodePortEditor";
import type { NodeConnectorEditor } from "../Flow/NodeConnectorEditor";
import StringUtils from "@/node-blueprint/Base/Utils/StringUtils";
import ContextMenuGlobal, { type MenuItem, type MenuOptions } from '@imengyu/vue3-context-menu';

export interface NodeEditorContextMenuContext {
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
}

export interface NodeContextMenuItem extends Omit<MenuItem, "onClick"> {
  onClick?: (this: NodeEditor) => void;
}

/**
 * 编辑器的右键菜单处理
 * @param options 
 * @returns 
 */
export function useEditorContextMenuHandler(context: NodeGraphEditorInternalContext) {
  
  function onCanvasContextMenu(e: MouseEvent) {

    e.preventDefault();
    e.stopPropagation();

    const info = context.getMouseInfo();

    //选中连接线，弹出连接线菜单
    if (context.isAnyConnectorHover()) {
      //设置连接线为旋转状态
      context.selectHoverConnectors();
      //显示菜单
      showConnectorRightMenu(
        info.mouseDownPosScreen
      );
    }
    //鼠标未移动，则显示添加界面
    else if (!info.mouseMoved)
      context.showAddNodePanel(
        info.mouseDownPosScreen,
        undefined,
        undefined,
        info.mouseCurrentPosViewPort.clone(),
        false
      );
  }

  //Connector Menu
  function showContextMenu(options: MenuOptions) {
    ContextMenuGlobal.showContextMenu(options);
  }

  //Connector Menu
  function showConnectorRightMenu(screenPos : Vector2) {
    const selectedConnectors = context.getSelectConnectors();
    
    context.showContextMenu({
      x: screenPos.x,
      y: screenPos.y,
      items: [
        { 
          label: "断开连接", 
          onClick: () => context.deleteSelectedConnectors()
        },
      ].concat(selectedConnectors.length === 1 ? [
        { 
          label: "按起始端位置拉直",
          onClick: () => {
            if (selectedConnectors[0].startPort)
              context.straightenConnector(selectedConnectors[0].startPort as NodePortEditor, selectedConnectors[0]) 
          },
        },
        { 
          label: "按结束端位置拉直", 
          onClick: () => {
            if (selectedConnectors[0].endPort)
              context.straightenConnector(selectedConnectors[0].endPort as NodePortEditor, selectedConnectors[0]) 
          },
        },
      ] : []),
      zIndex: 100,
      theme: 'flat',
    });
  }

  //Node Menu
  function showNodeRightMenu(node: NodeEditor, screenPos : Vector2) {

    const selectedCount = context.getSelectNodeCount();
    const selectedNodes = context.getSelectNodes();

    let nodeMenuSettingsMenuItems : NodeContextMenuItem[]|null = null;

    if(selectedCount === 1) {
      nodeMenuSettingsMenuItems = selectedNodes[0].define.menu?.items || [];

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
      loopMenuClick(nodeMenuSettingsMenuItems);
    }

    const menuItems = (selectedCount === 1 ? (selectedNodes[0].define.menu?.items || []) : []).concat(
      [
        { 
          label: "删除", 
          disabled: selectedCount === 1 ? selectedNodes[0].define.canNotDelete : false,
          onClick: () => context.deleteSelectedNodes(),
          divided: true 
        },
        { 
          label: "剪切",
          disabled: selectedCount === 1 ? selectedNodes[0].define.canNotDelete : false,
          onClick: () => context.cutSelectionNodes(),
        },
        { label: "复制", onClick: () => context.copySelectionNodes() },
        { label: "粘贴", 
          disabled: !context.isPasteable(), 
          onClick: () => context.pasteNodes(),
          divided: true 
        },
        { label: "断开连接", onClick: () => context.unConnectSelectedNodeConnectors(), divided: true },
        { label: "对齐", disabled: selectedCount < 2, children: [
          { label: "左对齐", onClick: () => context.alignSelectedNode(node, 'left') },
          { label: "上对齐", onClick: () => context.alignSelectedNode(node, 'top') },
          { label: "右对齐", onClick: () => context.alignSelectedNode(node, 'right') },
          { label: "下对齐", onClick: () => context.alignSelectedNode(node, 'bottom') },
          { label: "中对齐", onClick: () => context.alignSelectedNode(node, 'center-x') },
          { label: "中部对齐", onClick: () => context.alignSelectedNode(node, 'center-y') },
        ] },
        { label: "断点", children: [
          { label: "无", onClick: () => context.setSelectedNodeBreakpointState('none') },
          { label: "启用", onClick: () => context.setSelectedNodeBreakpointState('enable') },
          { label: "禁用", onClick: () => context.setSelectedNodeBreakpointState('disable') },
        ], divided: true },
        { 
          label: "为选中项创建注释", 
          disabled: selectedCount < 2,
          onClick: () => {/*TODO: context.genCommentForSelectedNode() */} 
        },
      ]
    );

    context.showContextMenu({
      x: screenPos.x,
      y: screenPos.y,
      items: menuItems,
      zIndex: 100,
      theme: 'flat',
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
              context.selectNode(node, false);
              context.moveViewportToNode(node);
              node.twinkle();
            }
          },
          { label: '断开连接', onClick: () => context.unConnectConnector(connector as NodeConnectorEditor) },
          { label: '拉直连接', onClick: () => context.straightenConnector(port, connector) }
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
        label: "删除参数", onClick: () => {
          context.userDeletePort(port);
        }, 
        disabled: !port.dyamicAdd, 
        divided: true 
      },
      { label: "断开所有连接", onClick: () => context.unConnectPortConnectors(port) },
      { 
        label: "提升为变量", 
        onClick: () => {
          //TODO: 提升为变量
          //port
        }, 
        divided: true 
      },
    ];
    menuItems = menuItems.concat(menuJumpItems);

    context.showContextMenu({
      x: screenPos.x,
      y: screenPos.y,
      items: menuItems,
      zIndex: 100,
      theme: 'flat',
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
      zIndex: 100,
      theme: 'flat',
    });
  }

  context.showInputRightMenu = showInputRightMenu;
  context.showNodeRightMenu = showNodeRightMenu;
  context.showPortRightMenu = showPortRightMenu;
  context.showContextMenu = showContextMenu;
  context.showConnectorRightMenu = showConnectorRightMenu;

  return {
    onCanvasContextMenu,
  }
}