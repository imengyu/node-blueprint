<script lang="ts">
import { defineComponent, h, VNode } from 'vue'

export default defineComponent({
  name: 'ConsoleRefShower',
  props: [ 'value', 'isTop' ],
  render() {
    const value = this.$props.value;
    const isTop = this.$props.isTop as boolean;

    if(typeof value === 'undefined') 
      return h('span', { class: 'speical' }, 'undefined')
    else if(value === null) 
      return h('span', { class: 'speical' }, 'null')
    else if(typeof value === 'number') 
      return h('span', { class: 'number' }, '' + value)
    else if(typeof value === 'boolean') 
      return h('span', { class: 'keyword' }, value ? 'true' : 'false')
    else if(typeof value === 'symbol') 
      return h('span', { class: 'string' }, String(value))
    else if(typeof value === 'bigint') 
      return h('span', { class: 'bigint' }, '' + value + 'n')
    else if(typeof value === 'function') 
      return h('span', { class: 'function' }, 'f ' + value.toString())
    else if(typeof value === 'string') {
      if(!isTop)
        return h('span', { class: 'string' }, '"' + value + '"' )
      else {
        let str = this.$props.value as string;
        let texts = new Array<{
          text?: string,
          ref?: ConsoleLogRefItem
        }>();
        let qurStart = 0;
        let curQurLevel = 0;
        for(let i = 0, c = str.length; i < c; i++) {
          if(str.charAt(i) === '{') {
            if(curQurLevel === 0) {
              if(i - qurStart > 0) texts.push({
                text: str.substring(qurStart, i)
              });
              qurStart = i;
            }
            curQurLevel++;
          }
          else if(str.charAt(i) === '}') {
            curQurLevel--;
            if(curQurLevel === 0) {
              texts.push({
                ref: JSON.parse(str.substring(qurStart, i + 1))
              });
              qurStart = i + 1; 
            }
          }
          else if(i === c - 1) {
            if(i - qurStart > 0) texts.push({
              text: str.substring(qurStart, i + 1)
            });
            qurStart = i;
          }
        }

        let vnodes = new Array<VNode>();
        texts.forEach((item) => {
          if(item.ref) {
            vnodes.push(h('a', { 
              on: { 
                click: () => {
                  if(item.ref)
                    this.$emit('on-go-ref', item.ref.refDoc, item.ref.refBlock, item.ref.refPort) 
                }
              } 
            }, item.ref.ref))
          } else if(item.text) {
            vnodes.push(h('span', { innerHTML: item.text }))
          } 
        });
        
        return h('span', vnodes);
      }
    }
    else 
      return h('span');
  },
})


export interface ConsoleLogRefItem {
  /**
   * 文字
   */
  ref: string,
  /**
   * 来源 单元UID
   */
  refBlock: string,
  /**
   * 来源 端口 GUID
   */
  refPort: string,
  /**
   * 来源 文档UID:图表UID
   */
  refDoc: string,
}

</script>

