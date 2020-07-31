<template>
  <div class="block-add-panel" :style="{ left: (showPos != null ? showPos.x : 0) + 'px', top: (showPos != null ? showPos.y : 0) + 'px' }">
    <Collapse simple>
      <Panel v-for="(item, index) in allBlocksGrouped" :key="index" :name="index.toString()">
        {{ item.category }}
        <div slot="content">
          <BlockCategory :categoryData="item" @onBlockItemClick="onBlockItemClick">
          </BlockCategory>
        </div>
      </Panel>
    </Collapse>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { CategoryData } from "../views/Editor.vue";
import BlockCategory from "./BlockCategory.vue";
import { Vector2 } from "../model/vector2";

@Component({
  components: {
    'BlockCategory': BlockCategory
  }
})
export default class AddPanel extends Vue {
  name = "AddPanel";

  @Prop({ default: null }) allBlocksGrouped : Array<CategoryData>;
  @Prop({ default: null }) showPos : Vector2;

  onBlockItemClick(block) {
    this.$emit('onBlockItemClick', block)
  }
}
</script>