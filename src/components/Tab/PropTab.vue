<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { VNode } from "vue/types/umd";
import VNodeRenderer from '../VNodeRenderer.vue'

@Component({
  name: 'PropTab',
})
export default class PropTab extends Vue  {

  currentTab = 0;

  onTabItemMouseDown(e : MouseEvent, index : number) {
    this.$emit('on-tab-click', index);
    this.currentTab = index;
  }
  onTabItemMouseWhell(e : WheelEvent) {
    let el = <HTMLElement>e.target;
    if(el) {
      if(e.deltaY < 0) {
        if(el.scrollLeft > 0) el.scrollLeft -= 10;
        else el.scrollLeft = 0;
      } else if(e.deltaY > 0) {
        if(el.scrollLeft < el.scrollWidth) el.scrollLeft += 10;
        else el.scrollLeft = el.scrollWidth;
      }
    }
  }

  render() {

    let h = this.$createElement;
    let _this = this;

    let childrens = new Array<VNode>();
    let tabs = new Array<VNode>();

    let defSlot = _this.$slots['default'];
    if(defSlot && defSlot.length > 0) {

      for(let i = 0; i < defSlot.length; i++) {
        let v = defSlot[i];
        let propsDataData = v.componentOptions ? (<{[index:string]:any}>v.componentOptions.propsData) : null;
        if(!propsDataData) continue;

        tabs.push(h('div', {
          class: 'item '+(_this.currentTab === i ? 'active' : ''),
          key: i,  
          attrs: {
            title: propsDataData['title'],
          },
          on: {
            mousedown: function($event : MouseEvent) {
              _this.onTabItemMouseDown($event, i)
            },
            whell: function($event : WheelEvent) {
              _this.onTabItemMouseWhell($event)
            }
          }
        }, [
          h('i', { class:'icon ' + propsDataData['iconClass'] })
        ]));

        childrens.push(h(VNodeRenderer, {
          directives: [
            {
              name: "show",
              value: _this.currentTab === i,
              expression: "visible",
            }
          ],
          props: {
            vnode: v
          }
        }, []));
      }
    }

    return h('div', { class: 'horz-tab' }, [
      h('div', { class: 'tabs' }, tabs),
      h('div', { class: 'content' }, childrens),
    ]);
  }
}
</script>