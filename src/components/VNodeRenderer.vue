<script lang="ts">
import { VNode } from "vue";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

@Component({
  name: 'VNodeRenderer',
})
export default class VNodeRenderer extends Vue {

  @Prop({default:null}) vnode: VNode;
  @Prop({default:true}) renderChild: boolean;
  @Prop({default:null}) data: {[index:string]:any};

  render() {
    if(this.vnode) {
      for(let key in this.data)
        (this.vnode.componentOptions.propsData as {[index:string]:any})[key] = this.data[key];
      return this.renderChild ? this.$createElement('div', { style: { height: '100%'} }, [
        this.vnode
      ]) : this.vnode;
    }
    return this.$createElement('div', []);
  }
}

</script>