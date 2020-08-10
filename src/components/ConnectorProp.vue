<template>
  <div>
    <div class="prop-header">链接属性</div>
    <div class="prop-item">
      <span>开始端口: </span>
      <div class="text-warp">
        {{ connector.startPort.name + '  GUID (' + 
        connector.startPort.parent.guid + '-' + connector.startPort.guid + ')' }}
      </div>
    </div>
    <div class="prop-item">
      <span>结束端口: </span>
      <div class="text-warp">
        {{ connector.endPort.name + '  GUID (' + 
          connector.endPort.parent.guid + '-' + connector.endPort.guid + ')' }}
      </div>
    </div>
    <div class="prop-item">
      <span>传递值: </span>
      <textarea v-model="connector.valText">
      </textarea>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { ConnectorEditor } from "../model/Editor/ConnectorEditor";

@Component
export default class ConnectorProp extends Vue {
  name = "ConnectorProp";

  @Prop({ default: null }) connector : ConnectorEditor;

  mounted() {
  }
}
</script>