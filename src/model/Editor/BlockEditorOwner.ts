import { BlockEditor } from "./BlockEditor";
import { BlockPort } from "../Define/Port";
import { Vector2 } from "../Vector2";
import { ConnectorEditor } from "./ConnectorEditor";
import { BlockPortRegData } from "../Define/BlockDef";
import { BlockGraphVariable, BlockGraphDocunment } from "../Define/BlockDocunment";
import { EventHandler } from "../../utils/EventHandler";

export class BlockEditorOwner {
  getBlockHostElement : () => HTMLElement;
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
  unConnectConnector: (connector : ConnectorEditor) => void;

  showBlockRightMenu : (pos : Vector2) => void;

  //编辑器事件回调
  graphVariableChange : {
    onVariableAdd : (graph : BlockGraphDocunment, variable : BlockGraphVariable) => void,
    onVariableRemove : (graph : BlockGraphDocunment, variable : BlockGraphVariable) => void,
    onVariableUpdate : (graph : BlockGraphDocunment, variable : BlockGraphVariable) => void,
  };
  //编辑器事件回调
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
    onVariableUpdate: EventHandler<BlockGraphVariableChangeCallback>,
  } = {
    onGraphPortAdd: null,
    onGraphPortUpdate: null,
    onGraphPortMoveUp: null,
    onGraphPortRemove: null,
    onGraphPortMoveDown: null,
    onVariableAdd: null,
    onVariableRemove: null,
    onVariableUpdate: null,
  };

}

export type BlockPortRegDataCallback = (port: BlockPortRegData) => void;
export type BlockPortRegDataMoveCallback = (port: BlockPortRegData, index: number) => void;

export type BlockGraphPortChangeCallback = (graph: BlockGraphDocunment, port: BlockPortRegData) => void;
export type BlockGraphVariableChangeCallback = (graph: BlockGraphDocunment, variable : BlockGraphVariable) => void;
