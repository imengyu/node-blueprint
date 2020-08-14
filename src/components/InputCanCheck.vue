<template>
  <div :class="'display-inline-block check-input'+(valueError!=null?' error':'')">
    <input :type="type" v-model="valueThis" :placeholder="placeholder" @blur="onBlur" />
    <div class="error-text">{{valueError}}</div>
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

  onBlur() {
    this.$emit('update', this.value, this.valueThis)
  }

  @Watch('valueThis')
  onValueInputChanged(newV : string) {
    this.checkInput();
  }

  checkInput() {
    let rs = this.checkCallback(this.value, this.valueThis)
    if(rs == true) {
      this.valueError = null;
      this.$emit('input', this.valueThis);
    }else {
      this.valueError = rs;
    }
  }

  mounted() {
    this.valueChangeLock = true;
    this.valueThis = this.value;
  }
}
</script>