<template>
  <div class="menu_bar">
    <div v-for="(menu,i) in menus" :class="menu.show ? 'menu open' : 'menu'" :key="i" 
      @click="onItemMouseClick(menu)" 
      @mouseenter="onItemMouseEnter(menu)" @mouseleave="onItemMouseLeave(menu)">
      <div class="menu_title">{{ menu.name }}</div>
      <div class="menu_list"> 
        <div v-for="(menuChild, i2) in menu.childs" :key="i2" @click="onMenuItemMouseLevel(menuChild, $event)"
          :class="menuChild.show ? (menuChild.separator?'separator':(menuChild.enable ?'menu_item':'menu_item disabled')) : 'display-none'">
            <i v-if="menuChild.checked" class="iconfont icon-check-"></i>
            {{menuChild.separator?'':menuChild.name}}
            <span v-if="menuChild.shortcut!=''" class="shortcut">{{menuChild.shortcut}}</span>
          </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

@Component
export default class MenuBar extends Vue {
  name = "MenuBar";

  @Prop({ default: null }) menus : Array<MenuData>;

  currentShowMenu : MenuData = null;

  @Watch('menus')
  onMenusChanged() {
    setTimeout(() =>  this.menus.forEach((m) => m.show = false), 200);
  }
  @Watch('currentShowMenu')
  onCurrentShowMenuChanged(newv : MenuData) {
    if(newv == null) document.removeEventListener('click', this.onDocClick);
    else setTimeout(() => document.addEventListener('click', this.onDocClick), 200); ;
  }
  onDocClick() {
    this.currentShowMenu = null;
  }

  onItemMouseClick(menu : MenuData) {
    menu.show = !menu.show;
    if(menu.show) this.currentShowMenu = menu;
    else if(this.currentShowMenu == menu) this.currentShowMenu = null;

  }
  onItemMouseEnter(menu : MenuData) {
    if(this.currentShowMenu != null)  {
      this.currentShowMenu.show = false;
      this.currentShowMenu = menu;
      this.currentShowMenu.show = true;
    }
  }
  onItemMouseLeave(menu : MenuData) {
    setTimeout(() => {
      if(this.currentShowMenu == menu)  {
        this.currentShowMenu.show = false;
        this.currentShowMenu = null;
      }
    }, 200)
  }
  onMenuItemMouseLevel(menu : MenuData, e : MouseEvent) {
    if(!menu.separator) {
      if(typeof menu.callback == 'function')
        menu.callback(menu);
      this.currentShowMenu.show = false;
      this.currentShowMenu = null;
    }

    e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
  }

  mounted() {
    this.onMenusChanged();
  }
}

export class MenuData {
  public name = '';
  public enable = true;
  public checked = false;
  public show = true;
  public shortcut = '';
  public separator = false;
  public callback : MenuCallback = null;
  public childs : Array<MenuData> = null;

  public constructor(name : string, callbackOrChild : MenuCallback | Array<MenuData> , shortcut = '', checked = false, enabled = true) {
    this.name = name;
    if(typeof callbackOrChild == 'function')
      this.callback = callbackOrChild;
    else 
      this.childs = callbackOrChild;
    this.shortcut = shortcut;
    this.checked = checked;
    this.enable = enabled;
  }
}
export type MenuCallback = (menu : MenuData) => void;
export class MenuSeparator extends MenuData {
  public constructor() {
    super('Separator', null);
    this.separator = true;
  }
}

</script>