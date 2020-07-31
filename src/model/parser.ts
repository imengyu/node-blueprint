import { EditorInterface } from "./editor";
import CommonUtils from "../utils/CommonUtils";

export class EditorFileParser {

  public constructor(editor : EditorInterface) {
    this.editor = editor;
  }

  private editor : EditorInterface;

  //保存
  public saveToString() {
    let data = {
      blockMap: [],
      blocks: [],
      portMap: [],
      connectors: [],
      params: [],
    };

    let findBlockGUIDMap = function(guid : string) {
      for(let i = 0, c = data.blockMap.length; i < c; i++)
        if(data.blockMap[i] == guid)
          return i;
      return -1;
    };
    let findPortGUIDMap = function(guid : string) {
      for(let i = 0, c = data.portMap.length; i < c; i++)
        if(data.portMap[i] == guid)
          return i;
      return -1;
    };
    let findBlockIndex = function(uid : string) {
      for(let i = 0, c = data.blocks.length; i < c; i++)
        if(data.blocks[i].uid == uid)
          return i;
      return -1;
    };

    //Write blocks
    this.editor.getBlocks().forEach(block => {
      let mapIndex = findBlockGUIDMap(block.guid);
      if(mapIndex == -1)
        mapIndex = data.blockMap.push(block.guid) - 1;

      let blockData = {
        guidMap: mapIndex,
        uid: block.uid,
        mark: block.mark,
        breakpoint: block.breakpoint,
        options: block.options,
      };

      let blocksIndex = data.blocks.push(blockData) - 1;

      for(let i = 0, c = block.inputParameters.length; i < c; i++) {

        let mapIndex = findPortGUIDMap(block.inputParameters[i].guid);
        if(mapIndex == -1)
          mapIndex = data.portMap.push(block.inputParameters[i].guid) - 1;

        data.params.push({
          block: blocksIndex,
          guidMap: mapIndex,
          value: block.inputParameters[i].paramValue
        })
      }
      for(let i = 0, c = block.outputParameters.length; i < c; i++) {

        let mapIndex = findPortGUIDMap(block.outputParameters[i].guid);
        if(mapIndex == -1)
          mapIndex = data.portMap.push(block.outputParameters[i].guid) - 1;

        data.params.push({
          block: blocksIndex,
          guidMap: mapIndex,
          value: block.outputParameters[i].paramValue
        })
      }
      

    });

    //Write connectors
    this.editor.getBlocks().forEach(block => {

      for(let i = 0, c = block.outputPorts.length; i < c; i++) {

        let connector = block.outputPorts[i].connector;
        if(connector != null) {
          data.connectors.push({
            startBlock: findBlockIndex(connector.startPort.parent.uid),
            startPort: connector.startPort.guid,
            endBlock: findBlockIndex(connector.endPort.parent.uid),
            endPort: connector.endPort.guid,
          });
        }
      }

      for(let i = 0, c = block.outputParameters.length; i < c; i++) {

        let connector = block.outputParameters[i].connector;
        if(connector != null) {
          data.connectors.push({
            startBlock: findBlockIndex(connector.startPort.parent.uid),
            startPort: connector.startPort.guid,
            endBlock: findBlockIndex(connector.endPort.parent.uid),
            endPort: connector.endPort.guid,
          });
        }
      }
    });

    return JSON.stringify(data);
  }

  //加载
  public loadFromString(str : string) {
    if(CommonUtils.isNullOrEmpty(str)) {
      console.log('[loadFromString] invalid string!');
      return false;
    }

    let data = JSON.parse(str);



  }
}