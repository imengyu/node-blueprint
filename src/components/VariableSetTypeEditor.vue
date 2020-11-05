<template>
  <div class="position-relative display-inline-block">
    <div class="flow-float-set-typedot" title="更改集合类型" @click="switchShow" :style="{ color: color }">
      <i v-if="!canChoodeType || value=='variable'" class="iconfont icon-11"></i>
      <i v-else-if="value=='array'" class="iconfont icon-port-array-full"></i>
      <i v-else-if="value=='set'" class="iconfont icon-port-set"></i>
      <span v-else-if="value=='dictionary'" >
        <i class="iconfont icon-port-dictionary-left" :style="{ color: color2 }"></i>
        <i class="iconfont icon-port-dictionary-right" style="margin-left: -9px;"></i>
      </span>
      <i v-else class="iconfont icon-yuan"></i>
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
import { BlockGraphDocunment, BlockGraphVariable } from "../model/Define/BlockDocunment";
import { BlockParameterSetType, BlockParameterType } from "../model/Define/BlockParameterType";

@Component
export default class VariableSetTypeEditor extends Vue {

  @Prop({ default: null }) type : BlockParameterType;
  @Prop({ default: null }) value : BlockParameterSetType;
  @Prop({ default: null }) color : string;
  @Prop({ default: null }) color2 : string;

  private show = false;
  private canChoodeType = false;

  @Watch('type') 
  onTypeChange() {
    this.canChoodeType = !this.type.isExecute();
  }

  switchType(newType) {
    this.show = false;
    this.$emit('input', newType);
    this.$emit('change-set-type', newType);
  }

  switchShow() {
    if(this.canChoodeType)
      this.show = !this.show;
  }


  mounted() {
    this.onTypeChange();
  }
}

</script>

<style lang="scss">
.flow-float-set-typedot {
  display: inline-block;
  cursor: pointer;
  padding: 2px 5px;
  text-shadow: 0px 0px 3px rgb(0, 0, 0);
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