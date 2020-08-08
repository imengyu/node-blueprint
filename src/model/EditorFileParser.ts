import { EditorInterface } from "./Editor";
import CommonUtils from "../utils/CommonUtils";
import { BlockParameterPort, BlockBehaviorPort } from "./Port";
import { BlockEditor } from "./BlockEditor";
import BlockServiceInstance from "../sevices/BlockService";
import { BlockRegData, BlockPortRegData } from "./BlockDef";

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
      viewPort: this.editor.getViewPort(),
      scale: this.editor.getScale(),
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
        position: block.position,
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
    this.editor.getConnectors().forEach(connector => {
      data.connectors.push({
        startBlock: findBlockIndex(connector.startPort.parent.uid),
        startPort: connector.startPort.guid,
        endBlock: findBlockIndex(connector.endPort.parent.uid),
        endPort: connector.endPort.guid,
      });
    });

    return JSON.stringify(data);
  }

  //加载
  public loadFromString(str : string) {
    if(CommonUtils.isNullOrEmpty(str)) {
      console.log('[loadFromString] invalid string!');
      return false;
    }

    this.editor.clearAll();

    let data = JSON.parse(str);

    let blockRegDatas : Array<BlockRegData> = [];
    let blocks : Array<BlockEditor> = [];
    let portRegDatas = [];

    //block GUID map
    data.blockMap.forEach(guid => blockRegDatas.push(BlockServiceInstance.getRegisteredBlock(guid)));
    //port GUID map
    data.portMap.forEach(port => portRegDatas.push(port));

    //blocks
    data.blocks.forEach(block => {
      let blockInstance = new BlockEditor(
        this.editor,
        blockRegDatas[block.guidMap],
      );
      blockInstance.uid = block.uid;
      blockInstance.breakpoint = block.breakpoint;
      blockInstance.options = block.options;

      blocks.push(blockInstance);
      this.editor.addBlock(blockInstance, block.position);
    });

    //param ports
    data.params.forEach(param => {
      let port : BlockParameterPort = null;
      if(param.dyamicAdd)
        port = blocks[param.blockMap].addParameterPort(portRegDatas[param.guidMap].regData, true, param.value);
      else {
        port = blocks[param.blockMap].getParameterPort(portRegDatas[param.guidMap].guid.substr(37));
        port.paramUserSetValue = param.value;
        (<BlockEditor>port.parent).forceUpdateParamValueToEditor(port);
      }

      port.paramValue = param.value;
      port.options = param.options;
    });

    //behavior ports
    data.ports.forEach(port => blocks[port.blockMap].addPort(portRegDatas[port.guidMap].regData, true));

    //connectors
    data.connectors.forEach(connector => {
      let startPort = blocks[connector.startBlock].getPortByGUID(connector.startPort);
      let endPort = blocks[connector.endBlock].getPortByGUID(connector.endPort);
      this.editor.connectConnector(startPort, endPort);
    });







  }
}