import { Vector2 } from "@/Common/Base/Vector2";
import type { CustomStorageObject, INodeDefine } from "@/Core/Node/Node";
import { EditorHistoryAction } from "../History/Action";
import { printWarning } from "@/Common/Logger/DevLog";
import type { EditorHistoryNodeInfo } from "../History/InfoStorage";
import { NodeEditor } from "@/Core/Editor/NodeEditor";
import { NodeConnectorEditor } from "@/Core/Editor/NodeConnectorEditor";
import type { EditorHistoryLinkingContext } from "../History/Shadow";

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

/**
 * 添加节点操作
 */
export class AddNodeAction<T = CustomStorageObject> extends EditorHistoryAction<
  {
    define: INodeDefine, 
    options: NodeEditorUserAddNodeOptions<T>,
  }, 
  EditorHistoryNodeInfo, 
  Node|null
> {
  constructor(define: INodeDefine, options: NodeEditorUserAddNodeOptions<T>) {
    super("添加节点", () => ({
      define,
      options,
    }));
  }

  protected override async onStepExecute(inputParams: { define: INodeDefine; options: NodeEditorUserAddNodeOptions<T>; }, isRedo: boolean, linkingContext: EditorHistoryLinkingContext): Promise<EditorHistoryNodeInfo | null | undefined> {
    const { define, options } = inputParams;
    const context = this.actionContext.context;
    const currentGraph = context.graphManager.getCurrentGraph();

    //检查单元是否只能有一个
    if(define.oneNodeOnly && currentGraph?.getNodesByGUID(define.guid).length > 0) {  
      if (options.noErrorAlert)   
        printWarning(this.name, null, '当前文档中已经有 ' + define.name + ' 了，此单元只能有一个');
      else
        context.interfaceUtiles.userActionAlert('warning', '当前文档中已经有 ' + define.name + ' 了，此单元只能有一个');
      return null;
    }
    //自定义检查回调
    if(typeof define.events?.onAddCheck === 'function') {
      const err = define.events.onAddCheck(define, currentGraph);
      if(err !== null) {
        if (options.noErrorAlert)   
          printWarning(this.name, null, err);
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

    this.actionContext.setDoingReturn(newNode);
    return this.actionContext.toNodeInfo(newNode);
  }
  protected override async onStepUndo(restoreData: EditorHistoryNodeInfo) {
    const node = restoreData.requestInstance();
    if (node.define.canNotDelete) 
      return;
    this.actionContext.context.graphManager.removeNode(node, true);
  }
}