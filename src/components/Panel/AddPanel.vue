<template>
  <div ref="block-add-panel" class="editor-panel block-add-panel" 
    :style="{ left: (showPos != null ? showPos.x : 0) + 'px', top: (showPos != null ? showPos.y : 0) + 'px' }"
    @click="onClick($event)">
    <div class="text-center">添加<span v-html="filterText"></span></div>

    <div class="input">
      <input class="small-input" type="text" v-model="searchValue" placeholder="搜索单元..." />
      <a href="javascript:;" class="small-button" v-tooltip data-title="清空">
        <i class="iconfont icon-close-2"></i>
      </a>
    </div>

    <div v-for="(item, index) in allBlocksGrouped" :key="index" :name="index.toString()" v-show="item.show&&item.filterShow&&item.category!=''"
      class="collapse-item">
      <span class="collapse-title"  @click="item.open=!item.open;">
        <i :class="'collapse-arrow iconfont ' + (item.open ? 'icon-arrow-down-1' : 'icon-arrow-right-')"></i>
        {{ item.category }}
      </span>
      <BlockCategory v-show="item.open" :categoryData="item" :isAddDirectly="isAddDirectly"
        @on-block-item-click="onBlockItemClick">
      </BlockCategory>
    </div>

    <BlockCategory v-if="blocksGroupedMostOut" :categoryData="blocksGroupedMostOut" :isAddDirectly="isAddDirectly"
      @on-block-item-click="onBlockItemClick">
    </BlockCategory>

    <div v-if="currentShowCount==0 && searchValue != ''" class="text-center">暂无结果</div>

  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import BlockCategory from "../BlockEditor/BlockCategory.vue";
import { Vector2 } from "../../model/Vector2";
import { CategoryData } from "../../sevices/BlockService";
import { BlockPortDirection, BlockPort } from "../../model/Define/Port";
import { BlockRegData } from "../../model/Define/BlockDef";
import { BlockParameterSetType, BlockParameterType } from "../../model/Define/BlockParameterType";

@Component({
  components: {
    'BlockCategory': BlockCategory
  }
})
export default class AddPanel extends Vue {
  name = "AddPanel";

  private blocksGroupedMostOut : CategoryData = null;
  @Prop({ default: null }) allBlocksGrouped : Array<CategoryData>;
  @Prop({ default: null }) showPos : Vector2;
  @Prop({ default: false }) show : boolean;
  @Prop({ default: false }) isAddDirectly : boolean;

  filterText = '所有可用单元';

  @Prop({ default: null }) filterSrcPort : BlockPort;
  @Prop({ default: null }) filterByPortDirection : BlockPortDirection;
  @Prop({ default: null }) filterByPortType : BlockParameterType;
  @Prop({ default: null }) filterByPortKeyType : BlockParameterType;
  @Prop({ default: null }) filterByPortSetType : BlockParameterSetType;

  @Watch('allBlocksGrouped')
  onAllBlocksGroupedChanged(newV : any) {
    if(newV) { 
      for (let index = 0; index < newV.length; index++) {
        if(newV[index].category == '') {
          this.blocksGroupedMostOut = newV[index];
          break;
        }        
      }
    } 
  }
  @Watch('show')
  onShowChanged(newV : boolean) {
    if(newV) { setTimeout(() => {
      document.addEventListener('click', this.onDocClick);
    }, 100); } 
    else document.removeEventListener('click', this.onDocClick);
  }
  @Watch('searchValue')
  onSearch(newV : string) {
    if(newV == '') this.clearSearch();
    else this.doSearch();
  }

  searchValue = '';
  currentShowCount = 0;
  currentFilterCount = 0;

  focus() {
    setTimeout(() => {
      (<HTMLElement>this.$refs['block-add-panel']).focus();
    }, 50);
  }

  doFilterLoop(cn : (b : BlockRegData) => boolean) {
    this.currentFilterCount = 0;
    let loop = function(data : CategoryData) {
      let showChildCount = 0;
      data.blocks.forEach((b) => {
        b.show = cn(b);
        if(b.show) showChildCount++;
      });
      data.childCategories.forEach((d) => showChildCount += loop(d));
      data.show = showChildCount > 0;
      return showChildCount;
    };
    this.allBlocksGrouped.forEach((cd) => this.currentFilterCount += loop(cd));
  }
  doFilter() {
    if(this.filterByPortType != null) {
      this.doFilterLoop((b) => b.hasOnePortByDirectionAndType(this.filterByPortDirection,
        this.filterByPortType, this.filterByPortKeyType, this.filterByPortSetType, true));

      this.filterText = (this.filterByPortDirection == 'input' ? '获取 ' : '输出 ') + 
        this.filterSrcPort.getTypeFriendlyString() + ' 的单元';
    }
    else this.clearFilter();
  }
  clearFilter() {

    let loop = function(data : CategoryData) {
      data.show = true;
      data.blocks.forEach((b) => b.show = true);
      data.childCategories.forEach((d) => loop(d));
    };

    this.allBlocksGrouped.forEach((cd) => loop(cd));
    this.filterText = '所有可用单元';
  }
  doSearch() {
    this.currentShowCount = 0;
    let _this = this;
    let loop = function(data : CategoryData) {
      let showChildCount = 0;
      data.blocks.forEach((b) => {
        b.filterShow = b.baseInfo.name.contains(_this.searchValue) || b.baseInfo.description.contains(_this.searchValue);
        if(b.filterShow) showChildCount++;

        data.childCategories.forEach((d) => showChildCount += loop(d));
      });
      data.childCategories.forEach((d) => showChildCount += loop(d));
      data.filterShow = showChildCount > 0;
      data.open = true;
      return showChildCount;
    };
    this.allBlocksGrouped.forEach((cd) => this.currentShowCount += loop(cd));
  }
  clearSearch() {

    let loop = function(data : CategoryData) {
      data.filterShow = true;
      data.open = false;
      data.blocks.forEach((b) => b.filterShow = true);
      data.childCategories.forEach((d) => loop(d));
    };

    this.allBlocksGrouped.forEach((cd) => loop(cd));
  }

  onDocClick() {
    this.$emit('onClose');
    document.removeEventListener('click', this.onDocClick);
  }
  onClick(e : MouseEvent) {
    e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
  }
  onBlockItemClick(block : any) {
    this.$emit('onBlockItemClick', block)
  }


}
</script>