import { reactive } from "vue";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import type { Node } from "@/node-blueprint/Base/Flow/Node/Node";
import type { NodePort, NodePortDirection } from "@/node-blueprint/Base/Flow/Node/NodePort";
import type { NodeGraphEditorMouseInfo } from "./EditorMouseHandler";
import { NodeParamType } from "@/node-blueprint/Base/Flow/Type/NodeParamType";
import type { NodePortEditor } from "../Flow/NodePortEditor";
import type { NodeEditor } from "../Flow/NodeEditor";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import { NodeParamTypeRegistry, type NodeTypeCoverter } from "@/node-blueprint/Base/Flow/Type/NodeParamTypeRegistry";
import { NodeConnectorEditor } from "../Flow/NodeConnectorEditor";
import { createMouseDownAndUpHandler } from "./MouseHandler";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import StringUtils from "@/node-blueprint/Base/Utils/StringUtils";
import type { NodeConnector } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import type { ICoverterNodeOptions } from "@/node-blueprint/Nodes/Lib/BaseNodes";
import { Rect } from "@/node-blueprint/Base/Utils/Base/Rect";
import HtmlUtils from "@/node-blueprint/Base/Utils/HtmlUtils";

/**
 * 节点连接上下文函数
 */
export interface NodeGraphEditorConnectorContext {
  /**
   * 获取用户鼠标是否悬浮于任意一个连接线上
   * @returns 
   */
  isAnyConnectorHover: () => boolean;
  /**
   * 选中鼠标悬浮的连接线
   * @returns 
   */
  selectHoverConnectors: () => void;
  /**
   * 获取用户现在是否处于连接至新节点状态中
   * @returns 
   */
  isConnectToNew: () => boolean;
  /**
   * 获取用户连接控制器的状态
   * @returns 
   */
  getConnectingInfo: () => IConnectingInfo;
  updateCurrentHoverPort: (port : NodePortEditor, active : boolean) => void,
  updateConnectEnd: (screenPos : Vector2) => void;
  startConnect: (port : NodePortEditor) => void;
  endConnect: (port : NodePortEditor) => void;
  getCanConnect: () => boolean;
  /**
   * 使用连接线连接两个节点。此函数无检查，直接创建连接
   * @param start 开始节点
   * @param end 结束节点
   * @returns 
   */
  connectConnector: (start : NodePortEditor, end : NodePortEditor) => NodeConnectorEditor|null;
  connectorSuccessSetState: (connector: NodeConnectorEditor) => void;
  endConnectToNew: (node?: NodeEditor) => [NodePortEditor|null,NodeConnector|null];
  /**
   * 断开连接线
   * @param conn 
   * @returns 
   */
  unConnectConnector: (conn : NodeConnectorEditor) => void;
  /**
   * 取消当前端口上的所有连接线
   * @param port 
   * @returns 
   */
  unConnectPortConnectors: (port: NodePortEditor) => void;
  /**
   * 取消当前节点上的所有连接线
   * @param node 
   * @returns 
   */
  unConnectNodeConnectors: (node: NodeEditor) => void;
  /**
   * 在弹性端口连接后执行弹性事件
   * @param thisPort 当前端口
   * @param anotherPort 另外一个端口
   */
  doFlexPortConnect(thisPort: NodePort, anotherPort: NodePort): void
  /**
   * 当本节点的端口类型更改后，触发与之相连的弹性端口更改事件
   * @param node 本节点
   * @param changedPorts 更改类型的端口
   */
  doFlexPortUpdateConnected(node: NodeEditor, changedPorts: string[]) : void;
  /**
   * 对整个图表进行孤立节点检查
   */
  startGlobalIsolateCheck(): void;
}


/**
 * 连接状态信息
 */
export interface IConnectingInfo {
  isConnecting: boolean,
  isConnectingToNew: boolean,
  isFail: boolean,
  isSamePort: boolean,
  startPort: null|NodePortEditor,
  currentHoverPort: null|NodePortEditor,
  endPos: Vector2,
  canConnect: boolean,
  shouldAddConverter: boolean,
  nextAddConverter: null|NodeTypeCoverter,
  otherSideRequireDirection: NodePortDirection,
  otherSideRequireType: null|NodeParamType,
}


/**
 * 编辑器的节点连接处理
 * @param options 
 * @returns 
 */
export function useEditorConnectorController(context: NodeGraphEditorInternalContext) {
  
  //#region 连接线的鼠标悬浮与选择判断

  const lastHoverConnector = new Array<NodeConnectorEditor>();

  function isAnyConnectorHover() {
    return lastHoverConnector.length > 0;
  }
  function connectorCast(mouseInfo: NodeGraphEditorMouseInfo) {
    const _mousePos = mouseInfo.mouseCurrentPosViewPort;
    const _mousePosScreen = mouseInfo.mouseCurrentPosEditor;

    lastHoverConnector.forEach(i => (i.hoverChecked = false));
    context
      .getBaseChunkedPanel()
      .testPointCastTag(_mousePos, "connector")
      .forEach((i) => {
        const connector = context.getConnectors().get(i.data as string) as NodeConnectorEditor;
        if (connector && connector.testInConnector(_mousePos, _mousePosScreen)) {
          connector.hoverChecked = true;
          connector.hover = true;
          ArrayUtils.addOnce(lastHoverConnector, connector);
        }
      });
    for (let i = lastHoverConnector.length - 1; i >= 0; i--) {
      const connector = lastHoverConnector[i];
      if (!connector.hoverChecked) {
        connector.hover = false;
        ArrayUtils.removeAt(lastHoverConnector, i);
      }
    }
  }
  function selectOneConnector() : NodeConnectorEditor|null {
    const _mousePos = context.getMouseInfo().mouseCurrentPosViewPort;
    const _mousePosEditor = context.getMouseInfo().mouseCurrentPosEditor;
    const pointCastConnectors = context
      .getBaseChunkedPanel()
      .testPointCastTag(_mousePos, "connector");
    if (pointCastConnectors.length > 0) {
      for (let i = 0; i < pointCastConnectors.length; i++) {
        const connector = context
          .getConnectors()
          .get(pointCastConnectors[i].data as string) as NodeConnectorEditor;
        if (connector && connector.testInConnector(_mousePos, _mousePosEditor)) {
          connector.hoverChecked = true;
          connector.hover = true;
          context.selectConnector(connector, false);
          return connector;
        }
      }
    }
    return null;
  }
  function selectHoverConnectors() {
    lastHoverConnector.forEach(c => context.selectConnector(c, true))
  }

  //处理鼠标按下选择连接线
  //处理鼠标移动检查连接线悬浮

  let lastSelectAtDown : NodeConnectorEditor|null = null;

  context.getMouseHandler().pushMouseDownHandler(createMouseDownAndUpHandler({
    onDown: (e) => {
      if (HtmlUtils.isEventInControl(e))
        return false;
      const connector = selectOneConnector();
      if (connector) {
        lastSelectAtDown = connector;
        return true;
      }
      return false;
    },
    onUp: () => {
      if (lastSelectAtDown) {
        //Alt按下，删除连接线
        if (context.keyboardManager.isKeyAltDown())
          context.unConnectConnector(lastSelectAtDown);
        lastSelectAtDown = null;
      }
    },
  }));
  context.getMouseHandler().pushMouseMoveHandlers((mouseInfo) => {
    connectorCast(mouseInfo);
    return false;
  });

  //#endregion

  //#region 连接线的连接处理

  const connectingInfo = reactive<IConnectingInfo>({
    isConnecting: false,
    isConnectingToNew: false,
    isFail: false,
    isSamePort: false,
    startPort: null,
    currentHoverPort: null,
    endPos: new Vector2(),
    canConnect: false,
    shouldAddConverter: false,
    nextAddConverter: null,
    otherSideRequireDirection: 'input',
    otherSideRequireType: null,
  }) as IConnectingInfo;

  //更新当前鼠标激活的端口
  function updateCurrentHoverPort(port : NodePortEditor, active : boolean) {

    let successText = '', failedText = '';

    if(active) {
      connectingInfo.currentHoverPort = port;
      connectingInfo.shouldAddConverter = false;
      connectingInfo.nextAddConverter = null;

      if(connectingInfo.startPort === null){
        connectingInfo.isFail = false;
        return;
      }

      connectingInfo.isSamePort = connectingInfo.startPort === port;

      //类型检查
      if(connectingInfo.currentHoverPort.parent === connectingInfo.startPort.parent){
        connectingInfo.canConnect = false;
        failedText = '不能连接同一个单元的节点';
      }
      else{
        //方向必须不同才能链接
        connectingInfo.canConnect = connectingInfo.currentHoverPort.direction !== connectingInfo.startPort.direction;
        if(!connectingInfo.canConnect) 
          failedText ='不能连接相同方向的节点';
        //参数类型检查
        else {

          if(connectingInfo.currentHoverPort.direction === 'input') {
            connectingInfo.canConnect = connectingInfo.currentHoverPort.checkTypeAllow(connectingInfo.startPort as NodePort); 

            if(connectingInfo.currentHoverPort.connectedFromPort.length > 0) 
              successText = '将会替换已有连接';
          }
          else if(connectingInfo.startPort.direction === 'input') {
            connectingInfo.canConnect = connectingInfo.startPort.checkTypeAllow(connectingInfo.currentHoverPort as NodePort);

            if(connectingInfo.startPort.connectedFromPort.length > 0) 
              successText = '将会替换已有连接';
          }

          //如果不能连接
          if(!connectingInfo.canConnect) {
            const startPot = connectingInfo.startPort.direction === 'output' ? connectingInfo.startPort : connectingInfo.currentHoverPort;
            const endPot = connectingInfo.currentHoverPort.direction === 'input' ? connectingInfo.currentHoverPort : connectingInfo.startPort;
            const startType = startPot.paramType;
            const endType = endPot.paramType;

            //检查类型有没有转换器
            const converter = NodeParamTypeRegistry.getInstance().getTypeCoverter(startType, endType);
            if(converter) {
              //设置转换器，在连接的时候会进行添加
              connectingInfo.shouldAddConverter = true;
              connectingInfo.nextAddConverter = converter;
              connectingInfo.canConnect = true;
              successText = `转换 ${startType.define?.typeTitle} 至 ${endType.define?.typeTitle}`;
            } else  {
              //没有转换器，不兼容连接
              failedText = `${startType.define?.typeTitle} 与 ${endType.define?.typeTitle} 不兼容`;
            }
          }
          else {
            //调用单元自己的检查函数检查是否可用连接
            let err : string|null = null;
             if(connectingInfo.currentHoverPort.direction === 'input') {
              if(typeof connectingInfo.currentHoverPort.parent.events.onPortConnectCheck === 'function') {
                err = connectingInfo.currentHoverPort.parent.events.onPortConnectCheck(
                  connectingInfo.currentHoverPort.parent as NodeEditor, 
                  connectingInfo.currentHoverPort as NodePort, 
                  connectingInfo.startPort as NodePort
                ); 
                connectingInfo.canConnect = !StringUtils.isNullOrEmpty(err);
              }
            } else if(connectingInfo.startPort.direction === 'input') {
              if(typeof connectingInfo.startPort.parent.events.onPortConnectCheck === 'function') {
                err = connectingInfo.startPort.parent.events.onPortConnectCheck(
                  connectingInfo.startPort.parent as NodeEditor, 
                  connectingInfo.startPort as NodePort, 
                  connectingInfo.currentHoverPort as NodePort
                ); 
                connectingInfo.canConnect = !StringUtils.isNullOrEmpty(err);
              }
            }
            //如果不能连接，则显示错误
            if(!connectingInfo.canConnect && err)
              failedText = err;
          }
        }
      }

      //更新点的状态
      if(connectingInfo.canConnect) {
        (connectingInfo.currentHoverPort as NodePortEditor).state = 'success';
        connectingInfo.isFail = false;
      }else {
        (connectingInfo.currentHoverPort as NodePortEditor).state = 'error';
        connectingInfo.isFail = true;
      }
    }
    else {
      if(connectingInfo.currentHoverPort) {
        (connectingInfo.currentHoverPort as NodePortEditor).state = connectingInfo.currentHoverPort.isConnected ? 'active' : 'normal';
        connectingInfo.currentHoverPort = null;
      }
      successText = '连接至新的单元';
      connectingInfo.canConnect = true;
      connectingInfo.isSamePort = false;
      connectingInfo.isFail = false;
    }

    //更新连接显示状态
    if (connectingInfo.isConnecting || connectingInfo.isConnectingToNew) {
      if (connectingInfo.canConnect)
        context.showEditorHoverInfoTip(successText, 'success');
      else
        context.showEditorHoverInfoTip(failedText, 'failed');
    } else {
      context.closeEditorHoverInfoTip();
    }
  }
  function updateConnectEnd(screenPos : Vector2) {
    if(!connectingInfo.isConnectingToNew) {
      context.getViewPort().screenPointToViewportPoint(screenPos, connectingInfo.endPos);
    }
  }
  function startConnect(P : NodePort) {
    const port = P as NodePortEditor;
    connectingInfo.startPort = port;
    connectingInfo.isConnecting = true;
    port.state = 'active';
    context.showEditorHoverInfoTip('连接至新的单元', 'success');
  }
  function endConnect(P ?: NodePort) {
    context.closeEditorHoverInfoTip();

    const port = P as NodePortEditor;
    if(port)
      port.state = 'normal';
    //连接到新的节点
    if(connectingInfo.currentHoverPort === null && connectingInfo.startPort !== null) {

      connectingInfo.otherSideRequireType = connectingInfo.startPort.paramType;
      connectingInfo.otherSideRequireDirection = connectingInfo.startPort.direction === 'input' ? 'output' : 'input';

      const viewPort = context.getViewPort();
      const panelPos = new Vector2();
      viewPort.viewportPointToScreenPoint(connectingInfo.endPos, panelPos);

      context.showAddNodePanel(
        panelPos, 
        connectingInfo.otherSideRequireType, 
        connectingInfo.otherSideRequireDirection,
        connectingInfo.endPos
      );
      
      connectingInfo.isConnectingToNew = true;
      return;
    }
    
    //检查
    if(connectingInfo.canConnect && connectingInfo.currentHoverPort !== null && connectingInfo.startPort !== null) {

      //连接是否需要添加一个转换器
      if(connectingInfo.shouldAddConverter)
        connectConnectorWithConverter();
      else if(connectingInfo.startPort) {
        context.connectConnector(connectingInfo.startPort, connectingInfo.currentHoverPort);
        connectingInfo.startPort = null;
      }
    }

    connectingInfo.isConnecting = false;
    
    if(connectingInfo.startPort !== null) {
      (connectingInfo.startPort as NodePortEditor).state = connectingInfo.startPort.isConnected ? 'active' : 'normal';
      connectingInfo.startPort = null;
    }
  }
  //使用转换器连接两个端口
  function connectConnectorWithConverter() {
    if (!connectingInfo.startPort || !connectingInfo.currentHoverPort)
      return;
    const startPort = connectingInfo.startPort?.direction === 'output' ? 
      connectingInfo.startPort : connectingInfo.currentHoverPort;
    const endPort = connectingInfo.startPort?.direction === 'input' ? 
      connectingInfo.startPort : connectingInfo.currentHoverPort;

    const converter = connectingInfo.nextAddConverter;
    if (!converter)
      return;

    //创建转换器节点
    //新的节点在两个端口的中心位置
    const convertNode = context.userAddNode<ICoverterNodeOptions>(
      converter.converterNode, 
      {
        addNodeInPos: Rect.makeBy2Point(
          new Rect(), 
          startPort.getPortPositionViewport(), 
          endPort.getPortPositionViewport()
        ).calcCenter(),
        addNodePosRefernceCenter: true,
        intitalOptions: {
          coverterFrom: converter.fromType.toString(),
          coverterTo: converter.toType.toString(),
        }
      }
    );
    if (!convertNode)
      return;

    //连接转换器节点与端口
    const convertNodeInputPort = convertNode.getPortByGUID('INPUT');
    const convertNodeOutputPort = convertNode.getPortByGUID('OUTPUT');

    if (convertNodeInputPort)
      connectConnector(startPort, convertNodeInputPort);
    if (convertNodeOutputPort)
      connectConnector(convertNodeOutputPort, endPort);
  }
  //获取用户当前是否可以连接
  function getCanConnect() { 
    return connectingInfo.canConnect; 
  }
  //结束连接（连接至新的单元）
  function endConnectToNew(node?: Node) : [NodePortEditor|null,NodeConnector|null] {
    let port : NodePortEditor|null = null;
    let connector : NodeConnector|null = null;

    context.closeEditorHoverInfoTip();

    //如果已选单元，则连接至这个单元
    if(typeof node !== 'undefined' && connectingInfo.otherSideRequireType) {
      port = node.getPortByTypeAndDirection(connectingInfo.otherSideRequireType, connectingInfo.otherSideRequireDirection, true) as NodePortEditor;
      if(port !== null && connectingInfo.startPort !== null)
        connector = context.connectConnector(connectingInfo.startPort, port);
      connectingInfo.otherSideRequireType = null;
    }

    //重置状态
    connectingInfo.isConnectingToNew = false;
    connectingInfo.isConnecting = false;
    
    if(connectingInfo.startPort !== null) {
      (connectingInfo.startPort as NodePortEditor).state = connectingInfo.startPort.isConnected ? 'active' : 'normal';
      connectingInfo.startPort = null;
    }
    return [port,connector];
  }
  /**
   * 连接单元
   * @param start 开始端口
   * @param end 结束端口
   */
  function connectConnector(
    _startPort: NodePort,
    _endPort: NodePort
  ) {
    const invokeOnPortConnect = (
      startPort: NodePortEditor,
      endPort: NodePortEditor
    ) => {

      if (startPort.parent.events.onPortConnect) 
        startPort.parent.events.onPortConnect(startPort.parent, startPort);
      if (endPort.parent.events.onPortConnect) 
        endPort.parent.events.onPortConnect(endPort.parent, endPort);

      //两个端口有一个是弹性端口，并且两者类型不一样，则触发弹性端口事件
      if(!startPort.paramType.equal(endPort.paramType)) {
        if(startPort.paramType.isAny && startPort.isFlexible) {
          doFlexPortConnect(startPort, endPort);
        } else if(endPort.paramType.isAny && endPort.isFlexible) {
          doFlexPortConnect(endPort, startPort);
        }
      }
    };

    const 
      startPort = _startPort as NodePortEditor,
      endPort = _endPort as NodePortEditor;

    //新建链接
    let connector: NodeConnectorEditor | null = null;

    //根据方向链接节点
    if (startPort.direction === "output") {
      //如果已经链接上了，取消链接
      const connData = endPort.isConnectByPort(startPort);
      if (connData !== null) {
        unConnectConnector(connData as NodeConnectorEditor);
        connectingInfo.isConnecting = false;
        return null;
      }

      connector = new NodeConnectorEditor();

      //如果是行为端口，只能输出一条线路。取消连接之前的线路
      if (
        startPort.paramType.isExecute &&
        startPort.connectedToPort.length >= 0
      )
        startPort.connectedToPort.forEach((d) => unConnectConnector(d as NodeConnectorEditor));
      //如果是参数端口，只能输入一条线路。取消连接之前的线路
      if (
        !startPort.paramType.isExecute &&
        endPort.connectedFromPort.length >= 0
      )
        endPort.connectedFromPort.forEach((d) => unConnectConnector(d as NodeConnectorEditor));

      connector.startPort = startPort;
      connector.endPort = endPort;
      connector.setConnectionState();

      connectorSuccessSetState(connector);
      invokeOnPortConnect(startPort, endPort);

    } else if (endPort.direction === "output") {
      //如果已经链接上了，取消链接
      const connData = startPort.isConnectByPort(endPort);
      if (connData !== null) {
        unConnectConnector(connData as NodeConnectorEditor);
        connectingInfo.isConnecting = false;
        return null;
      }

      connector = new NodeConnectorEditor();

      //如果是行为端口，只能输出一条线路。
      if (endPort.paramType.isExecute && endPort.connectedToPort.length > 0)
        endPort.connectedToPort.forEach((d) => unConnectConnector(d as NodeConnectorEditor));
      //如果是参数端口，只能输入一条线路。
      if (
        !startPort.paramType.isExecute &&
        startPort.connectedFromPort.length > 0
      )
        startPort.connectedFromPort.forEach((d) => unConnectConnector(d as NodeConnectorEditor));

      connector.startPort = endPort;
      connector.endPort = startPort;
      connector.setConnectionState();

      connectorSuccessSetState(connector);
      invokeOnPortConnect(endPort, startPort);
    }

    //添加线段
    if (connector !== null) {
      context.addConnector(connector);
      connector.updatePortValue();
      //更新孤立状态
      afterConnectDoIsolateCheck(
        connector.startPort as NodePortEditor, 
        connector.endPort as NodePortEditor, 
        connector.startPort!.parent as NodeEditor, 
        connector.endPort!.parent as NodeEditor, 
        true
      );
    }

    context.markGraphChanged();
    return connector;
  }
  /**
   * 连接成功后设置各自端口的状态
   * @param connector 连接线
   */
  function connectorSuccessSetState(connector: NodeConnectorEditor) {
    (connector.endPort as NodePortEditor).state = "active";
    (connector.startPort as NodePortEditor).state = "active";
  }
  /**
   * 取消连接单元
   * @param conn 对应连接
   */
  function unConnectConnector(connector: NodeConnectorEditor) {
    const
      start = connector.startPort as NodePortEditor,
      end = connector.endPort as NodePortEditor;

    const 
      startNode = (start.parent as NodeEditor),
      endNode = (end.parent as NodeEditor);

    context.unSelectConnector(connector);
    context.removeConnector(connector);

    if (start !== null && end !== null) {

      start.removeConnectToPort(end);
      start.state = start.isConnected ? 'active' : 'normal';
      end.removeConnectByPort(start);
      end.state = end.isConnected ? 'active' : 'normal';

      //更新孤立状态
      afterConnectDoIsolateCheck(start, end, startNode, endNode, false);
      //更新弹性端口状态
      doFlexPortUnConnect(startNode);
      doFlexPortUnConnect(endNode);

      if (start.parent.events.onPortUnConnect) start.parent.events.onPortUnConnect(start.parent, start);
      if (end.parent.events.onPortUnConnect) end.parent.events.onPortUnConnect(end.parent, end);
    }
    
    context.markGraphChanged();
  }
  //删除端口连接
  function unConnectPortConnectors(port: NodePortEditor) {
    for (let i = port.connectedFromPort.length - 1; i >= 0; i--) 
      unConnectConnector(port.connectedFromPort[i] as NodeConnectorEditor);
    for (let i = port.connectedToPort.length - 1; i >= 0; i--) 
      unConnectConnector(port.connectedToPort[i] as NodeConnectorEditor);
  }
  //删除单元连接
  function unConnectNodeConnectors(node: NodeEditor) {
    node.ports.forEach((p) => unConnectPortConnectors(p as NodePortEditor));
  }
  //获取用户现在是否处于连接至新节点状态中
  function isConnectToNew() {
    return connectingInfo.isConnectingToNew;
  }
  //获取用户连接控制器的状态
  function getConnectingInfo() {
    return connectingInfo;
  }

  //#endregion

  //#region 弹性端口
  
  /**
   * 在弹性端口触发后执行弹性事件
   */
  function doFlexPortConnect(_thisPort: NodePort, _anotherPort: NodePort) {
    const visitedNodes : Node[] = [];

    function doPort(thisPort: NodePort, anotherPort: NodePort) {
      
      if (thisPort.isFlexible) {
        const node = thisPort.parent;
        const type = anotherPort.paramType;

        if (visitedNodes.includes(node))
          return;
        visitedNodes.includes(node);

        let changedPorts: NodePort[]|undefined;

        if (thisPort.isFlexible === 'custom') 
          //custom 模式下用户自己处理
          changedPorts = thisPort.parent.events.onPortFlexConnect?.(thisPort.parent, thisPort, anotherPort);
        else if (thisPort.isFlexible === 'auto') {
          changedPorts = [];
          //auto 模式下变换其他弹性端口为指定类型
          for (const port of thisPort.parent.ports) {
            if (port.isFlexible) {
              node.changePortParamType(port, type, false);
              node.events.onPortFlexUpdate?.(node, port, context, type);
              (port as NodePortEditor).updatePortValue();
              if (port !== thisPort)
                changedPorts.push(port);
            }
          }
        }

        //递归触发其他节点的弹性端口更改
        if (changedPorts) {
          for (const port of changedPorts) {
            if (port.direction === 'input') {
              for (const connector of port.connectedFromPort)
                doPort(connector.startPort!, port);
            } else if (port.direction === 'output') {
              for (const connector of port.connectedToPort)
                doPort(connector.endPort!, port);
            } 
          }
        }
      } 
    }
    doPort(_thisPort, _anotherPort);
  }
  /**
   * 当本节点的端口类型更改后，触发与之相连的弹性端口更改事件
   */
  function doFlexPortUpdateConnected(node: NodeEditor, changedPorts: string[]) {
    const ports = changedPorts.map(guid => node.getPort(guid));
    for (const port of ports) {
      if (port) {
        for (const connector of port.connectedToPort)
          doFlexPortConnect(connector.endPort!, port);
        for (const connector of port.connectedFromPort)
          doFlexPortConnect(connector.startPort!, port);
      }
    }
  }
  /**
   * 在断开连接后取消弹性端口。
   * 只有当前节点所有连接都断开之后，才会恢复默认通配符状态
   */
  function doFlexPortUnConnect(node: NodeEditor) {
    if (!node.hasAnyPortConnected()) {
      node.ports.forEach((port) => {
        if (port.isFlexible) {
          node.changePortParamType(port, NodeParamType.Any);
          node.events.onPortFlexUpdate?.(node, port, context, NodeParamType.Any);
        }
      });
    }
  }

  //#endregion

  //#region 孤立节点检查

  /**
   * 对整个图表进行孤立节点检查
   * 
   * 首先将全部的节点置为孤立，从非孤立节点开始
   * 遍历所有节点，不可达的节点即为孤立
   */
  function startGlobalIsolateCheck() {
    const visitedNodes : NodeEditor[] = [];
    const noIsolateNodes : NodeEditor[] = [];
    const allNodes = context.getNodes();
    for (const [,node] of allNodes) {
      if (node.style.noIsolate) 
        noIsolateNodes.push((node as NodeEditor));
      else if (node.hasExecutePort())
        (node as NodeEditor).isolateState = true;
      else
        //对于没有执行端口的节点，判断是否孤立永远是判断是否有任意连接
        (node as NodeEditor).isolateState = !node.hasAnyPortConnected();
    }

    function loopNodeTree(node: NodeEditor) {
      if (visitedNodes.includes(node))
        return;
      visitedNodes.push(node);
      node.isolateState = false;
      
      for (const port of node.outputPorts) {
        for (const connector of port.connectedToPort) {
          if (connector.endPort)
            loopNodeTree(connector.endPort.parent as NodeEditor);
        }
      }
    }

    for (const node of noIsolateNodes)
      loopNodeTree(node);
  }
  /**
   * 连接和断开连接后执行孤立节点检查
   */
  function afterConnectDoIsolateCheck(
    start: NodePortEditor,
    end: NodePortEditor,
    startNode: NodeEditor,
    endNode: NodeEditor,
    isConnect: boolean
  ) {
    const visitedNodes : NodeEditor[] = [];

    /**
     * 向上访问，如果可达非孤立节点，则返回true
     * @param node
     * @returns 
     */
    function prevLoopNodeTreeAndGetHasNoIsolateNode(node: NodeEditor) {
      if (visitedNodes.includes(node))
        return !node.isolateState;
      visitedNodes.push(node);

      if (node.style.noIsolate)
        return true;

      for (const port of node.inputPorts) {
        for (const connector of port.connectedFromPort) {
          if (connector.startPort && prevLoopNodeTreeAndGetHasNoIsolateNode(connector.startPort.parent as NodeEditor))
            return true;
        }
      }

      return false;
    }
    /**
     * 向下访问
     * @param node 起始节点
     * @param prevCheck 是否进行向上可达非孤立节点检查
     * @returns 
     */
    function loopNodeTree(node: NodeEditor, prevCheck: boolean) {
      if (visitedNodes.includes(node))
        return;

      if (prevCheck) {
        node.isolateState = !prevLoopNodeTreeAndGetHasNoIsolateNode(node);
      } else {
        node.isolateState = false;
      }

      visitedNodes.push(node);

      for (const port of node.outputPorts) {
        for (const connector of port.connectedToPort) {
          if (connector.endPort)
            loopNodeTree(connector.endPort.parent as NodeEditor,prevCheck );
        }
      }
    }

    /**
     * 连接后：判断上游节点是不是非孤立状态，是则将下游全部节点设置为非孤立
     * 断开连接后：向下游节点循环访问，每个节点向上访问，如果可达非孤立节点，则当前节点设为非孤立，否则设置为孤立
     */
    if (isConnect) { 
      //对于没有执行端口的节点，有任意连接则不孤立
      if (!startNode.hasExecutePort())
        startNode.isolateState = false;
      if (!endNode.hasExecutePort())
        endNode.isolateState = false; 
      else if (!startNode.isolateState) 
        loopNodeTree(endNode, false);
    } else {
      //对于没有执行端口的节点，判断是否孤立永远是判断是否有任意连接
      if (!startNode.hasExecutePort())
        startNode.isolateState = !startNode.hasAnyPortConnected();
      if (!endNode.hasExecutePort())
        endNode.isolateState = !endNode.hasAnyPortConnected();
      else
        loopNodeTree(endNode, true);
    }
  }

  //#endregion


  context.updateCurrentHoverPort = updateCurrentHoverPort;
  context.updateConnectEnd = updateConnectEnd;
  context.startConnect = startConnect;
  context.endConnect = endConnect;
  context.getCanConnect = getCanConnect;
  context.endConnectToNew = endConnectToNew;
  context.connectConnector = connectConnector;
  context.connectorSuccessSetState = connectorSuccessSetState;
  context.unConnectConnector = unConnectConnector;
  context.unConnectPortConnectors = unConnectPortConnectors;
  context.unConnectNodeConnectors = unConnectNodeConnectors;
  context.isAnyConnectorHover = isAnyConnectorHover;
  context.isConnectToNew = isConnectToNew;
  context.selectHoverConnectors = selectHoverConnectors;
  context.getConnectingInfo = getConnectingInfo;
  context.startGlobalIsolateCheck = startGlobalIsolateCheck;
  context.doFlexPortConnect = doFlexPortConnect;
  context.doFlexPortUpdateConnected = doFlexPortUpdateConnected;

  return {
    connectingInfo,
  }
}