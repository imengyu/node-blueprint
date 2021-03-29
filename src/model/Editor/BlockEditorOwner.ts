import { BlockEditor } from "./BlockEditor";
import { BlockPort } from "../Define/Port";
import { Vector2 } from "../Vector2";
import { ConnectorEditor } from "./ConnectorEditor";
import { BlockPortRegData, BlockParameterTypeRegData } from "../Define/BlockDef";
import { BlockGraphVariable, BlockGraphDocunment } from "../Define/BlockDocunment";
import { EventHandler } from "../../utils/EventHandler";
import { BlockPortEditor } from "./BlockPortEditor";
import { Rect } from "../Rect";

export class BlockEditorOwner {

  /**
   * 获取单元包含容器
   * @param layer 容器的层 可以是 '' 'nornal' 'background'
   */
  getBlockHostElement : (layer : string) => HTMLElement;
  /**
   * 获取多选选中的单元
   */
  getMultiSelectedBlocks : () => BlockEditor[];
  /**
   * 获取在矩形区域内的单元
   * @param rect 矩形区域，坐标为视口绝对坐标
   */
  getBlocksInRect : (rect : Rect) => BlockEditor[];
  getVue : () => Vue;
  /**
   * 获取编辑器视图缩放大小
   */
  getViewZoom: () => number;

  onBlockDelete : (block : BlockEditor) => void;
  onUserSelectBlock : (block : BlockEditor, selectSingle : boolean) => boolean;
  onMoveBlock : (block : BlockEditor, pos : Vector2) => void;
  onMoveBlockEnd : (block : BlockEditor) => void;

  startConnect : (port : BlockPortEditor) => void;
  endConnect : (port : BlockPortEditor) => void;

  updateCurrentHoverPort : (port : BlockPortEditor) => void;
  updateCurrentHoverPortLeave : (port : BlockPortEditor) => void;
  updateConnectEnd : (pos : Vector2) => void;

  /**
   * 取消选择所有单元
   */
  unSelectAllBlocks : () => void;
  /**
   * 取消选择所有连接线
   */
  unSelectAllConnector : () => void;
  /**
   * 取消连接某个连接线
   * @param connector 要取消连接的连接线
   */
  unConnectConnector: (connector : ConnectorEditor) => void;

  /**
   * 获取当前是否有连接线被选中
   */
  isConnectorSelected: () => boolean;
  /**
   * 获取当前鼠标是否悬浮在某个连接线上
   */
  isAnyConnectorHover: () => boolean;
  getWorker: () => any;

  showBlockRightMenu : (block : BlockEditor, pos : Vector2) => void;
  showPortRightMenu : (port : BlockPortEditor, pos : Vector2) => void;
  showInputRightMenu : (pos : Vector2, ele : HTMLInputElement) => void;
  showConnectorRightMenu : (pos : Vector2) => void;
  deleteBlock: (block : BlockEditor, rm ?: boolean) => void;

  /**
   * 打开类型选择对话框，让用户选择一个类型，并在 callback 中回调
   * @param pos 显示位置，屏幕坐标
   * @param callback 回调
   * @param canBeExecute 指定用户可不可以选择执行
   */
  chooseType: (pos : Vector2, callback: (type: BlockParameterTypeRegData, isBaseType : boolean) => void, canBeExecute : boolean) => void;
  /**
   * 打开流图文档
   * @param graph 文档结构
   */
  openGraph: (graph : BlockGraphDocunment) => void;

  /**
   * 通知文件已经更改
   */
  markFileChanged : () => void;

  /**
   * 视口坐标转为窗口坐标
   */
  viewPortPosToWindowPos: (pos : Vector2) => Vector2;
  /**
   * 窗口坐标转为视口坐标
   */
  windowPosToViewPortPos: (pos : Vector2) => Vector2;

  /**
   * 流图变量更改时的回调
   */
  graphVariableChange : {
    onVariableAdd : (graph : BlockGraphDocunment, variable : BlockGraphVariable) => void,
    onVariableRemove : (graph : BlockGraphDocunment, variable : BlockGraphVariable) => void,
    onVariableUpdate : (graph : BlockGraphDocunment, variableOldName : string, variable : BlockGraphVariable) => void,
  };
  /**
   * 流图更新时的回调
   */
  graphChange : {
    onGraphUpdate : (graph : BlockGraphDocunment) => void,
  };
  /**
   * 流图端口更改时的回调
   */
  graphPortChange : {
    onPortAdd : (graph : BlockGraphDocunment, port : BlockPortRegData) => void,
    onPortRemove : (graph : BlockGraphDocunment, port : BlockPortRegData) => void,
    onPortUpdate : (graph : BlockGraphDocunment, port : BlockPortRegData) => void,
    onPortMoveUp : (graph : BlockGraphDocunment, port : BlockPortRegData, index: number) => void,
    onPortMoveDown : (graph : BlockGraphDocunment, port : BlockPortRegData, index: number) => void,
  };

  /**
   * 编辑器事件回调
   */
  editorEvents: {
    onGraphPortAdd : EventHandler<BlockGraphPortChangeCallback>,
    onGraphPortUpdate : EventHandler<BlockGraphPortChangeCallback>,
    onGraphPortRemove : EventHandler<BlockGraphPortChangeCallback>,
    onGraphPortMoveUp : EventHandler<BlockGraphPortChangeCallback>,
    onGraphPortMoveDown : EventHandler<BlockGraphPortChangeCallback>,
    onVariableAdd: EventHandler<BlockGraphVariableChangeCallback>,
    onVariableRemove: EventHandler<BlockGraphVariableChangeCallback>,
    onVariableUpdate: EventHandler<BlockGraphVariableFullChangeCallback>,
    onGraphDelete : EventHandler<BlockGraphChangeCallback>,
    onGraphUpdate : EventHandler<BlockGraphChangeCallback>,
  } = {
    onGraphPortAdd: null,
    onGraphPortUpdate: null,
    onGraphPortMoveUp: null,
    onGraphPortRemove: null,
    onGraphPortMoveDown: null,
    onVariableAdd: null,
    onVariableRemove: null,
    onVariableUpdate: null,
    onGraphDelete: null,
    onGraphUpdate: null,
  };



}

export type BlockPortRegDataCallback = (port: BlockPortRegData) => void;
export type BlockPortRegDataMoveCallback = (port: BlockPortRegData, index: number) => void;

export type BlockGraphChangeCallback = (graph: BlockGraphDocunment) => void;
export type BlockGraphPortChangeCallback = (graph: BlockGraphDocunment, port: BlockPortRegData) => void;
export type BlockGraphVariableChangeCallback = (graph: BlockGraphDocunment, variable : BlockGraphVariable) => void;
export type BlockGraphVariableFullChangeCallback = (graph: BlockGraphDocunment, variableOldName: string, variable : BlockGraphVariable) => void;
