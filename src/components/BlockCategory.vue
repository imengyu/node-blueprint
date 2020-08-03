<template>
  <div>

    <Collapse simple>
      <Panel v-for="(item, index) in categoryData.childCategories" :key="index" :name="index.toString()">
        {{ item.category }}
        <div slot="content">
          <BlockCategory :categoryData="item" @onBlockItemClick="(block) => $emit('onBlockItemClick', block)">
          </BlockCategory>
        </div>
      </Panel>
    </Collapse>

    <div class="block-list">
      <div class="block-item" v-for="(item, index) in categoryData.blocks" :key="index" @click="$emit('onBlockItemClick', item)">
        <img :src="item.baseInfo.logo" />
        <h5>{{item.baseInfo.name}}</h5>
        <span>{{item.baseInfo.description}}</span>
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