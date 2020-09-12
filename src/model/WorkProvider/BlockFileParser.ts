import { BlockDocunment, BlockGraphDocunment, BlockGraphVariable } from "../Define/BlockDocunment";
import { BlockRegData, BlockPortRegData } from "../Define/BlockDef";
import { BlockEditor } from "../Editor/BlockEditor";
import BlockServiceInstance from "../../sevices/BlockService";
import StringUtils from "../../utils/StringUtils";
import { BlockPort } from "../Define/Port";
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

      comment: graph.comment,
      inputPorts: graph.inputPorts,
      outputPorts: graph.outputPorts,
      variables: graph.variables,
      
      blocks: [],
      ports: [],
      connectors: [],
      boxs: [],
      comments: graph.comments,
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
      for(let i = 0, keys = Object.keys(block.inputPorts), c = keys.length; i < c; i++) {

        let port : BlockPort = block.inputPorts[keys[i]];
        let portData = findPortGUIDMap(block.guid + '-' + port.guid);
        if(portData[0] == -1)
          portData[0] = docData.portMap.push({
            guid: block.guid + '-' + port.guid,
            regData: port.regData,
          }) - 1;

        if(port.paramType != 'execute' || port.isDyamicAdd)
          data.ports.push({
            blockMap: blocksIndex,            
            guidMap: portData[0],
            dyamicAdd: port.isDyamicAdd,
            direction: 'input',
            options: port.options,
            value: port.paramUserSetValue,
            type: port.paramType,
          })
      }
      for(let i = 0, keys = Object.keys(block.outputPorts), c = keys.length; i < c; i++) {

        let port : BlockPort = block.outputPorts[keys[i]];
        let portData = findPortGUIDMap(block.guid + '-' + port.guid);
        if(portData[0] == -1)
          portData[0] = docData.portMap.push({
            guid: block.guid + '-' + port.guid,
            regData: port.regData,
          }) - 1;

        if(port.paramType != 'execute' || port.isDyamicAdd)
          data.ports.push({
            blockMap: blocksIndex,            
            guidMap: portData[0],
            dyamicAdd: port.isDyamicAdd,
            direction: 'output',
            options: port.options,
            value: port.paramUserSetValue,
            type: port.paramType,
          })
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

    let graph = new BlockGraphDocunment()
    
    graph.name = graphData.name;
    graph.viewPort = graphData.viewPort;
    graph.scale = graphData.scale;
    graph.comments = graphData.comments;
    graph.children = [];
    graph.blocks = [];
    graph.connectors = [];
    graph.isEditor = readToEditor;
    graph.parent = parentGraph;
    graph.comment = graphData.comment;
    graph.inputPorts = graphData.inputPorts;
    graph.outputPorts = graphData.outputPorts;
    graph.variables = [];
    graph.isMainGraph = false;

    //variables
    graphData.variables.forEach(variable => {
      let v = new BlockGraphVariable();
      v.defaultValue = variable.defaultValue;
      v.value = variable.value;
      v.name = variable.name;
      v.type = variable.type;
      graph.variables.push(v);
    }); 
    
    //blocks
    graphData.blocks.forEach(block => {
      let blockInstance = readToEditor ? new BlockEditor(blockRegDatas[block.guidMap]) : new Block(blockRegDatas[block.guidMap]);
      
      blockInstance.uid = block.uid;
      blockInstance.breakpoint = block.breakpoint;
      blockInstance.currentGraph = graph;
      blockInstance.options = block.options;
      blockInstance.createBase();

      if(readToEditor) {
        (<BlockEditor>blockInstance).position.Set(block.position);
        (<BlockEditor>blockInstance).mark = block.mark;
        (<BlockEditor>blockInstance).markOpen = block.markOpen;
      }

      graph.blocks.push(blockInstance);
    });

    //ports
    graphData.ports.forEach(port => {
      if(port.type == 'execute')
        graph.blocks[port.blockMap].addPort(portRegDatas[port.guidMap].regData, true);
      else {
        let paramPort : BlockPort = null;
        if(port.dyamicAdd)
          paramPort = graph.blocks[port.blockMap].addPort(portRegDatas[port.guidMap].regData, true, port.value);
        else {
          paramPort = graph.blocks[port.blockMap].getPort(portRegDatas[port.guidMap].guid.substr(37));
          if(paramPort != null)
            paramPort.paramUserSetValue = port.value;
        }
        if(paramPort != null) {
          paramPort.paramUserSetValue = port.value;
          paramPort.options = port.options;
        }
      }
    });

    //connectors
    graphData.connectors.forEach(connector => {
      let startPort = graph.blocks[connector.startBlock].getPortByGUID(connector.startPort);
      let endPort = graph.blocks[connector.endBlock].getPortByGUID(connector.endPort);
      
      if(startPort != null && endPort != null)
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
    doc.mainGraph.isMainGraph = true;
    
    return doc;
  }
}