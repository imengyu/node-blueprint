<template>
  <div class="dock-panel">
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { DockHostData, DockPanelData } from "./DockData";

@Component
export default class DockPanel extends Vue {

  @Prop({default:false}) closeUnSave : boolean;
  @Prop({default:null}) title : string;
  @Prop({default:null}) iconClass : string;
  @Prop({default:true}) visible : boolean;
  @Prop({default:false}) closeable : boolean;
  @Prop({default:''}) insertTo : string;
  @Prop({default:0}) tabLeftOffset : number;

  //#region 数据更新

  @Prop({ default: null }) dockPanelData : DockPanelData;
  @Prop({ default: null }) dockHost : DockHostData;

  @Watch('title') onUpdateTitle() { if(this.dockPanelData && this.title) this.dockPanelData.title = this.title; }
  @Watch('iconClass') onUpdateIconClass() { if(this.dockPanelData && this.iconClass) this.dockPanelData.iconClass = this.iconClass; }
  @Watch('closeable') onUpdateCloseable() { if(this.dockPanelData && typeof this.closeable === 'boolean') this.dockPanelData.closeable = this.closeable; }
  @Watch('insertTo') onUpdateInsertTo() { if(this.dockPanelData && this.insertTo) this.dockPanelData.insertTo = this.insertTo; }
  @Watch('visible') onUpdateVisible() { if(this.dockPanelData && typeof this.visible === 'boolean') this.dockPanelData.visible = this.visible; }
  @Watch('tabLeftOffset') onUpdateTabLeftOffset() { if(this.dockPanelData && this.tabLeftOffset) this.dockPanelData.tabLeftOffset = this.tabLeftOffset; }
  @Watch('dockPanelData') onUpdateDockPanelData() {
    if(this.dockPanelData) {
      this.dockPanelData.onClose = this.onClose;
      this.dockPanelData.onTabRightClick = this.onTabRightClick;
    }
  }


  //#endregion

  onClose() {
    this.$emit('on-close', this.dockPanelData);
  }
  onTabRightClick() {
    this.$emit('on-tab-right-click', this.dockPanelData);
  }

  mounted() {
    this.onClose = this.onClose.bind(this);
    this.onTabRightClick = this.onTabRightClick.bind(this);
    setTimeout(() => {
      this.onUpdateDockPanelData();
    }, 400)
  }
}
</script>