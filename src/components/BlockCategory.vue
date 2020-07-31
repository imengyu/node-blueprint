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
        <img :src="item.logo" />
        <h5>{{item.name}}</h5>
        <span>{{item.description}}</span>
      </div>
    </div>


  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { CategoryData } from "../views/Editor.vue";

@Component
export default class BlockCategory extends Vue {
  name = "BlockCategory";

  @Prop({ default: null }) categoryData : CategoryData;

}
</script>