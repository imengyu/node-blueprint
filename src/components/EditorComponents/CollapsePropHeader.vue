<template>
  <div>
    <div class="prop-header">
      <a href="javascript:;" title="下移" @click="show=!show" class="mr-2">
        <i :class="'iconfont ' + (show?'icon-arrow-down-1':'icon-arrow-right-')"></i>
      </a>
      {{title}}
    </div>
    <div v-show="show">
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from "vue-property-decorator";

@Component
export default class CollapsePropHeader extends Vue {
  show = true;
  @Prop({default:null}) title:string;
}
</script>