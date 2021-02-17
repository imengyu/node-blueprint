import { BlockDocunment, BlockGraphDocunment, BlockGraphVariable } from "../Define/BlockDocunment";
import { BlockRegData } from "../Define/BlockDef";
import { BlockEditor } from "../Editor/BlockEditor";
import BlockServiceInstance from "../../sevices/BlockService";
import StringUtils from "../../utils/StringUtils";
import { BlockPort } from "../Define/Port";
import { ConnectorEditor } from "../Editor/ConnectorEditor";
import { Block } from "../Define/Block";
import { BlockPortEditor } from "../Editor/BlockPortEditor";
import { BlockParameterType, BlockParameterSetType } from "../Define/BlockParameterType";
import CommonUtils from "../../utils/CommonUtils";

/**
 * 流图保存加载解析器
 */
export class BlockFileParser {

  /**
   * 保存图表
   * @param graph 图表
   * @param docData 图表数据
   * @param saveToEditor 是否是编辑器保存版本
   */
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
      inputPorts: [],
      outputPorts: [],
      variables: [],
      
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

    //写入单元
    graph.blocks.forEach(block => {
      let mapIndex = findBlockGUIDMap(block.guid);
      if(mapIndex == -1)
        mapIndex = docData.blockMap.push(block.guid) - 1;

      //让单元保存自定义数据
      if(saveToEditor && typeof (<BlockEditor>block).onSave == 'function')
        (<BlockEditor>block).onSave(<BlockEditor>block);

      let blockData = {
        guidMap: mapIndex,
        uid: block.uid,
        mark: saveToEditor ? (<BlockEditor>block).mark : undefined,
        markOpen: saveToEditor ? (<BlockEditor>block).markOpen : undefined,
        breakpoint: saveToEditor ? block.breakpoint : undefined,
        options: block.options,
        position: saveToEditor ? (<BlockEditor>block).position : undefined,
        size: saveToEditor && block.userCanResize ? (<BlockEditor>block).size : undefined,
      };

      let blocksIndex = data.blocks.push(blockData) - 1;

      //写入入参数
      for(let i = 0, keys = Object.keys(block.inputPorts), c = keys.length; i < c; i++) {

        let port : BlockPort = block.inputPorts[keys[i]];
        let portData = findPortGUIDMap(block.guid + '-' + port.guid);
        if(portData[0] == -1)
          portData[0] = docData.portMap.push({
            guid: block.guid + '-' + port.guid,
            regData: port.regData,
          }) - 1;

        if(!port.paramType.isExecute() || port.isDyamicAdd)
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
      //写入出参数
      for(let i = 0, keys = Object.keys(block.outputPorts), c = keys.length; i < c; i++) {

        let port : BlockPort = block.outputPorts[keys[i]];
        let portData = findPortGUIDMap(block.guid + '-' + port.guid);
        if(portData[0] == -1)
          portData[0] = docData.portMap.push({
            guid: block.guid + '-' + port.guid,
            regData: port.regData,
          }) - 1;

        if(!port.paramType.isExecute() || port.isDyamicAdd)
          data.ports.push({
            blockMap: blocksIndex,            
            guidMap: portData[0],
            dyamicAdd: port.isDyamicAdd,
            direction: 'output',
            options: port.options,
            value: port.paramUserSetValue,
            type: port.paramType.getType(),
          })
      }
    });

    //写入链接
    graph.connectors.forEach(connector => {
      data.connectors.push({
        startBlock: findBlockIndex(connector.startPort.parent.uid),
        startPort: connector.startPort.guid,
        endBlock: findBlockIndex(connector.endPort.parent.uid),
        endPort: connector.endPort.guid,
        flexableCoonIndex: saveToEditor ? (<ConnectorEditor>connector).flexableCoonIndex : 0,
      });
    });

    //写入变量
    graph.variables.forEach(variable => {     
      data.variables.push({
        defaultValue: variable.defaultValue,
        value: variable.value,
        name: variable.name,
        type: variable.type.getType(),
        setType: variable.setType,
        dictionaryKeyType: variable.dictionaryKeyType,
      });
    }); 

    if(saveToEditor) {

    }

    //写入图表的输入输出接口
    graph.inputPorts.forEach((p) => {
      p.paramType = p.paramType.toString();
      if(CommonUtils.isDefinedAndNotNull(p.paramDictionaryKeyType))
        p.paramDictionaryKeyType = p.paramDictionaryKeyType.toString();
      else
        p.paramDictionaryKeyType = 'any';
      data.inputPorts.push(p);
    });
    graph.outputPorts.forEach((p) => {
      p.paramType = p.paramType.toString();
      if(CommonUtils.isDefinedAndNotNull(p.paramDictionaryKeyType))
        p.paramDictionaryKeyType = p.paramDictionaryKeyType.toString();
      else
        p.paramDictionaryKeyType = 'any';
      data.outputPorts.push(p);
    });

    //递归保存子图表
    graph.children.forEach((childGraph) =>
      data.childGraphs.push(this.saveGraph(childGraph, docData, saveToEditor))
    );

    return data;
  }
  /**
   * 加载图表
   * @param graphData 数据
   * @param parentGraph 父图表
   * @param blockRegDatas block GUID map
   * @param portRegDatas port GUID map
   * @param readToEditor 是否是读取至编辑器
   * @param doc 所属文档
   */
  private loadGraph(graphData, parentGraph : BlockGraphDocunment, blockRegDatas : Array<BlockRegData>, portRegDatas, readToEditor : boolean, doc : BlockDocunment) {

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
    graph.docunment = doc;

    //递归加载子图表
    graphData.childGraphs.forEach(childGraph => {
      graph.children.push(this.loadGraph(childGraph, graph, blockRegDatas, portRegDatas, readToEditor, doc));
    }); 
    
    //加载变量
    graphData.variables.forEach(variable => {
      let v = new BlockGraphVariable();
      v.defaultValue = variable.defaultValue;
      v.value = variable.value;
      v.name = variable.name;
      v.type = BlockParameterType.createTypeFromString(variable.type);
      v.setType = <BlockParameterSetType>variable.setType;
      v.dictionaryKeyType = variable.dictionaryKeyType;
      graph.variables.push(v);
    }); 
    
    //加载单元
    graphData.blocks.forEach(block => {
      let blockInstance = readToEditor ? new BlockEditor(blockRegDatas[block.guidMap]) : new Block(blockRegDatas[block.guidMap]);
      
      blockInstance.uid = block.uid;
      blockInstance.breakpoint = block.breakpoint;
      blockInstance.currentGraph = graph;
      blockInstance.options = block.options;
      blockInstance.createBase();

      if(readToEditor) {
        if(blockInstance.userCanResize)
          (<BlockEditor>blockInstance).size.Set(block.size);

        (<BlockEditor>blockInstance).position.Set(block.position);
        (<BlockEditor>blockInstance).mark = block.mark;
        (<BlockEditor>blockInstance).markOpen = block.markOpen;
      }

      graph.blocks.push(blockInstance);
    });

    //加载单元接口
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

    graph.inputPorts = [];
    graphData.inputPorts.forEach((p) => {
      p.paramType = new BlockParameterType(p.paramType);
      p.paramDictionaryKeyType = new BlockParameterType(p.paramDictionaryKeyType);
      graph.inputPorts.push(p);
    });
    graph.outputPorts = [];
    graphData.outputPorts.forEach((p) => {
      p.paramType = new BlockParameterType(p.paramType);
      p.paramDictionaryKeyType = new BlockParameterType(p.paramDictionaryKeyType);
      graph.outputPorts.push(p);
    });


    //加载单元链接
    graphData.connectors.forEach(connector => {
      let startPort = graph.blocks[connector.startBlock].getPortByGUID(connector.startPort);
      let endPort = graph.blocks[connector.endBlock].getPortByGUID(connector.endPort);
      let c = new ConnectorEditor();
      c.startPort = <BlockPortEditor>startPort;
      c.endPort = <BlockPortEditor>endPort;

      if(startPort != null && endPort != null){        
        if(readToEditor) {
          c.flexableCoonIndex = connector.flexableCoonIndex;
          graph.connectors.push(c);
        }else {
          graph.connectors.push(c);
        }
      }
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
      uid: doc.uid,
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
      return -1;
    }

    let blockRegDatas : Array<BlockRegData> = [];
    let portRegDatas = [];

    let data = null;

    try {
      data = JSON.parse(str);
    } catch(e) {
      console.log('[loadFromString] invalid file!');
      return -2;
    }

    doc.uid = data.uid;
    doc.libVersion = data.libVersion;
    doc.openEditorVersion = data.openEditorVersion;
    doc.name = data.name;
    doc.isEditor = readToEditor;
    //block GUID map
    data.blockMap.forEach(guid => blockRegDatas.push(BlockServiceInstance.getRegisteredBlock(guid)));
    //port GUID map
    data.portMap.forEach(port => portRegDatas.push(port));
    //load Graph
    doc.mainGraph = this.loadGraph(data.mainGraph, null, blockRegDatas, portRegDatas, readToEditor, doc);
    doc.mainGraph.isMainGraph = true;
    
    return doc;
  }
}