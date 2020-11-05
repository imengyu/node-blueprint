import { BlockEditor } from "./BlockEditor";
import { BlockPort } from "../Define/Port";
import { Vector2 } from "../Vector2";
import { ConnectorEditor } from "./ConnectorEditor";
import { BlockPortRegData, BlockParameterTypeRegData } from "../Define/BlockDef";
import { BlockGraphVariable, BlockGraphDocunment } from "../Define/BlockDocunment";
import { EventHandler } from "../../utils/EventHandler";
import { BlockPortEditor } from "./BlockPortEditor";

export class BlockEditorOwner {
  getBlockHostElement : (layer : string) => HTMLElement;
  getMultiSelectedBlocks : () => BlockEditor[];
  getVue : () => Vue;

  onBlockDelete : (block : BlockEditor) => void;
  onUserSelectBlock : (block : BlockEditor, selectSingle : boolean) => void;
  onMoveBlock : (block : BlockEditor, pos : Vector2) => void;
  onMoveBlockEnd : (block : BlockEditor) => void;

  startConnect : (port : BlockPort) => void;
  endConnect : (port : BlockPort) => void;

  updateCurrentHoverPort : (port : BlockPort) => void;
  updateCurrentHoverPortLeave : (port : BlockPort) => void;
  updateConnectEnd : (pos : Vector2) => void;

  unSelectAllBlocks : () => void;
  unSelectAllConnector : () => void;
  unConnectConnector: (connector : ConnectorEditor) => void;

  isConnectorSelected: () => boolean;
  isAnyConnectorHover: () => boolean;
  getWorker: () => any;

  showBlockRightMenu : (block : BlockEditor, pos : Vector2) => void;
  showPortRightMenu : (port : BlockPortEditor, pos : Vector2) => void;
  showInputRightMenu : (pos : Vector2, ele : HTMLInputElement) => void;
  showConnectorRightMenu : (pos : Vector2) => void;
  deleteBlock: (block : BlockEditor, rm ?: boolean) => void;

  chooseType: (pos : Vector2, callback: (type: BlockParameterTypeRegData, isBaseType : boolean) => void, canBeExecute : boolean) => void;
  openGraph: (graph : BlockGraphDocunment) => void;

  markFileChanged : () => void;

  viewPortPosToWindowPos: (pos : Vector2) => Vector2;
  windowPosToViewPortPos: (pos : Vector2) => Vector2;

  //编辑器事件回调
  graphVariableChange : {
    onVariableAdd : (graph : BlockGraphDocunment, variable : BlockGraphVariable) => void,
    onVariableRemove : (graph : BlockGraphDocunment, variable : BlockGraphVariable) => void,
    onVariableUpdate : (graph : BlockGraphDocunment, variableOldName : string, variable : BlockGraphVariable) => void,
  };
  graphChange : {
    onVGraphUpdate : (graph : BlockGraphDocunment) => void,
  };
  graphPortChange : {
    onPortAdd : (graph : BlockGraphDocunment, port : BlockPortRegData) => void,
    onPortRemove : (graph : BlockGraphDocunment, port : BlockPortRegData) => void,
    onPortUpdate : (graph : BlockGraphDocunment, port : BlockPortRegData) => void,
    onPortMoveUp : (graph : BlockGraphDocunment, port : BlockPortRegData, index: number) => void,
    onPortMoveDown : (graph : BlockGraphDocunment, port : BlockPortRegData, index: number) => void,
  };

  //编辑器事件
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
