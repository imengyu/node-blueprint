<template>
  <div>

    <div v-for="(item, index) in categoryData.childCategories" :key="index" :name="index.toString()"
      v-show="item.show&&item.filterShow"
      class="collapse-item">
      <span class="collapse-title" @click="item.open=!item.open;">
        <i :class="'collapse-arrow iconfont ' + (item.open ? 'icon-arrow-down-1' : 'icon-arrow-right-')"></i>
        {{ item.category }}
      </span>
      <BlockCategory v-show="item.open" :categoryData="item" @on-block-item-click="(block) => $emit('on-block-item-click', block)">
      </BlockCategory>
    </div>

    <div class="block-list">
      <div class="block-item" v-for="(item, index) in categoryData.blocks" :key="index" @click="$emit('on-block-item-click', item)"
        :title="item.baseInfo.description"
        v-show="item.show && item.filterShow">
        <div class="logo" v-if="item.baseInfo.logo!=''&&item.baseInfo.logo.indexOf('<')==0" v-html="item.baseInfo.logo"></div>
        <img v-else-if="item.baseInfo.logo!=''" :src="item.baseInfo.logo" />
        {{ item.baseInfo.name }}
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { CategoryData } from "../sevices/BlockService";

@Component
export default class BlockCategory extends Vue {
  name = "BlockCategory";

  @Prop({ default: null }) categoryData : CategoryData;

}
</script>