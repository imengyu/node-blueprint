<template>
  <div class="tab-panel">
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component({
  name: 'PropTabPanel'
})
export default class PropTabPanel extends Vue  {

  @Prop({default:''}) iconClass : string;
  @Prop({default:''}) title : string;
}
</script>