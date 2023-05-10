import BaseNodes from "@/node-blueprint/Nodes/Lib/BaseNodes";
import ArrayUtils from "../../Utils/ArrayUtils";
import { printInfo, printWarning } from "../../Utils/Logger/DevLog";
import { Singleton } from "../../Utils/Singleton/Singleton";
import type { INodeDefine } from "../Node/Node";
import type { CategoryData, CategoryDataItem } from "./NodeCategory";
import type { NodePackage } from "./NodePackage";

const TAG = 'NodeRegistry';

/**
 * 节点注册中心
 */
export class NodeRegistry extends Singleton {
  
  constructor() {
    super(TAG);
  }
  static getInstance() {
    return Singleton.getSingletonInstance(TAG) as NodeRegistry;
  }

  //所有单元
  private allNodes = new Map<string, CategoryDataItem>();
  //所有单元（已分类）
  private allNodesGrouped: Array<CategoryData> = [
    {
      category: "",
      childCategories: [],
      nodes: [],
      open: true,
      show: true,
      filterShow: true,
    },
  ];
  //所有包
  private allPacks = new Map<string, {
    allDefineGUids: Array<string>,
    pack: NodePackage
  }>()

  /**
   * 获取所有单元（已分类）列表
   */
  public getAllNodesGrouped() :Array<CategoryData>  {
    return this.allNodesGrouped;
  }
  /**
   * 设置所有单元（已分类）列表
   */
  public setAllNodesGrouped(v: Array<CategoryData>) : void {
    this.allNodesGrouped = v;
  }
  /**
   * 注册单元
   * @param nodeDef 单元信息
   * @param updateList 是否刷新列表
   */
  public registerNode(nodeDef: INodeDefine, updateList = true) : void {
    const oldNode = this.getRegisteredNode(nodeDef.guid);
    if (oldNode != null && oldNode != undefined) {
      printWarning(
        TAG,
        "Node guid " + nodeDef.guid + " alreday registered !"
      );
      return;
    }

    this.allNodes.set(nodeDef.guid, {
      define: nodeDef,
      show: true,
      filterShow: true,
      grouped: false,
      hideInAddPanel: nodeDef.hideInAddPanel ?? false,
      categoryObject: null,
    });
    if (updateList) this.updateNodesList();
  }
  /**
   * 注册单元
   * @param nodeDefs 单元信息
   * @param updateList 是否刷新列表
   */
  public registerNodes(nodeDefs: INodeDefine[], updateList = true) : void {
    nodeDefs.forEach(n => this.registerNode(n), false);
    if (updateList) this.updateNodesList();
  }
  /**
   * 获取已经注册的单元
   * @param guid 单元GUID
   */
  public getRegisteredNode(guid: string) : INodeDefine|null {
    const v = this.allNodes.get(guid);
    return v ? v.define : null;
  }
  /**
   * 取消注册单个单元
   * @param guid 单元GUID
   * @param updateList 是否刷新列表
   */
  public unregisterNode(guid: string, updateList = true) : void {
    const regData = this.allNodes.get(guid);
    if (regData) {
      if (regData.categoryObject) {
        ArrayUtils.remove(regData.categoryObject.nodes, regData);
      }
    }
    this.allNodes.delete(guid);
    if (updateList) this.updateNodesList();
  }

  /**
   * 注册单元包
   * @param pack 单元包
   */
  public registerNodePack(pack : NodePackage, updateList = true) : void {

    const guids = new Array<string>();
    const defines = pack.register();
    defines.forEach((nodeDefine) => {
      this.registerNode(nodeDefine, false);
      ArrayUtils.addOnce(guids, nodeDefine.guid);
    });

    this.allPacks.set(pack.packageName, {
      pack,
      allDefineGUids: guids
    });
    printInfo(TAG, `Register NodePack : ${pack.packageName}`);

    if(updateList)
      this.updateNodesList();
  }
  /**
   * 取消注册单元包
   * @param pack 单元包
   */
  public unregisterNodePack(pack : NodePackage) : void {

    const packData = this.allPacks.get(pack.packageName);
    if(!packData) {
      printWarning(TAG, `Unregister NodePack : ${pack.packageName} failed: ${pack.packageName} not registered.`);
      return;
    }

    this.allPacks.delete(pack.packageName);
    printInfo(TAG, `Unregister NodePack : ${pack.packageName}`);

    packData.allDefineGUids.forEach((guid) => {
      this.unregisterNode(guid, false);
    })

    this.updateNodesList();
  }
  /**
   * 获取包是否注册
   * @param name 包名
   */
  public getNodePackRegistered(name : string) : NodePackage|null {
    const packData = this.allPacks.get(name);
    if(packData)
      return packData.pack
    return null
  }

  //单元列表
  //======================

  /**
   * 查找或生成单元分类菜单
   * @param path 路径
   * @param parent 父级
   */
  private findOrCrateNodesListCategoryAtCategory(
    path: string,
    parent: Array<CategoryData>
  ): CategoryData {
    const spIndex = path.indexOf("/");
    let categoryName = "";

    if (spIndex > 0) categoryName = path.substring(0, spIndex);
    else categoryName = path;

    let category: CategoryData|null = null;
    for (let i = 0, c = parent.length; i < c; i++) {
      if (parent[i].category == categoryName) {
        category = parent[i];
        break;
      }
    }

    //没有则创建
    if (category == null) {
      category = {
        category: categoryName,
        childCategories: [],
        nodes: [],
        open: false,
        show: true,
        filterShow: true,
      };
      parent.push(category);
    }

    //如果还有下一级，则递归查找
    if (spIndex > 0 && spIndex < path.length)
      return this.findOrCrateNodesListCategoryAtCategory(
        path.substring(spIndex + 1),
        category.childCategories
      );
    else return category;
  }

  /**
   * 查找或生成单元分类菜单
   * @param path 路径
   */
  public findNodesListCategory(path: string): CategoryData {
    return this.findOrCrateNodesListCategoryAtCategory(
      path,
      this.allNodesGrouped
    );
  }
  /**
   * 刷新单元列表
   */
  public updateNodesList() : void {
    this.allNodes.forEach((regData) => {
      if (!regData.grouped) {
        const category = this.findNodesListCategory(regData.define.category ?? '');

        regData.categoryObject = category;

        if (!category.nodes.includes(regData)) 
          category.nodes.push(regData);

        regData.grouped = true;
      }
    });
  }
  /**
   * 通过注册时的GUID获取单元定义
   * @param name 
   */
  public getNodeByGUID(guid : string) : INodeDefine|null {
    return this.allNodes.get(guid)?.define || null;
  }
  /**
   * 获取基础单元定义
   * @param name 
   */
  public getBaseNode(name : string) : INodeDefine|null {
    switch(name) {
      case 'BaseIn': return BaseNodes.getScriptBaseNodeIn();
      case 'BaseOut': return BaseNodes.getScriptBaseNodeOut();
      case 'Comment': return BaseNodes.getScriptBaseCommentNode();
      case 'Convert': return BaseNodes.getScriptBaseConvertNode();
      case 'VariableGet': return BaseNodes.getScriptBaseVariableGet();
      case 'VariableSet': return BaseNodes.getScriptBaseVariableSet();
    }
    return null;
  }
}