<template>
  <div class="menu-bar">
    <div class="titlebar-drag-region"></div>
    <slot name="icon"></slot>
    <div v-show="loadShow" v-for="(menu,i) in menus" :class="menu.show ? 'menu-bar-item open' : 'menu-bar-item'" :key="i" 
      @click="onItemMouseClick(menu)" 
      @mouseenter="onItemMouseEnter(menu)" @mouseleave="onItemMouseLeave(menu)">
      <div class="menu-title">{{ menu.name }}</div>
      <MenuList :menu="menu"
        @on-item-click="(c, e) => onMenuItemMouseClick(c, e)">
      </MenuList>
    </div>
    <slot />
    <slot name="end"></slot>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { MenuData } from "../model/Menu";
import MenuList from "./MenuList.vue";

@Component({
  components: {
    MenuList
  }
})
export default class MenuBar extends Vue {
  name = "MenuBar";

  @Prop({ default: null }) menus : Array<MenuData>;

  currentShowMenu : MenuData = null;
  loadShow = false;

  @Watch('menus')
  onMenusChanged() {
    this.loadShow = false;
    setTimeout(() => this.menus.forEach((m) => {
      m.show = false;
      this.loadShow = true;
    }), 100);
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
    menu.enter = menu.show;
    if(menu.show) this.currentShowMenu = menu;
    else if(this.currentShowMenu == menu) this.currentShowMenu = null;
  }
  onItemMouseEnter(menu : MenuData) {
    menu.enter = true;
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
      menu.enter = false;
    }, 200)
  }
  onMenuItemMouseClick(menu : MenuData, e : MouseEvent) {
    if(!menu.separator) {
      if(typeof menu.callback == 'function')
        menu.callback(menu);
      if(this.currentShowMenu) {
        this.currentShowMenu.show = false;
        this.currentShowMenu = null;
      }
    }

    e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
  }

  mounted() {
    this.onMenusChanged();
  }
}

</script>