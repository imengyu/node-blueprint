<script lang="ts">
import HtmlUtils from '../Common/Utils/HtmlUtils';
import { defineComponent, h, inject, PropType, VNode } from 'vue'
import { DockData, getTargetGridSize } from './DockLayoutData'
import { DockHostData } from './DockHostData'
import DockPanelHost from './DockPanelHost.vue';

/**
 * 可拖拽面板的核心组件，分隔面板，可以有多个子面板，每个面板都可以调整大小
 */
const DockSplit = defineComponent({
  name: 'DockSplit',
  props: {
    //当前分隔的子面板
    dockDatas: {
      type: Object as PropType<DockData[]>,
      default: null
    },
    //当前容器方向
    direction: {
      type: String as PropType<'vertical'|'horizontal'|'unknow'>,
      default: 'unknow'
    },
  },
  components: {
    'DockPanelHost': DockPanelHost,
  },
  data() {
    return {
      host: null as HTMLDivElement|null,
      currentSizeingPanelData: null as DockData|null,
      currentSizeingPanelDataNext: null as DockData|null,
      currentSizeingPanelDataStartSize: 0,
      currentSizeingPanelDataAndNextOldSize: 0,
      currentSizeingPanel: false,
      currentHostLeft: 0,
      currentHostTop: 0,
    }
  },
  setup() {
    const dockHost = inject<DockHostData>('dockHost'); //顶级DockHostData
    return {
      dockHost
    };
  },
  render() {
    const childrens = new Array<VNode>();

    //循环渲染出每个对象的分隔栏
    let nowSize = 0, thisSize = 0;
    for(let i = 0; i < this.dockDatas.length; i++) { 
      let dockData = this.dockDatas[i];

      dockData.startSize = nowSize;
      thisSize = dockData.size === 0 ? getTargetGridSize(this.dockDatas.length) : dockData.size;

      const childVnode = new Array<VNode>();

      //递归循环子级
      if (dockData.grids.length > 0) {
        //有子分隔板，所以递归渲染下一级
        childVnode.push(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          h(DockSplit as any, {
            dockDatas: dockData.grids,
            direction: this.direction === 'horizontal' ? 'vertical' : 'horizontal',
          })
        );
      } else if (dockData.panels.length > 0) {
        //有子面板，所以渲染面板Tab
        childVnode.push(
          h(DockPanelHost, {
            dockData: dockData,
          })
        );
      } else {
        //否则渲染空内容
        const k = this.dockHost?.renderSlot('emptyPanel', {
          name: dockData.name,
          dockData,
        });
        if (k && k instanceof Array)
          childVnode.push(...k);
        else if (k)
          childVnode.push(k);
      }

      //绘制容器
      childrens.push(h('div', {
        class: 'dock-split-host',
        style: {
          width: this.direction === 'vertical' ? '100%' : thisSize + '%',
          height: this.direction === 'horizontal' ? '100%' : thisSize + '%',
          left: this.direction === 'horizontal' ? nowSize + '%' : 0,
          top: this.direction === 'vertical' ? nowSize + '%' : 0,
        }
      }, childVnode));

      nowSize += thisSize;

      //绘制分割线
      if(i < this.dockDatas.length - 1) {
        childrens.push(h('div', { 
          class: 'dock-split-dragger ' + this.direction,
          style: {
            left: this.direction === 'vertical' ? undefined : nowSize + '%',
            top: this.direction === 'horizontal' ? undefined : nowSize + '%',
            draggable: 'false',
          },
          //分割线拖动事件
          onMousedown: ($event : MouseEvent) => {
            this.onSplitDraggerMouseDown($event, i);
          }
        }, []));
      }
    }

    return h('div', { 
      class: 'dock-split', 
      ref: 'host',
    }, childrens);
  },
  methods: {
    onSplitDraggerMouseDown(e : MouseEvent, index : number) {
      if(e.button == 0) {         
        if(this.dockDatas && this.dockDatas.length > 0) {
          //获取拖拽的目标
          let v = this.dockDatas[index];
          if(v) {
            this.currentSizeingPanelData = v;
            if(this.currentSizeingPanelData)
              this.currentSizeingPanelDataAndNextOldSize = this.currentSizeingPanelData.size;
          }
          //获取紧挨着的下一个
          if(index < this.dockDatas.length - 1) {
            v = this.dockDatas[index + 1];
            if(v) {
              this.currentSizeingPanelDataNext = v;
              this.currentSizeingPanelDataAndNextOldSize += this.currentSizeingPanelDataNext ? this.currentSizeingPanelDataNext.size : 0;
            }
          }
          //保存下当前容器绝对坐标，在移动事件中要用
          this.currentHostLeft = HtmlUtils.getLeft(this.host as HTMLElement);
          this.currentHostTop = HtmlUtils.getTop(this.host as HTMLElement);
        }

      }
      this.currentSizeingPanel = true;
      
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', this.onSplitDraggerMouseMove);
      document.addEventListener('mouseup', this.onSplitDraggerMouseUp);
    },
    onSplitDraggerMouseMove(e : MouseEvent) {
      //拖拽重新调整大小
      if(this.currentSizeingPanel && this.currentSizeingPanelData &&  this.host && this.currentSizeingPanelDataNext) {
        if(this.direction === 'vertical') {
          //垂直
          let h = this.host.offsetHeight, minh = 80 / h * 100;
          let nh = (e.clientY - this.currentHostTop - (this.currentSizeingPanelData.startSize / 100 * h)) / h * 100;
          if(this.currentSizeingPanelDataNext)
            nh = this.currentSizeingPanelDataAndNextOldSize - nh < minh ? this.currentSizeingPanelDataAndNextOldSize - minh : nh;
          else
            nh = 100 - nh < minh ? 100 - minh : nh;
          this.currentSizeingPanelData.size = nh < minh ? minh : nh; 
        } else if(this.direction === 'horizontal') {
          //水平
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
        this.onSplitChange(this.currentSizeingPanelData as DockData, this.currentSizeingPanelDataNext as DockData);
      }
    },
    onSplitDraggerMouseUp() {
      this.currentSizeingPanelData = null;
      this.currentSizeingPanelDataNext = null;
      this.currentSizeingPanel = false;
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', this.onSplitDraggerMouseMove);
      document.removeEventListener('mouseup', this.onSplitDraggerMouseUp);
    },
    onSplitChange(thisGrid : DockData, nextGrid : DockData) {
      this.dockHost?.onGridDrag(thisGrid, nextGrid);
    },
  },  
  mounted() {
    this.onSplitDraggerMouseDown = this.onSplitDraggerMouseDown.bind(this);
    this.onSplitDraggerMouseMove = this.onSplitDraggerMouseMove.bind(this);
    this.onSplitDraggerMouseUp = this.onSplitDraggerMouseUp.bind(this);
    setTimeout(() => {
      this.host = this.$refs.host as HTMLDivElement;
    }, 300);
  }
});

export default DockSplit;
</script>

<style lang="scss">
@import "./DockCommonStyles.scss";

//dock 拖拽区域
.dock-split {
  position: relative;
  width: 100%;
  height: 100%;

  > .dock-grid {
    position: absolute;
  }
}
.dock-split-host {
  position: absolute;
}
.dock-split-dragger {
  position: absolute;
  background: $tab-mormal-color;
  z-index: 10;

  &.vertical {
    left: 0;
    right: 0;
    height: 6px;
    margin-top: -3px;
    cursor: row-resize;
    
    border-top: 1px solid $tab-border-color;
    border-bottom: 1px solid $tab-border-color;

    div {
      width: 30px;
      height: 100;
      left: 50%;
      margin-left: -15px;
    }
  }
  &.horizontal {
    top: 0;
    bottom: 0;
    width: 6px;
    margin-left: -3px;

    cursor: col-resize;
    border-left: 1px solid $tab-border-color;
    border-right: 1px solid $tab-border-color;

    div {
      width: 100%;
      height: 30px;
      top: 50%;
      margin-top: -15px;
    }
  }

  div {
    position: absolute;
    background: rgba($primary-color-dark, 0.1);
    border-radius: 2px;
  }
}

//light theme
.dock-host.light {
  .dock-split-dragger {
    background: $light-theme-tab-mormal-color;

    &.vertical {
      border-top: 1px solid $light-theme-tab-border-color;
      border-bottom: 1px solid $light-theme-tab-border-color;
    }
    &.horizontal {
      border-left: 1px solid $light-theme-tab-border-color;
      border-right: 1px solid $light-theme-tab-border-color;
    }
  }
}
</style>
