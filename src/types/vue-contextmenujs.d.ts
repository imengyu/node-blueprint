import { MenuOptions } from "../model/Menu";

declare module 'vue/types/vue' {
  interface Vue {
    /**
     * vuecontextmenujs
     */
    $contextmenu: (options : MenuOptions) => void;
  }
}