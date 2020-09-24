import { Content } from "iview"
import BlockServiceInstance from "../../../sevices/BlockService"
import ArrayBlocks from "../ArrayBlocks"
import BaseBlocks from "../BaseBlocks"
import ControlBlocks from "../ControlBlocks"
import DictionaryBlocks from "../DictionaryBlocks"
import LogicBlocks from "../LogicBlocks"
import OperatorBlocks from "../OperatorBlocks"
import OSBlocks from "../OSBlocks"
import SetBlocks from "../SetBlocks"

export default {
  registerAll,
  registerPack,
  unregisterPack,
  getAllPacks,
}

function registerAll() {
  getAllPacks().forEach((pack) => registerPack(pack));
}
function registerPack(pack : BlockPack) {
  let blocks = pack.register();
  blocks.forEach(element => {
    BlockServiceInstance.registerBlock(element, pack, false);
  });
}
function unregisterPack(pack : BlockPack) {
  let blocks = pack.register();
  blocks.forEach(element => {
    BlockServiceInstance.unregisterBlock(element.guid, false);
  });
  BlockServiceInstance.unregisterBlockPack(pack);
}
function getAllPacks() {
  return [
    ArrayBlocks,
    BaseBlocks,
    ControlBlocks,
    DictionaryBlocks,
    LogicBlocks,
    OperatorBlocks,
    OSBlocks,
    SetBlocks,
  ]
}

export interface BlockPack {
  register: Function,
  packageName: string,
  version: number,
}