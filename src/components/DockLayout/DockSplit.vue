<script lang="ts">
import HtmlUtils from "@/utils/HtmlUtils";
import { VNode } from "vue";
import { Component, Prop, Vue } from "vue-property-decorator";
import { DockData, DockHostData } from './DockData'

@Component
export default class DockSplit extends Vue {

  @Prop({default:'unknow'}) direction : 'vertical'|'horizontal'|'unknow';
  @Prop({default:null}) dockHost : DockHostData;

  render() {

    let h = this.$createElement;
    let _this = this;

    let childrens = new Array<VNode>();
    let defSlot = this.$slots['default'];
    if(defSlot && defSlot.length > 0) {

      //绘制出所有VNode
      let nowSize = 0, thisSize = 0, v : VNode = null;
      for(let i = 0; i < defSlot.length; i++) {
        v = defSlot[i];
        let dockData = v.componentOptions ? (<any>v.componentOptions.propsData)['dockData'] as DockData : null;
        if(dockData) {

          dockData.startSize = nowSize;
          thisSize = dockData.size;

          //绘制容器
          childrens.push(h('div', {
            class: 'dock-split-host',
            style: {
              width: this.direction === 'vertical' ? '100%' : thisSize + '%',
              height: this.direction === 'horizontal' ? '100%' : thisSize + '%',
              left: this.direction === 'horizontal' ? nowSize + '%' : 0,
              top: this.direction === 'vertical' ? nowSize + '%' : 0,
            }
          }, [
            v
          ]));

          nowSize += thisSize;

          //绘制分割线
          if(i < defSlot.length - 1) {
            childrens.push(h('div', { 
              class: 'dock-split-dragger ' + this.direction,
              style: {
                left: this.direction === 'vertical' ? undefined : nowSize + '%',
                top: this.direction === 'horizontal' ? undefined : nowSize + '%',
                draggable: 'false',
              },
              on: {
                //分割线拖动事件
                mousedown: function($event : MouseEvent) {
                  _this.onSplitDraggerMouseDown($event, i);
                }
              },
            }, []));
          }
        }
        
      };

    }

    return h('div', { 
      class: 'dock-split', 
      ref: 'host',
    }, childrens);
  }

  //拖动调整大小

  host : HTMLDivElement = null;
  currentSizeingPanelData : DockData = null;
  currentSizeingPanelDataNext : DockData = null;
  
  currentSizeingPanelDataStartSize = 0;
  currentSizeingPanelDataAndNextOldSize = 0;
  currentSizeingPanel = false;

  currentHostLeft = 0;
  currentHostTop = 0;

  onSplitDraggerMouseDown(e : MouseEvent, index : number) {
    if(e.button == 0) {         
      let defSlot = this.$slots['default'];
      if(defSlot && defSlot.length > 0) {
        //获取拖拽的目标插槽
        let v = defSlot[index];
        if(v.componentOptions) {
          this.currentSizeingPanelData = (<any>v.componentOptions.propsData)['dockData'] as DockData;
          if(this.currentSizeingPanelData)
            this.currentSizeingPanelDataAndNextOldSize = this.currentSizeingPanelData.size;
        }
        //获取紧挨着的下一个
        if(index < defSlot.length - 1) {
          v = defSlot[index + 1];
          if(v.componentOptions) {
            this.currentSizeingPanelDataNext = (<any>v.componentOptions.propsData)['dockData'] as DockData;
            this.currentSizeingPanelDataAndNextOldSize += this.currentSizeingPanelDataNext ? this.currentSizeingPanelDataNext.size : 0;
          }
        }
        //保存下当前容器绝对坐标，在移动事件中要用
        this.currentHostLeft = HtmlUtils.getLeft(this.host);
        this.currentHostTop = HtmlUtils.getTop(this.host);
      }

    }
    this.currentSizeingPanel = true;
    
    document.body.style.userSelect = 'none';
    document.addEventListener('mousemove', this.onSplitDraggerMouseMove);
    document.addEventListener('mouseup', this.onSplitDraggerMouseUp);
  }
  onSplitDraggerMouseMove(e : MouseEvent) {

    if(this.currentSizeingPanel && this.currentSizeingPanelData) {
      if(this.direction === 'vertical') {
        let h = this.host.offsetHeight, minh = 80 / h * 100;
        let nh = (e.clientY - this.currentHostTop - (this.currentSizeingPanelData.startSize / 100 * h)) / h * 100;
        if(this.currentSizeingPanelDataNext)
          nh = this.currentSizeingPanelDataAndNextOldSize - nh < minh ? this.currentSizeingPanelDataAndNextOldSize - minh : nh;
        else
          nh = 100 - nh < minh ? 100 - minh : nh;
        this.currentSizeingPanelData.size = nh < minh ? minh : nh; 
      } else if(this.direction === 'horizontal') {
        let w = this.host.offsetWidth, minw = 80 / w * 100;
        let nw = (e.clientX - this.currentHostLeft - (this.currentSizeingPanelData.startSize / 100 * w)) / w * 100;
        if(this.currentSizeingPanelDataNext)
          nw = this.currentSizeingPanelDataAndNextOldSize - nw < minw ? this.currentSizeingPanelDataAndNextOldSize - minw : nw;
        else
          nw = 100 - nw < minw ? 100 - minw : nw;
        this.currentSizeingPanelData.size = nw < minw ? minw : nw;
      }
      if(this.currentSizeingPanelDataNext)
        this.currentSizeingPanelDataNext.size = this.currentSizeingPanelDataAndNextOldSize - this.currentSizeingPanelData.size;
      this.onSplitChange(this.currentSizeingPanelData, this.currentSizeingPanelDataNext);
    }
  }  
  onSplitDraggerMouseUp(e : MouseEvent) {
    this.currentSizeingPanelData = null;
    this.currentSizeingPanelDataNext = null;
    this.currentSizeingPanel = false;
    document.body.style.userSelect = '';
    document.removeEventListener('mousemove', this.onSplitDraggerMouseMove);
    document.removeEventListener('mouseup', this.onSplitDraggerMouseUp);
  }

  onSplitChange(thisGrid : DockData, nextGrid : DockData) {
    this.dockHost.onGridDrag(thisGrid, nextGrid);
  }

  mounted() {
    this.onSplitDraggerMouseDown = this.onSplitDraggerMouseDown.bind(this);
    this.onSplitDraggerMouseMove = this.onSplitDraggerMouseMove.bind(this);
    this.onSplitDraggerMouseUp = this.onSplitDraggerMouseUp.bind(this);
    setTimeout(() => {
      this.host = this.$refs.host as HTMLDivElement;
    }, 300);
  }
}
</script>