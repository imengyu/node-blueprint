import { BlockEditor } from "./BlockEditor";
import { Vector2 } from "./Vector2";
import { BlockPort } from "./Port";
import { ConnectorEditor } from "./Connector";
import { Rect } from "./Rect";

export interface EditorInterface {
  onMoveBlock(block : BlockEditor, moveOffest : Vector2);
  onMoveBlockEnd(block : BlockEditor);
  onUserSelectBlock(block : BlockEditor);
  onBlockDelete(block : BlockEditor);

  getBlocks() : BlockEditor[];
  getConnectors() : ConnectorEditor[];

  clearAll();

  addBlock(block : BlockEditor, position : Vector2, connectToPort ?: BlockPort);
  deleteBlock(block : BlockEditor, remove ?: boolean);

  getViewPort() : Rect;
  getScale() : number;

  getToolBarHeight() : number;
  getToolBarWidth() : number;
  getBlockHostElement() : HTMLElement;
  getSelectedBlocks() : BlockEditor[];
  unSelectAllBlocks();
  getMultiSelectedBlocks() : BlockEditor[];

  connectConnector(startPort : BlockPort, endPort : BlockPort) : ConnectorEditor;
  unConnectConnector(connector : ConnectorEditor);
  startConnect(port : BlockPort);
  updateConnectEnd(pos : Vector2);
  updateCurrentHoverPort(port : BlockPort);
  updateCurrentHoverPortLeave(port : BlockPort);
  getCurrentHoverPort() : BlockPort;
  endConnect(port : BlockPort);

  getVue() : Vue;
  getRunningState() : EditorRunningState;
}

export type EditorRunningState = 'editing'|'running'|'runningPaused';