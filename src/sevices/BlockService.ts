import { BlockRegData } from "../model/Define/BlockDef";
import { PackageDef } from "../model/Define/PackageDef";
import logger from "../utils/Logger";

/**
 * 单元服务
 */
export class BlockService {

  //所有单元
  private allBlocks = {};
  //所有单元（已分类）
  private allBlocksGrouped : Array<CategoryData> = [
    {
      category: '',
      childCategories: [],
      blocks: [],
      open: true,
      show: true,
      filterShow: true,
    }
  ];
  //所有包
  private allPacks = [];
  private isEditorMode = false;

  /**
   * 获取所有单元（已分类）列表
   */
  public getAllBlocksGrouped() { return this.allBlocksGrouped; }
  /**
   * 设置所有单元（已分类）列表
   */
  public setAllBlocksGrouped(v : Array<CategoryData>) { return this.allBlocksGrouped = v; }
  /**
   * 设置是否在编辑器模式
   * @param e 是否在编辑器模式
   */
  public setIsEditorMode(e : boolean) { this.isEditorMode = e; }

  /**
   * 初始化
   */
  public init() {
    
  }
  /**
   * 注册单元
   * @param BlockDef 单元信息
   * @param pack 单元包
   * @param updateList 是否刷新列表
   */
  public registerBlock(BlockDef : BlockRegData, pack : PackageDef, updateList = true) {
    if(pack != null) {
      if(!this.allPacks.contains(pack))
        this.allPacks.push(pack);
    }
    let oldBlock = this.getRegisteredBlock(BlockDef.guid);
    if(oldBlock != null && oldBlock != undefined) {
      logger.warning("[registerBlock] Block guid " + BlockDef.guid + " alreday registered !");
      return;
    }
    BlockDef.pack = pack;
    this.allBlocks[BlockDef.guid] = BlockDef;

    if(this.isEditorMode && updateList) this.updateBlocksList();
  }
  /**
   * 获取已经注册的单元
   * @param guid 单元GUID
   */
  public getRegisteredBlock(guid : string) {
    return this.allBlocks[guid];
  }
  /**
   * 取消注册单元包
   * @param pack 单元包
   */
  public unregisterBlockPack(pack : PackageDef) {
    this.allPacks.remove(pack);
    logger.log(`unregisterBlockPack : ${pack.packageName}`);
  }
  /**
   * 取消注册单个单元
   * @param guid 单元GUID
   * @param updateList 是否刷新列表
   */
  public unregisterBlock(guid : string, updateList = true) {
    let regData : BlockRegData = this.allBlocks[guid]
    if(this.isEditorMode && regData) {
      if((<any>regData).categoryObject) {
        (<CategoryData>(<any>regData).categoryObject).blocks.remove(regData);
      }
    }
    delete(this.allBlocks[guid]);
    if(this.isEditorMode && updateList) this.updateBlocksList();
  }

  //单元列表
  //======================


  /**
   * 查找或生成单元分类菜单
   * @param path 路径
   * @param parent 父级
   */
  private findOrCrateBlocksListCategoryAtCategory(path : string, parent : Array<CategoryData>) : CategoryData {
    let spIndex = path.indexOf('/');
    let categoryName = '';

    if(spIndex > 0) categoryName = path.substring(0, spIndex);
    else categoryName = path;

    let category : CategoryData = null;
    for(let i = 0, c = parent.length; i < c; i++) {
      if(parent[i].category == categoryName){
        category = parent[i];
        break;
      }
    }

    //没有则创建
    if(category == null) {
      category = {
        category: categoryName,
        childCategories: [],
        blocks: [],
        open: false,
        show: true,
        filterShow: true,
      };
      parent.push(category);
    }

    //如果还有下一级，则递归查找
    if(spIndex > 0 && spIndex < path.length) 
      return this.findOrCrateBlocksListCategoryAtCategory(path.substring(spIndex + 1), category.childCategories);
    else 
      return category;
  }

  /**
   * 查找或生成单元分类菜单
   * @param path 路径
   */
  public findBlocksListCategory(path : string) : CategoryData {
    return this.findOrCrateBlocksListCategoryAtCategory(path, this.allBlocksGrouped);
  }
  /**
   * 刷新单元列表
   */
  public updateBlocksList() {
    if(this.isEditorMode) {
      Object.keys(this.allBlocks).forEach(key => {
        let regData : BlockRegData = this.allBlocks[key];
        let category = this.findBlocksListCategory(regData.baseInfo.category);

        (<any>regData).categoryObject = category;

        if(!category.blocks.contains(regData)) 
          category.blocks.push(regData);
      });
    }
  }
}

let BlockServiceInstance = new BlockService();

export default BlockServiceInstance;

/**
 * 单元分类的结构
 */
export type CategoryData = {
  category: string,
  childCategories: Array<CategoryData>,
  blocks: Array<BlockRegData>,
  open: boolean,
  show: boolean,
  filterShow: boolean,
};