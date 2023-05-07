import type { NodeConnector } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import type { Node } from "@/node-blueprint/Base/Flow/Node/Node";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import type { NodePort, NodePortDirection } from "@/node-blueprint/Base/Flow/Node/NodePort";
import type { NodeGraphEditorMouseInfo } from "./EditorMouseHandler";
import { NodeConnectorEditor } from "../Flow/NodeConnectorEditor";
import { createMouseDownAndUpHandler } from "./MouseHandler";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import type { NodeParamType } from "@/node-blueprint/Base/Flow/Type/NodeParamType";
import { reactive } from "vue";
import type { NodePortEditor } from "../Flow/NodePortEditor";
import { NodeParamTypeRegistry } from "@/node-blueprint/Base/Flow/Type/NodeParamTypeRegistry";

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
   * 获取用户现在是否处于连接至新节点状态中
   * @returns 
   */
  isConnectToNew: () => boolean;
  /**
   * 获取用户连接控制器的状态
   * @returns 
   */
  getConnectingInfo: () => IConnectingInfo;
  updateCurrentHoverPort: (port : NodePort, active : boolean) => void,
  updateConnectEnd: (pos : Vector2) => void;
  startConnect: (port : NodePort) => void;
  endConnect: (port : NodePort) => void;
  getCanConnect: () => boolean;
  /**
   * 
   * @param start 
   * @param end 
   * @returns 
   */
  connectConnector: (start : NodePort, end : NodePort) => NodeConnector|null;
  endConnectToNew: (node?: Node) => NodePort|null;
  /**
   * 断开连接线
   * @param conn 
   * @returns 
   */
  unConnectConnector: (conn : NodeConnector) => void;
  /**
   * 取消当前端口上的所有连接线
   * @param port 
   * @returns 
   */
  unConnectPortConnectors: (port: NodePort) => void;
  /**
   * 取消当前节点上的所有连接线
   * @param node 
   * @returns 
   */
  unConnectNodeConnectors: (node: Node) => void;
}


/**
 * 连接状态信息
 */
export interface IConnectingInfo {
  isConnecting: boolean,
  isConnectingToNew: boolean,
  isFail: boolean,
  isSamePort: boolean,
  startPort: null|NodePort,
  currentHoverPort: null|NodePort,
  endPos: Vector2,
  canConnect: boolean,
  shouldAddConverter: boolean,
  //TODO: nextAddConverter: null|BluePrintParamTypeConverterDefine,
  nextAddConverter: null,
  failedText: string,
  successText: string,
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
    const _viewScale = context.getViewPort().scale;

    lastHoverConnector.forEach(i => (i.hoverChecked = false));
    context
      .getBaseChunkedPanel()
      .testPointCastTag(_mousePos, "connector")
      .forEach((i) => {
        const connector = context.getConnectors().get(i.data as string) as NodeConnectorEditor;
        if (connector && connector.testInConnector(_mousePos, _viewScale)) {
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
    const _viewScale = context.getViewPort().scale;
    const pointCastConnectors = context
      .getBaseChunkedPanel()
      .testPointCastTag(_mousePos, "connector");
    if (pointCastConnectors.length > 0) {
      for (let i = 0; i < pointCastConnectors.length; i++) {
        const connector = context
          .getConnectors()
          .get(pointCastConnectors[i].data as string) as NodeConnectorEditor;
        if (connector && connector.testInConnector(_mousePos, _viewScale)) {
          connector.hoverChecked = true;
          connector.hover = true;
          context.selectConnector(connector, false);
          return connector;
        }
      }
    }
    return null;
  }

  //处理鼠标按下选择连接线
  //处理鼠标移动检查连接线悬浮

  let lastSelectAtDown : NodeConnectorEditor|null = null;

  context.getMouseHandler().pushMouseDownHandler(createMouseDownAndUpHandler({
    onDown: () => {
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
        //TODO: if (context.isKeyAltDown())
        //  context.unConnectConnector(lastSelectAtDown);
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
    failedText: '',
    successText: '',
    otherSideRequireDirection: 'input',
    otherSideRequireType: null,
  }) as IConnectingInfo;

  //更新当前鼠标激活的端口
  function updateCurrentHoverPort(port : NodePort, active : boolean) {
    if(active) {
      connectingInfo.currentHoverPort = port;
      connectingInfo.shouldAddConverter = false;
      connectingInfo.nextAddConverter = null;
      connectingInfo.successText = '';

      if(connectingInfo.startPort == null){
        connectingInfo.isFail = false;
        return;
      }

      connectingInfo.isSamePort = connectingInfo.startPort == port;

      //类型检查
      if(connectingInfo.currentHoverPort.parent == connectingInfo.startPort.parent){
        connectingInfo.canConnect = false;
        connectingInfo.failedText = '不能连接同一个单元的节点';
      }
      else{
        //方向必须不同才能链接
        connectingInfo.canConnect = connectingInfo.currentHoverPort.direction != connectingInfo.startPort.direction;
        if(!connectingInfo.canConnect) 
          connectingInfo.failedText ='不能连接相同方向的节点';
        //参数类型检查
        else {

          if(connectingInfo.currentHoverPort.direction == 'input') {
            connectingInfo.canConnect = connectingInfo.currentHoverPort.checkTypeAllow(connectingInfo.startPort as NodePort); 

            if(connectingInfo.currentHoverPort.connectedFromPort.length > 0) 
              connectingInfo.successText = '将会替换已有连接';
          }
          else if(connectingInfo.startPort.direction == 'input') {
            connectingInfo.canConnect = connectingInfo.startPort.checkTypeAllow(connectingInfo.currentHoverPort as NodePort);

            if(connectingInfo.startPort.connectedFromPort.length > 0) 
              connectingInfo.successText = '将会替换已有连接';
          }

          //如果不能连接
          if(!connectingInfo.canConnect) {
            const startPot = connectingInfo.startPort.direction === 'output' ? connectingInfo.startPort : connectingInfo.currentHoverPort;
            const endPot = connectingInfo.currentHoverPort.direction === 'input' ? connectingInfo.currentHoverPort : connectingInfo.startPort;
            const startType = startPot.define.paramType;
            const endType = endPot.define.paramType;

            //检查类型有没有转换器
            const converter = NodeParamTypeRegistry.getInstance().getTypeCoverter(startType, endType);
            if(converter) {
              //设置转换器，在连接的时候会进行添加
              connectingInfo.shouldAddConverter = true;
              connectingInfo.nextAddConverter = converter;
              connectingInfo.canConnect = true;
              connectingInfo.successText = `转换 ${startType.define?.typeTitle} 至 ${endType.define?.typeTitle}`;
            } else  {
              //没有转换器，不兼容连接
              connectingInfo.failedText = `${startType.define?.typeTitle} 与 ${endType.define?.typeTitle} 不兼容`;
            }
          }
          else {
            //TODO: 调用单元自己的检查函数检查是否可用连接
            /*let err : string|null = null;
             if(connectingInfo.currentHoverPort.direction == 'input') {
              if(typeof connectingInfo.currentHoverPort.parent.define.events.onPortConnectCheck === 'function') {
                err = connectingInfo.currentHoverPort.parent.define.events.onPortConnectCheck(
                  connectingInfo.currentHoverPort.parent as BluePrintFlowNode, 
                  connectingInfo.currentHoverPort as NodePort, 
                  connectingInfo.startPort as NodePort
                ); 
                connectingInfo.canConnect = !StringUtils.isNullOrEmpty(err);
              }
            }else if(connectingInfo.startPort.direction == 'input') {
              if(typeof connectingInfo.startPort.parent.define.events.onPortConnectCheck === 'function') {
                err = connectingInfo.startPort.parent.define.events.onPortConnectCheck(
                  connectingInfo.startPort.parent as BluePrintFlowNode, 
                  connectingInfo.startPort as NodePort, 
                  connectingInfo.currentHoverPort as NodePort
                ); 
                connectingInfo.canConnect = !StringUtils.isNullOrEmpty(err);
              }
            }
            //如果不能连接，则显示错误
            if(!connectingInfo.canConnect && err) 
              connectingInfo.failedText = err; */
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
        (connectingInfo.currentHoverPort as NodePortEditor).state = connectingInfo.currentHoverPort.isConnected() ? 'active' : 'normal';
        connectingInfo.currentHoverPort = null;
      }
      connectingInfo.isSamePort = false;
      connectingInfo.isFail = false;
    }
  }
  function updateConnectEnd(pos : Vector2) {
    if(!connectingInfo.isConnectingToNew) {
      context.getViewPort().screenPointToViewportPoint(pos, connectingInfo.endPos);
    }
  }
  function startConnect(P : NodePort) {
    const port = P as NodePortEditor;
    connectingInfo.startPort = port;
    connectingInfo.isConnecting = true;
    port.state = 'active';
  }
  function endConnect(P ?: NodePort) {
    const port = P as NodePortEditor;
    if(port)
      port.state = 'normal';

    //连接到新的节点
    if(connectingInfo.currentHoverPort == null && connectingInfo.startPort != null) {

      connectingInfo.otherSideRequireType = connectingInfo.startPort.define.paramType;
      connectingInfo.otherSideRequireDirection = connectingInfo.startPort.direction === 'input' ? 'output' : 'input';

      const viewPort = context.getViewPort();
      const panelPos = new Vector2();
      viewPort.viewportPointToScreenPoint(connectingInfo.endPos, panelPos);

      context.showAddNodePanel(
        viewPort.fixScreenPosWithEditorAbsolutePos(panelPos), 
        connectingInfo.otherSideRequireType, 
        connectingInfo.otherSideRequireDirection
      );
      
      connectingInfo.isConnectingToNew = true;
      return;
    }
    
    //检查
    if(connectingInfo.canConnect && connectingInfo.currentHoverPort != null && connectingInfo.startPort != null) {

      //连接是否需要添加一个转换器
      if(connectingInfo.shouldAddConverter)
        connectConnectorWithConverter();
      else if(connectingInfo.startPort) {
        context.connectConnector(connectingInfo.startPort, connectingInfo.currentHoverPort);
        connectingInfo.startPort = null;
      }
    }

    connectingInfo.isConnecting = false;
    
    if(connectingInfo.startPort != null) {
      (connectingInfo.startPort as NodePortEditor).state = connectingInfo.startPort.isConnected() ? 'active' : 'normal';
      connectingInfo.startPort = null;
    }

  }
  //使用转换器连接两个端口
  function connectConnectorWithConverter() {
    //TODO: 
  }
  //获取用户当前是否可以连接
  function getCanConnect() { 
    return connectingInfo.canConnect; 
  }
  //结束连接（连接至新的单元）
  function endConnectToNew(node?: Node) : NodePort|null {
    let port : NodePort|null = null;

    //如果已选单元，则连接至这个单元
    if(typeof node != 'undefined' && connectingInfo.otherSideRequireType) {
      port = node.getPortByTypeAndDirection(connectingInfo.otherSideRequireType, connectingInfo.otherSideRequireDirection, true);
      if(port != null)
        context.connectConnector(connectingInfo.startPort as NodePort, port);

      connectingInfo.otherSideRequireType = null;
    }

    //重置状态
    connectingInfo.isConnectingToNew = false;
    connectingInfo.isConnecting = false;
    
    if(connectingInfo.startPort != null) {
      (connectingInfo.startPort as NodePortEditor).state =  connectingInfo.startPort.isConnected() ? 'active' : 'normal';
      connectingInfo.startPort = null;
    }
    return port;
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
      /* TODO: if (eventInfo.onPortConnect) eventInfo.onPortConnect(startPort, endPort);
      if (startPort.parent.define.events.onPortConnect) startPort.parent.define.events.onPortConnect(startPort.parent, startPort);
      if (endPort.parent.define.events.onPortConnect) endPort.parent.define.events.onPortConnect(endPort.parent, endPort);

      //两个端口有一个是弹性端口，并且两者类型不一样，则触发弹性端口事件
      if(!startPort.define.type.equals(endPort.define.type)) {
        if(startPort.define.type.isAny() && startPort.define.isFlexible) {
          if (startPort.parent.define.events.onFlexPortConnect) 
            startPort.parent.define.events.onFlexPortConnect(startPort.parent, startPort, endPort);
        } else if(endPort.define.type.isAny() && endPort.define.isFlexible) {
          if (endPort.parent.define.events.onFlexPortConnect) 
          endPort.parent.define.events.onFlexPortConnect(endPort.parent, endPort, startPort);
        }
      } */
    };

    const 
      startPort = _startPort as NodePortEditor,
      endPort = _endPort as NodePortEditor;

    //新建链接
    let connector: NodeConnectorEditor | null = null;

    //根据方向链接节点
    if (startPort.direction == "output") {
      //如果已经链接上了，取消链接
      const connData = endPort.isConnectByPort(startPort);
      if (connData != null) {
        unConnectConnector(connData);
        connectingInfo.isConnecting = false;
        return null;
      }

      connector = new NodeConnectorEditor();

      //如果是行为端口，只能输出一条线路。取消连接之前的线路
      if (
        startPort.define.paramType.isExecute &&
        startPort.connectedToPort.length >= 0
      )
        startPort.connectedToPort.forEach((d) => unConnectConnector(d));
      //如果是参数端口，只能输入一条线路。取消连接之前的线路
      if (
        !startPort.define.paramType.isExecute &&
        endPort.connectedFromPort.length >= 0
      )
        endPort.connectedFromPort.forEach((d) => unConnectConnector(d));

      startPort.connectedToPort.push(connector);
      startPort.state = "active";
      endPort.connectedFromPort.push(connector);
      endPort.state = "active";

      invokeOnPortConnect(startPort, endPort);

      connector.startPort = startPort;
      connector.endPort = endPort;
    } else if (endPort.direction == "output") {
      //如果已经链接上了，取消链接
      const connData = startPort.isConnectByPort(endPort);
      if (connData != null) {
        unConnectConnector(connData);
        connectingInfo.isConnecting = false;
        return null;
      }

      connector = new NodeConnectorEditor();

      //如果是行为端口，只能输出一条线路。
      if (endPort.define.paramType.isExecute && endPort.connectedToPort.length > 0)
        endPort.connectedToPort.forEach((d) => unConnectConnector(d));
      //如果是参数端口，只能输入一条线路。
      if (
        !startPort.define.paramType.isExecute &&
        startPort.connectedFromPort.length > 0
      )
        startPort.connectedFromPort.forEach((d) => unConnectConnector(d));

      endPort.connectedToPort.push(connector);
      endPort.state = "active";
      startPort.connectedFromPort.push(connector);
      startPort.state = "active";

      invokeOnPortConnect(endPort, startPort);

      connector.startPort = endPort;
      connector.endPort = startPort;
    }

    //添加线段
    if (connector != null) {
      context.addConnector(connector);
      connector.updatePortValue();
    }
    return connector;
  }
  /**
   * 取消连接单元
   * @param conn 对应连接
   */
  function unConnectConnector(connector: NodeConnector) {
    const
      start = connector.startPort as NodePortEditor,
      end = connector.endPort as NodePortEditor;

    context.removeConnector(connector as NodeConnectorEditor);

    if (start != null && end != null) {

      start.removeConnectToPort(end);
      start.state = start.isConnected() ? 'active' : 'normal';
      end.removeConnectByPort(start);
      end.state = end.isConnected() ? 'active' : 'normal';

      //TODO: if (eventInfo.onPortUnConnect) eventInfo.onPortUnConnect(start, end);
      //if (start.parent.define.events.onPortUnConnect) start.parent.define.events.onPortUnConnect(start.parent, start);
      //if (end.parent.define.events.onPortUnConnect) end.parent.define.events.onPortUnConnect(end.parent, end);
    }
  }
  //删除端口连接
  function unConnectPortConnectors(port: NodePort) {
    for (let i = port.connectedFromPort.length - 1; i >= 0; i--) 
      unConnectConnector(port.connectedFromPort[i]);
    for (let i = port.connectedToPort.length - 1; i >= 0; i--) 
      unConnectConnector(port.connectedToPort[i]);
  }
  //删除单元连接
  function unConnectNodeConnectors(block: Node) {
    block.ports.forEach((p) => unConnectPortConnectors(p));
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

  context.updateCurrentHoverPort = updateCurrentHoverPort;
  context.updateConnectEnd = updateConnectEnd;
  context.startConnect = startConnect;
  context.endConnect = endConnect;
  context.getCanConnect = getCanConnect;
  context.endConnectToNew = endConnectToNew;
  context.connectConnector = connectConnector;
  context.unConnectConnector = unConnectConnector;
  context.unConnectPortConnectors = unConnectPortConnectors;
  context.unConnectNodeConnectors = unConnectNodeConnectors;
  context.isAnyConnectorHover = isAnyConnectorHover;
  context.isConnectToNew = isConnectToNew;
  context.getConnectingInfo = getConnectingInfo;

  return {
    connectingInfo,
  }
}