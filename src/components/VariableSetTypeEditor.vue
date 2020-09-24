<template>
  <div class="position-relative display-inline-block">
    <div class="flow-float-set-typedot" title="更改集合类型" @click="show=!show" :style="{ color: color }">
      <i v-if="value=='variable'" class="iconfont icon-11"></i>
      <i v-if="value=='array'" class="iconfont icon-port-array-full"></i>
      <i v-if="value=='set'" class="iconfont icon-port-set"></i>
      <span v-if="value=='dictionary'" >
        <i class="iconfont icon-port-dictionary-left" :style="{ color: color2 }"></i>
        <i class="iconfont icon-port-dictionary-right" style="margin-left: -9px;"></i>
      </span>
    </div>
    <div v-show="show" class="flow-float-set-selector">
      <div class="iconfont icon-11" title="变量" @click="switchType('variable')"></div>
      <div class="iconfont icon-port-array-full" title="数组" @click="switchType('array')"></div>
      <div class="iconfont icon-port-set" title="集合" @click="switchType('set')"></div>
      <div class="iconfont icon-port-dictionary-full" title="映射" @click="switchType('dictionary')"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import ParamTypeServiceInstance from "../sevices/ParamTypeService";
import AllEditors from "../model/TypeEditors/AllEditors";
import { BlockParameterEditorRegData, BlockParameterEnumRegData, BlockParameterTypeRegData } from "../model/Define/BlockDef";
import { BlockParameterSetType, BlockParameterType } from "../model/Define/Port";
import { BlockGraphDocunment, BlockGraphVariable } from "../model/Define/BlockDocunment";

@Component
export default class VariableSetTypeEditor extends Vue {

  @Prop({ default: null }) value : BlockParameterSetType;
  @Prop({ default: null }) color : string;
  @Prop({ default: null }) color2 : string;

  private show = false;

  switchType(newType) {
    this.show = false;
    this.$emit('input', newType);
    this.$emit('change-set-type', newType);
  }

}

</script>

<style lang="scss">
.flow-float-set-typedot {
  display: inline-block;
  cursor: pointer;
  padding: 2px 5px;
}
.flow-float-set-selector {
  position: absolute;
  top: 20px;
  width: 22px;
  height: 82px;
  border: 1px solid #000;
  background: #fff;
  z-index: 200;

  > div {
    cursor: pointer;
    display: block;
    width: 20px;
    height: 20px;
    text-align: center;

    &:hover, &:active {
      background-color: #6b6b6b;
      color: #fff;
    }
  }
}
</style>