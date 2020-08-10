import { BlockEditor } from "./BlockEditor";
import { BlockPort } from "../Define/Port";
import { Vector2 } from "../Vector2";
import { ConnectorEditor } from "./ConnectorEditor";

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
}