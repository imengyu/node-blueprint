import { BlockRegData } from "../model/BlockDef";

export class BlockService {
  public allBlocks = {};
  public allBlocksGrouped : Array<CategoryData> = [];

  public isEditorMode = false;

  public init() {
    
  }

  /**
   * 注册单元
   * @param BlockDef 单元信息
   * @param updateList 是否刷新列表
   */
  public registerBlock(BlockDef : BlockRegData, updateList = true) {
    let oldBlock = this.getRegisteredBlock(BlockDef.guid);
    if(oldBlock != null && oldBlock != undefined) {
      console.warn("[registerBlock] Block guid " + BlockDef.guid + " alreday registered !");
      return;
    }
    this.allBlocks[BlockDef.guid] = BlockDef;

    if(this.isEditorMode && updateList) this.updateBlocksList();
  }
  public getRegisteredBlock(guid : string) {
    return this.allBlocks[guid];
  }
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

  private findOrCrateBlocksListCategoryAtCategory(path : string, parent : Array<CategoryData>) : CategoryData {
    let spIndex = path.indexOf('/');
    let categoryName = path;
    if(spIndex > 0) 
      categoryName = path.substring(0, spIndex);

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
        blocks: []
      };
      parent.push(category);
    }

    //如果还有下一级，则递归查找
    if(spIndex > 0 && spIndex < path.length) 
      return this.findOrCrateBlocksListCategoryAtCategory(path.substring(spIndex + 1), category.childCategories);
    else 
      return category;
  }

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

export type CategoryData = {
  category: string,
  childCategories: Array<CategoryData>,
  blocks: Array<BlockRegData>
};