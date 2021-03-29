import BlockServiceInstance from "../../../sevices/BlockService"
import { PackageDef } from "../../Define/PackageDef"
import ArrayBlocks from "../ArrayBlocks"
import BaseBlocks from "../BaseBlocks"
import ControlBlocks from "../ControlBlocks"
import DictionaryBlocks from "../DictionaryBlocks"
import LogicBlocks from "../LogicBlocks"
import OperatorBlocks from "../OperatorBlocks"
import OSBlocks from "../Nodejs/OSBlocks"
import SetBlocks from "../SetBlocks"

export default {
  registerAll,
  registerPack,
  unregisterPack,
  isPackRegister,
  getAllPacks,
  coreVersion: '1.0.300',
}

function registerAll() {
  getAllPacks().forEach((pack) => registerPack(pack));
}
function registerPack(pack : PackageDef) {
  let blocks = pack.register();
  BlockServiceInstance.registerBlockPack(pack);
  blocks.forEach(element => {
    BlockServiceInstance.registerBlock(element, pack, false);
  });
}
function isPackRegister(name : string) {
  return BlockServiceInstance.getBlockPackRegistered(name);
}
function unregisterPack(pack : PackageDef) {
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