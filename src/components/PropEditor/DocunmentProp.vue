<template>
  <div>
    <CollapsePropHeader title="文档属性">
      <div class="prop-item">
        <span>文档名称: </span>
        <input class="prop-item-editor" type="text" v-model="doc.name" placeholder="文档的名称" @blur="$emit('update-doc-title', doc.name)" />
      </div>
      <div class="prop-item">
        <span>文档注释: </span>
        <textarea class="prop-item-editor"  v-model="doc.mainGraph.comment" placeholder="文档的注释...">
        </textarea>
      </div>
    </CollapsePropHeader>   
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { BlockDocunment } from "../../model/Define/BlockDocunment";
import GraphProp from "./GraphProp.vue";
import CollapsePropHeader from "../EditorComponents/CollapsePropHeader.vue";
import { BlockEditorOwner } from "../../model/Editor/BlockEditorOwner";

@Component({
  components: {
    'GraphProp': GraphProp,
    'CollapsePropHeader': CollapsePropHeader
  }
})
export default class DocunmentProp extends Vue {

  @Prop({ default: null }) doc : BlockDocunment;
  @Prop({ default: false }) blockOwnerData : BlockEditorOwner;


}
</script>