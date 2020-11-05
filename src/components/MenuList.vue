<template>
  <div v-if="menu" class="menu-list"> 
    <div v-for="(menuChild, i2) in menu.childs" :key="i2"
      :class="menuChild.show ? (menuChild.separator?'separator':(menuChild.enable ?'menu-item':'menu-item disabled')) : 'display-none'"
      @click="$emit('on-item-click', menuChild, $event)"
      @mouseenter="onMouseEnter(menuChild, $event)"
      @mouseleave="onMouseLeave(menuChild, $event)"
      >
        <i v-if="menuChild.checked" class="iconfont icon-check-"></i>
        {{menuChild.separator?'':menuChild.name}}
        <span v-if="menuChild.shortcut!=''" class="shortcut">{{menuChild.shortcut}}</span>
        <span v-if="menuChild.childs && menuChild.childs.length > 0" class="menu-arrow iconfont icon-arrow-right-">
        </span>
        <MenuBar v-if="menuChild.childs && menuChild.childs.length > 0" 
          :menu="menuChild"
          :class="menuChild.enter ? ' show':' hide'"
          @on-item-click="(c, e) => $emit('on-item-click', c, e)"
          ></MenuBar>
    </div>
  </div>

</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { MenuData } from "../model/Menu";

@Component({
  name: 'MenuBar'
})
export default class MenuList extends Vue {
  @Prop({ default: null }) menu : MenuData;

  onMouseEnter(menuChild : MenuData, e : MouseEvent) {
    menuChild.enter = true;
  }
  onMouseLeave(menuChild : MenuData, e : MouseEvent) {
    setTimeout(() => {
      if(menuChild.enter)
        menuChild.enter = false;
    }, 300);
  }
}

</script>