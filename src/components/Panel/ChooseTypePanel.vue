<template>
  <div v-show="show" ref="choose-type-panel" class="editor-panel block-add-panel" 
    :style="{ left: (showPos != null ? showPos.x : 0) + 'px', top: (showPos != null ? showPos.y : 0) + 'px' }"
    @click="onClick($event)">
    <div class="text-center">选择类型</div>

    <div class="input">
      <input class="small-input" type="text" v-model="searchValue" placeholder="搜索类型..." />
      <a href="javascript:;" class="small-button" v-tooltip data-title="清空">
        <i class="iconfont icon-close-2"></i>
      </a>
    </div>

    <div v-if="allBaseTypes" class="block-list">
      <div class="block-item" v-for="(item, index) in allBaseTypes" :key="'D'+index" @click="onItemClick(item)" v-show="searchValue==''||item.name.contains(searchValue)">
        <i class="iconfont icon-yuan1" :style="{ marginRight: '5px', color: item.color }"></i>
        {{ item.nameForUser }}
      </div>
      <div class="block-item" v-for="(item, index) in allCustomTypes" :key="'C'+index" @click="onItemClick(item)" v-show="searchValue==''||item.name.contains(searchValue)">
        <i :class="'iconfont ' + (item.prototypeName == 'enum' ? 'icon-tx-fill-babianxing' : 'icon-search2')" :style="{ marginRight: '5px', color: item.color }"></i>
        {{ item.nameForUser }}
      </div>
    </div>

  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { Vector2 } from "../../model/Vector2";
import { BlockParameterTypeRegData } from "../../model/Define/BlockDef";
import ParamTypeServiceInstance from "../../sevices/ParamTypeService";
import CommonUtils from "../../utils/CommonUtils";

interface CustomTypeData {
  nameForUser: string,
  name: string,
  prototypeName?: string,
  color: string,
  isBaseType: boolean,
}

export type ChooseTypePanelCallback = (type: BlockParameterTypeRegData, isBaseType : boolean) => void;

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
  onItemClick(item : CustomTypeData) {
    this.$emit('onItemClick', item, item.isBaseType == true)
  }

  @Prop({ default: null }) showPos : Vector2;
  @Prop({ default: false }) show : boolean;
  @Prop({ default: true }) canbeExecute : boolean;

  allCustomTypes = new Array<CustomTypeData>();
  allBaseTypes = new Array<CustomTypeData>();

  loadCustomTypes(act : 'full'|'add'|'remove', typeName ?: string, reg ?: BlockParameterTypeRegData) {
    let map = ParamTypeServiceInstance.getAllCustomTypes();
    if(act == 'full') {
      this.allCustomTypes.empty();
      map.forEach((value) => {
      this.allCustomTypes.push({
        nameForUser: CommonUtils.isNullOrEmpty(value.nameForUser) ? value.name : value.nameForUser,
        name: value.name,
        prototypeName: value.prototypeName,
        color: ParamTypeServiceInstance.getTypeColor(value.name),
        isBaseType: false,
      })
    });
    }
    else if(act == 'remove') {
      for(let i = this.allCustomTypes.length - 1; i >= 0; i--) {
        if(this.allCustomTypes[i].name == typeName) {
          this.allCustomTypes.remove(i);
          break;
        }
      }
    }
    else if(act == 'add') {
      this.allCustomTypes.push({
        nameForUser: CommonUtils.isNullOrEmpty(reg.nameForUser) ? reg.name : reg.nameForUser,
        name: reg.name,
        prototypeName: reg.prototypeName,
        color: ParamTypeServiceInstance.getTypeColor(reg.name),
        isBaseType: false,
      })
    }
  }

  mounted() {
    setTimeout(() => this.loadCustomTypes('full'), 2000);

    ParamTypeServiceInstance.onTypeChanged.addListener(this, (act, name, reg) => this.loadCustomTypes(act, name, reg));
    ParamTypeServiceInstance.getAllBaseTypes().forEach(type => {
      if(type == 'execute' && !this.canbeExecute) 
        return;
      
      this.allBaseTypes.push({
        nameForUser: ParamTypeServiceInstance.getTypeNameForUserMapping(type),
        name: type,
        color: ParamTypeServiceInstance.getTypeColor(type),
        isBaseType: true,
      })
    });
  }


  @Watch('show')
  onShowChanged(newV : boolean) {
    if(newV) { setTimeout(() => {
      document.addEventListener('click', this.onDocClick);
    }, 100); } 
    else document.removeEventListener('click', this.onDocClick);
  }

}
</script>