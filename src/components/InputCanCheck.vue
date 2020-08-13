<template>
  <div :class="'display-inline-block check-input'+(valueError!=null?' error':'')">
    <input :type="type" v-model="valueThis" :placeholder="placeholder" @blur="$emit('blur')" />
    <span class="error-text">{{valueError}}</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import Editor from "./Editor.vue";

@Component
export default class InputCanCheck extends Vue {

  @Prop({default:''}) value : string;
  @Prop({default:null}) checkCallback : Function;
  @Prop({default:''}) placeholder : string;
  @Prop({default:'text'}) type : string;

  valueThis = '';
  valueChangeLock = false;
  valueError = null;

  @Watch('value')
  onValueChanged(newV : string) {
    this.valueChangeLock = true;
    this.valueThis = newV;
  }

  @Watch('valueThis')
  onValueInputChanged(newV : string) {
    if(!this.valueChangeLock) {
      let rs = this.checkCallback(newV)
      if(rs == true) {
        this.valueError = null;
        this.$emit('input', newV);
      }else {
        this.valueError = rs;
      }
    }
    this.valueChangeLock = false;
  }

  mounted() {
    this.valueChangeLock = true;
    this.valueThis = this.value;
  }
}
</script>