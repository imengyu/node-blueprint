<template>
  <div ref="host">
    <span v-if="variableType=='any'"><i>(null)</i></span>
    <span v-else-if="currentEditor==null">(无法使用编辑器设置该变量初始值)</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import ParamTypeServiceInstance from "../../sevices/ParamTypeService";
import AllEditors from "../../model/TypeEditors/AllEditors";
import { BlockParameterEditorRegData, BlockParameterEnumRegData, BlockParameterTypeRegData } from "../../model/Define/BlockDef";
import { BlockParameterBaseType, BlockParameterSetType, BlockParameterType } from "../../model/Define/BlockParameterType";

@Component
export default class VariableTypeEditor extends Vue {

  @Prop({ default: null }) variableType : BlockParameterType;
  @Prop({ default: null }) variableSetType : BlockParameterSetType;
  @Prop({ default: null }) value : any;

  private hostEl : HTMLElement = null;
  private currentEditorEl : HTMLElement = null;
  private currentEditor : BlockParameterEditorRegData = null;

  @Watch('variableSetType')
  onSetTypeChanged() {
    this.createEditor();
  }
  @Watch('variableType')
  onTypeChanged() {
    this.createEditor();
  }
  @Watch('value')
  onValChanged() {
    if(this.currentEditor != null && this.currentEditorEl != null)
      this.currentEditor.forceUpdateValue(this.value, this.currentEditorEl);
  }

  createEditor() {
    if(this.currentEditorEl != null) {
      this.hostEl.removeChild(this.currentEditorEl);
      this.currentEditorEl = null;
    }

    if(this.variableSetType === 'variable') {
      let customType : BlockParameterTypeRegData = null;
      if(!this.variableType.isAny()) {
        this.currentEditor = AllEditors.getBaseEditors(<BlockParameterBaseType>this.variableType.getType());
        if(this.currentEditor == null) {
          customType = ParamTypeServiceInstance.getCustomType(this.variableType.getType());
          if(customType != null) this.currentEditor = customType.editor;
          if(this.currentEditor == null && (customType && customType.prototypeName == 'enum'))
            this.currentEditor = AllEditors.getDefaultEnumEditor(<BlockParameterEnumRegData>customType);
        }
        //创建
        if(this.currentEditor != null) {
          this.currentEditorEl = this.currentEditor.editorCreate(null, null, this.hostEl, (newV) => {
            this.$emit('input', newV)
          }, this.value, null, customType);
          this.hostEl.appendChild(this.currentEditorEl);
        }
      }
    }
  }

  mounted() {
    setTimeout(() => {
      this.hostEl = <HTMLElement>this.$refs.host;
      this.createEditor();
    }, 300);
  }
}

</script>