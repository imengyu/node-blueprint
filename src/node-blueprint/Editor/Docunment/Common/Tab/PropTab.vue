<script lang="ts">
import { defineComponent, h, type VNode } from "vue";
import Icon from '../../../Nana/Icon.vue';
import VNodeRenderer from '../VNodeRenderer.vue'

export default defineComponent({
  data() {
    return {
      currentTab: 0,
    };
  },
  render() {
    const childrens = new Array<VNode>();
      const tabs = new Array<VNode>();

    const defSlot = this.$slots.default?.() || [];
    for(let i = 0; i < defSlot.length; i++) {
      const v = defSlot[i];
      const propsDataData = v.props || {};
      if(!propsDataData) continue;

      tabs.push(h('div', {
        class: 'item '+(this.currentTab === i ? 'active' : ''),
        key: i,  
        attrs: {
          title: propsDataData['title'],
        },
        on: {
          mousedown: function($event : MouseEvent) {
            this.onTabItemMouseDown($event, i)
          },
          whell: function($event : WheelEvent) {
            this.onTabItemMouseWhell($event)
          }
        }
      }, [
        h(Icon, { icon: propsDataData['icon'] })
      ]));

      childrens.push(h(VNodeRenderer, {
        directives: [
          {
            name: "show",
            value: this.currentTab === i,
            expression: "visible",
          }
        ],
        props: {
          vnode: v
        }
      }, []));
    }
    return h('div', { class: 'horz-tab' }, [
      h('div', { class: 'tabs' }, tabs),
      h('div', { class: 'content' }, childrens),
    ]);
  },
  emits: [ 'on-tab-click' ],
  name: 'PropTab',
  methods: {
    onTabItemMouseDown(e : MouseEvent, index : number) {
      this.$emit('on-tab-click', index);
      this.currentTab = index;
    },
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
    },
  },

});
</script>