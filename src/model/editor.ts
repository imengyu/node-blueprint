import { Block } from "./block";
import { Vector2 } from "./vector2";
import { BlockPort } from "./port";
import { Connector } from "./connector";
import { BlockRegData } from "./blockdef";

export interface EditorInterface {
  onMoveBlock(block : Block, moveOffest : Vector2);
  onMoveBlockEnd(block : Block);
  onUserSelectBlock(block : Block);
  onBlockDelete(block : Block);

  getToolBarHeight() : number;
  getBlockHostElement() : HTMLElement;
  getSelectedBlocks() : Block[];
  unSelectAllBlocks();

  startConnect(port : BlockPort);
  updateConnectEnd(pos : Vector2);
  updateCurrentHoverPort(port : BlockPort);
  updateCurrentHoverPortLeave(port : BlockPort);
  getCurrentHoverPort() : BlockPort;
  endConnect(port : BlockPort);

  getBlocks() : Block[];
  getConnectors() : Connector[];

  registerBlock(blockdef : BlockRegData, updateList ?: boolean);
  getRegisteredBlock(guid : string);
  unregisterBlock(guid : string);
  /**
   * 刷新单元列表
   */
  updateBlocksList();
}