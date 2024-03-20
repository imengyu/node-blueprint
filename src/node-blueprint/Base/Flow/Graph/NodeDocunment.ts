import RandomUtils from "../../Utils/RandomUtils";
import { SerializableObject } from "../../Serializable/SerializableObject";
import { NodeGraph, type INodeGraphDefine } from "./NodeGraph";
import type { NodeDocunmentEditorContext } from "@/node-blueprint/Editor/Docunment/NodeDocunmentEditor";
import { NodeParamTypeRegistry } from "../Type/NodeParamTypeRegistry";

/**
 * 蓝图文档定义
 */
export class NodeDocunment extends SerializableObject<INodeDocunmentDefine> {
  constructor(define?: INodeDocunmentDefine, isEditor?: boolean) {
    super('NodeDocunment', define, {
      serializeSchemes: {
        default: {
          serializableProperties: [
            'uid',
            'name',
            'comment',
            'version',
            'description',
            'author',
            'mainGraph',
            'customData',
            'customTypes',
          ],
          serializePropertyOrder: {
            'customTypes': 1,
            'mainGraph': 2,
          },
          forceSerializableClassProperties: {
            mainGraph: isEditor ? 'NodeGraphEditor' : 'NodeGraph',
          },
          afterPropertyLoad: (key) => {
            if (key === 'customTypes') {
              //加载自定义组合类型数据
              const typeRegistry = NodeParamTypeRegistry.getInstance();
              for (const type of this.customTypes) {
                if (!typeRegistry.isTypeRegistered(type.name))
                  typeRegistry.registerType(type.name, type.define);
              }
            }
          },
          beforeSave: () => {
            //保存其他数据
            //保存自定义组合类型
            const typeRegistry = NodeParamTypeRegistry.getInstance();
            this.customTypes = [];
            for (const [,type] of typeRegistry.getAllTypes()) {
              if (type.isCustomType)
                this.customTypes.push({ name: type.toString(), define: type.define });
            }
          },
        },
      }
    });
    this.isEditor = isEditor === true;
  }

  /**
   * 名称
   */
  uid =  RandomUtils.genNonDuplicateIDHEX(16);
  /**
   * 名称
   */
  name = '';
  /**
   * 版本
   */
  version = '1.0';
  /**
   * 说明
   */
  description = '';
  /**
   * 作者
   */
  author = '';
  /**
   * 注释
   */
  comment = '';
  /**
   * 主图表
   */
  mainGraph : NodeGraph|null = null;
  /**
   * 自定义保存数据
   */
  customData = {};
  /**
   * 自定义组合类型数据
   */
  customTypes : { name: string, define: any }[] = [];

  //下方属性不序列化

  /**
   * 是否是编辑器模式
   */
  isEditor = false;
  /**
   * 文件所在位置
   */
  path = '';
  /**
   * 提示文件是否在编辑器更改过但没有保存
   */
  fileChanged = false;
  /**
   * 当前激活的编辑器实例
   */
  activeEditor: NodeDocunmentEditorContext | null = null;

  /**
   * 新建文档初始化
   */
  public initNew() {
    this.mainGraph = new NodeGraph({
      type : 'main',
      name : '主图表',
      version : '1.0',
      description : '主图表是整个程序的入口',
      author : this.author,
    }, this, this.isEditor);
    this.mainGraph.load();
    this.mainGraph.initNew();
  }
  /**
   * 通过UID查找子图表
   * @param uid 子图表UID
   * @returns 
   */
  public findChildGraph(uid : string) {
    if(!this.mainGraph)
      return null;
    const loopChild = function(graph : NodeGraph) : NodeGraph|null {
      const children = graph.children;
      for (let index = 0, c = children.length; index < c; index++) {
        const item = graph.children[index];
        if(item.uid === uid)
          return item;
        else if(item.children.length > 0)
          return loopChild(item);
      }
      return null;
    }
    if(this.mainGraph.uid === uid)
      return this.mainGraph;
    return loopChild(this.mainGraph);
  }
}

export interface INodeDocunmentDefine {
  uid ?: string,
  /**
   * 名称
   */
  name ?: string,
  /**
   * 版本
   */
  version ?: string,
  /**
   * 说明
   */
  description ?: string,
  /**
   * 作者
   */
  author ?: string,
  /**
   * 注释
   */
  comment ?: string,
  /**
   * 主图表
   */
  mainGraph ?: INodeGraphDefine|null,
}