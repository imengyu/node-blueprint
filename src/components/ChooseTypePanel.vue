<template>
  <div v-show="show" ref="choose-type-panel" class="block-add-panel" 
    :style="{ left: (showPos != null ? showPos.x : 0) + 'px', top: (showPos != null ? showPos.y : 0) + 'px' }"
    @click="onClick($event)">
    <div class="text-center">选择类型</div>

    <Input v-model="searchValue" placeholder="搜索类型..." clearable size="small" suffix="ios-search" :style="{margin:'5px 0'}" />

    <div class="block-list">
      <div class="block-item" v-for="(item, index) in allBaseTypes" :key="'D'+index" @click="onItemClick(item)" v-show="searchValue==''||item.name.contains(searchValue)">
        <i class="iconfont icon-yuan1" :style="{ marginRight: '5px', color: item.color }"></i>
        {{ item.name }}
      </div>
      <div class="block-item" v-for="(item, index) in allCustomTypes" :key="'C'+index" @click="onItemClick(item)" :title="item.name+'('+item.prototypeName+')'" v-show="searchValue==''||item.name.contains(searchValue)">
        <i :class="'iconfont ' + (item.prototypeName == 'enum' ? 'icon-tx-fill-babianxing' : 'icon-search2')" :style="{ marginRight: '5px', color: item.color }"></i>
        {{ item.name }}
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Vector2 } from "../model/Vector2";
import { BlockParameterTypeRegData } from "../model/Define/BlockDef";
import ParamTypeServiceInstance from "../sevices/ParamTypeService";

@Component({
  name: 'ChooseTypePanel'
})
export default class ChooseTypePanel extends Vue {

  focus() {
    setTimeout(() => {
      (<HTMLElement>this.$refs['choose-type-panel']).focus();
    }, 50);
  }

  searchValue = '';

  onDocClick() {
    this.$emit('onClose');
    document.removeEventListener('click', this.onDocClick);
  }
  onClick(e : MouseEvent) {
    e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
  }
  onItemClick(item) {
    this.$emit('onItemClick', item)
  }

  @Prop({ default: null }) showPos : Vector2;
  @Prop({ default: false }) show : boolean;
  
  allCustomTypes : BlockParameterTypeRegData[] = [];
  allBaseTypes = [];

  mounted() {
    this.allCustomTypes = ParamTypeServiceInstance.getAllCustomTypes();
    ParamTypeServiceInstance.getAllBaseTypes().forEach(type => {
      this.allBaseTypes.push({
        name: type,
        color: ParamTypeServiceInstance.getTypeColor(type)
      })
    });
  }


  @Watch('show')
  onShowChanged(newV) {
    if(newV) { setTimeout(() => {
      document.addEventListener('click', this.onDocClick);
    }, 100); } 
    else document.removeEventListener('click', this.onDocClick);
  }

}
</script>