import { EditorInterface } from "./Editor";
import CommonUtils from "../utils/CommonUtils";
import { BlockParameterPort, BlockBehaviorPort } from "./Port";

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
      ports: [],
      boxs: [],
      comments: [],
    };

    let findBlockGUIDMap = function(guid : string) {
      for(let i = 0, c = data.blockMap.length; i < c; i++)
        if(data.blockMap[i] == guid)
          return i;
      return -1;
    };
    let findPortGUIDMap = function(guid : string) {
      for(let i = 0, c = data.portMap.length; i < c; i++)
        if(data.portMap[i].guid == guid)
          return [i,data.portMap[i]];
      return [-1,null];
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

      //Write Parameters
      for(let i = 0, keys = Object.keys(block.inputParameters), c = keys.length; i < c; i++) {

        let port : BlockParameterPort = block.inputParameters[keys[i]];
        let portData = findPortGUIDMap(block.guid + '-' + port.guid);
        if(portData[0] == -1)
          portData[0] = data.portMap.push({
            guid: block.guid + '-' + port.guid,
            regData: port.regData,
          }) - 1;

        data.params.push({
          blockMap: blocksIndex,            
          guidMap: portData[0],
          dyamicAdd: port.isDyamicAdd,
          direction: 'input',
          options: port.options,
          value: port.paramUserSetValue
        })
      }
      for(let i = 0, keys = Object.keys(block.outputParameters), c = keys.length; i < c; i++) {

        let port : BlockParameterPort = block.outputParameters[keys[i]];
        let portData = findPortGUIDMap(block.guid + '-' + port.guid);
        if(portData[0] == -1)
          portData[0] = data.portMap.push({
            guid: block.guid + '-' + port.guid,
            regData: port.regData,
          }) - 1;

        data.params.push({
          blockMap: blocksIndex,            
          guidMap: portData[0],
          dyamicAdd: port.isDyamicAdd,
          direction: 'output',
          options: port.options,
          value: port.paramUserSetValue
        })
      }
      
      //Write dyamicadd ports
      for(let i = 0, keys = Object.keys(block.inputPorts), c = keys.length; i < c; i++) {

        let port : BlockBehaviorPort = block.inputPorts[keys[i]];
        if(port.isDyamicAdd) {

          let portData = findPortGUIDMap(block.guid + '-' + port.guid);
          if(portData[0] == -1)
            portData[0] = data.portMap.push({
              guid: block.guid + '-' + port.guid,
              regData: port.regData,
            }) - 1;
            
          data.ports.push({
            blockMap: blocksIndex,
            guidMap: portData[0],
            direction: 'input',
          })
        }
      }
      for(let i = 0, keys = Object.keys(block.outputPorts), c = keys.length; i < c; i++) {

        let port : BlockBehaviorPort = block.outputPorts[keys[i]];
        if(port.isDyamicAdd) {

          let portData = findPortGUIDMap(block.guid + '-' + port.guid);
          if(portData[0] == -1)
            portData[0] = data.portMap.push({
              guid: block.guid + '-' + port.guid,
              regData: port.regData,
            }) - 1;
            
          data.ports.push({
            blockMap: blocksIndex,
            guidMap: portData[0],
            direction: 'output',
          })
        }
      }



    });

    //Write connectors
    this.editor.getBlocks().forEach(block => {

      for(let i = 0, keys = Object.keys(block.outputPorts), c = keys.length; i < c; i++) {

        let connector = block.outputPorts[keys[i]].connector;
        if(connector != null) {
          data.connectors.push({
            startBlock: findBlockIndex(connector.startPort.parent.uid),
            startPort: connector.startPort.guid,
            endBlock: findBlockIndex(connector.endPort.parent.uid),
            endPort: connector.endPort.guid,
          });
        }
      }

      for(let i = 0, keys = Object.keys(block.outputParameters), c = keys.length; i < c; i++) {

        let connector = block.outputParameters[keys[i]].connector;
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
  public loadFromString(str : string, editorMode : boolean) {
    if(CommonUtils.isNullOrEmpty(str)) {
      console.log('[loadFromString] invalid string!');
      return false;
    }

    let data = JSON.parse(str);



  }
}