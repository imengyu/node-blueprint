import { BlockDocunment, BlockGraphDocunment } from "../Define/BlockDocunment";
import { BlockRegData, BlockPortRegData } from "../Define/BlockDef";
import { BlockEditor } from "../Editor/BlockEditor";
import BlockServiceInstance from "../../sevices/BlockService";
import StringUtils from "../../utils/StringUtils";
import { BlockParameterPort, BlockBehaviorPort } from "../Define/Port";
import { Connector } from "../Define/Connector";
import { ConnectorEditor } from "../Editor/ConnectorEditor";
import { Block } from "../Define/Block";

/**
 * 流图保存加载解析器
 */
export class BlockFileParser {

  private saveGraph(graph : BlockGraphDocunment, docData : {
    blockMap: Array<any>,
    portMap: Array<any>,
  }, saveToEditor : boolean) {
    let data = {
      name: graph.name,
      viewPort: graph.viewPort,
      scale: graph.scale,
      childGraphs: [],
      
      blocks: [],
      connectors: [],
      params: [],
      ports: [],
      boxs: [],
      comments: graph.comments,
      comment: graph.comment,
      behavorPorts: graph.behavorPorts,
      parameterPorts: graph.parameterPorts,
      variables: graph.variables,
    };

    let findBlockGUIDMap = function(guid : string) {
      for(let i = 0, c = docData.blockMap.length; i < c; i++)
        if(docData.blockMap[i] == guid)
          return i;
      return -1;
    };
    let findPortGUIDMap = function(guid : string) {
      for(let i = 0, c = docData.portMap.length; i < c; i++)
        if(docData.portMap[i].guid == guid)
          return [i,docData.portMap[i]];
      return [-1,null];
    };
    let findBlockIndex = function(uid : string) {
      for(let i = 0, c = data.blocks.length; i < c; i++)
        if(data.blocks[i].uid == uid)
          return i;
      return -1;
    };

    //Write blocks
    graph.blocks.forEach(block => {
      let mapIndex = findBlockGUIDMap(block.guid);
      if(mapIndex == -1)
        mapIndex = docData.blockMap.push(block.guid) - 1;

      let blockData = {
        guidMap: mapIndex,
        uid: block.uid,
        mark: saveToEditor ? (<BlockEditor>block).mark : undefined,
        markOpen: saveToEditor ? (<BlockEditor>block).markOpen : undefined,
        breakpoint: saveToEditor ? block.breakpoint : undefined,
        options: block.options,
        position: saveToEditor ? (<BlockEditor>block).position : undefined,
      };

      let blocksIndex = data.blocks.push(blockData) - 1;

      //Write Parameters
      for(let i = 0, keys = Object.keys(block.inputParameters), c = keys.length; i < c; i++) {

        let port : BlockParameterPort = block.inputParameters[keys[i]];
        let portData = findPortGUIDMap(block.guid + '-' + port.guid);
        if(portData[0] == -1)
          portData[0] = docData.portMap.push({
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
          portData[0] = docData.portMap.push({
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
            portData[0] = docData.portMap.push({
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
            portData[0] = docData.portMap.push({
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
    graph.connectors.forEach(connector => {
      data.connectors.push({
        startBlock: findBlockIndex(connector.startPort.parent.uid),
        startPort: connector.startPort.guid,
        endBlock: findBlockIndex(connector.endPort.parent.uid),
        endPort: connector.endPort.guid,
      });
    });

    if(saveToEditor) {

    }

    //Save child graph
    graph.children.forEach((childGraph) =>
      data.childGraphs.push(this.saveGraph(childGraph, docData, saveToEditor))
    );

    return data;
  }
  private loadGraph(graphData, parentGraph : BlockGraphDocunment, blockRegDatas : Array<BlockRegData>, portRegDatas, readToEditor : boolean) {

    let graph : BlockGraphDocunment = {
      name: graphData.name,
      viewPort: graphData.viewPort,
      scale: graphData.scale,
      comments: graphData.comments,
      children: [],
      blocks: [],
      connectors: [],
      isEditor: readToEditor,
      parent: parentGraph,
      comment: graphData.comment,
      behavorPorts: graphData.behavorPorts,
      parameterPorts: graphData.parameterPorts,
      variables: graphData.variables,
    };
    
    //blocks
    graphData.blocks.forEach(block => {
      let blockInstance = readToEditor ? new BlockEditor(blockRegDatas[block.guidMap]) : new Block(blockRegDatas[block.guidMap]);
      
      blockInstance.uid = block.uid;
      blockInstance.breakpoint = block.breakpoint;
      blockInstance.options = block.options;
      if(readToEditor) {
        (<BlockEditor>blockInstance).position.Set(block.position);
        (<BlockEditor>blockInstance).mark = block.mark;
        (<BlockEditor>blockInstance).markOpen = block.markOpen;
      }

      graph.blocks.push(blockInstance);
    });

    //param ports
    graphData.params.forEach(param => {
      let port : BlockParameterPort = null;
      if(param.dyamicAdd)
        port = graph.blocks[param.blockMap].addParameterPort(portRegDatas[param.guidMap].regData, true, param.value);
      else {
        port = graph.blocks[param.blockMap].getParameterPort(portRegDatas[param.guidMap].guid.substr(37));
        port.paramUserSetValue = param.value;
      }

      port.paramValue = param.value;
      port.options = param.options;
    });

    //behavior ports
    graphData.ports.forEach(port => graph.blocks[port.blockMap].addPort(portRegDatas[port.guidMap].regData, true));

    //connectors
    graphData.connectors.forEach(connector => {
      let startPort = graph.blocks[connector.startBlock].getPortByGUID(connector.startPort);
      let endPort = graph.blocks[connector.endBlock].getPortByGUID(connector.endPort);
      
      graph.connectors.push(readToEditor ? 
        new ConnectorEditor(startPort, endPort) : new Connector(startPort, endPort));
    }); 


    //child graph
    graphData.childGraphs.forEach(childGraph => {
      graph.children.push(this.loadGraph(childGraph, graph, blockRegDatas, portRegDatas, readToEditor));
    }); 

    return graph;
  }

  /**
   * 保存流图文档至字符串
   * @param doc 流图文档
   * @param saveToEditor 是否保存编辑器信息为编辑器版本，否则为运行版本
   * @returns 已保存的字符串
   */
  public saveToString(doc : BlockDocunment, saveToEditor : boolean) {
    let data = {
      name: doc.name,
      libVersion: doc.libVersion,
      openEditorVersion: doc.openEditorVersion,
      mainGraph: null,
      blockMap: [],
      portMap: [],
    };
    data.mainGraph = this.saveGraph(doc.mainGraph, data, saveToEditor);
    return JSON.stringify(data);
  }

  /**
   * 从字符串加载流图文档
   * @param str 字符串
   * @param doc 目标流图文档
   * @param readToEditor 是否加载编辑器信息
   */
  public loadFromString(str : string, doc : BlockDocunment, readToEditor : boolean) {
    if(StringUtils.isNullOrEmpty(str)) {
      console.log('[loadFromString] invalid string!');
      return false;
    }

    let blockRegDatas : Array<BlockRegData> = [];
    let portRegDatas = [];

    let data = JSON.parse(str);

    doc.libVersion = data.libVersion;
    doc.openEditorVersion = data.openEditorVersion;
    doc.name = data.name;
    doc.isEditor = readToEditor;
    //block GUID map
    data.blockMap.forEach(guid => blockRegDatas.push(BlockServiceInstance.getRegisteredBlock(guid)));
    //port GUID map
    data.portMap.forEach(port => portRegDatas.push(port));
    //load Graph
    doc.mainGraph = this.loadGraph(data.mainGraph, null, blockRegDatas, portRegDatas, readToEditor);

    return doc;
  }
}