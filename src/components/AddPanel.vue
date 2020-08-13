<template>
  <div ref="block-add-panel" class="block-add-panel" 
    :style="{ left: (showPos != null ? showPos.x : 0) + 'px', top: (showPos != null ? showPos.y : 0) + 'px' }"
    @click="onClick($event)">
    <div class="text-center">添加{{ filterText }}</div>

    <Input v-model="searchValue" placeholder="搜索单元..." clearable size="small" suffix="ios-search" :style="{margin:'5px 0'}" />

    <div v-for="(item, index) in allBlocksGrouped" :key="index" :name="index.toString()" v-show="item.show&&item.filterShow"
      class="collapse-item">
      <span class="collapse-title"  @click="item.open=!item.open;">
        <i :class="'collapse-arrow iconfont ' + (item.open ? 'icon-arrow-down-1' : 'icon-arrow-right-')"></i>
        {{ item.category }}
      </span>
      <BlockCategory v-show="item.open" :categoryData="item" 
        @on-block-item-click="onBlockItemClick">
      </BlockCategory>
    </div>

    <div v-if="currentShowCount==0 && searchValue != ''" class="text-center">暂无结果</div>

  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import BlockCategory from "./BlockCategory.vue";
import { Vector2 } from "../model/Vector2";
import { CategoryData } from "../sevices/BlockService";
import { BlockPortDirection, BlockParameterType } from "../model/Define/Port";
import { BlockRegData } from "../model/Define/BlockDef";

@Component({
  components: {
    'BlockCategory': BlockCategory
  }
})
export default class AddPanel extends Vue {
  name = "AddPanel";

  @Prop({ default: null }) allBlocksGrouped : Array<CategoryData>;
  @Prop({ default: null }) showPos : Vector2;
  @Prop({ default: false }) show : boolean;

  filterText = '所有可用单元';

  @Prop({ default: null }) filterByPortDirection : BlockPortDirection;
  @Prop({ default: null }) filterByPortType : BlockParameterType;
  @Prop({ default: null }) filterByPortCustomType : string;

  @Watch('show')
  onShowChanged(newV) {
    if(newV) { setTimeout(() => {
      document.addEventListener('click', this.onDocClick);
    }, 100); } 
    else document.removeEventListener('click', this.onDocClick);
  }
  @Watch('searchValue')
  onSearch(newV) {
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
        this.filterByPortType, this.filterByPortCustomType, true));

      this.filterText = (this.filterByPortDirection == 'input' ? '获取 ' : '输出 ') + 
        ((this.filterByPortType == 'custom' || this.filterByPortType == 'enum') ?
          this.filterByPortCustomType : this.filterByPortType) + ' 的单元';
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
  onBlockItemClick(block) {
    this.$emit('onBlockItemClick', block)
  }


}
</script>