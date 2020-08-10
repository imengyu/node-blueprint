export declare interface MenuOptions {
  /**
   * 菜单结构信息
   */
  items	:	MenuItem[],
  /**
   * 鼠标事件信息
   */
  event ?: Event,
  /**
   * 菜单显示X坐标, 存在event则失效
   */
  x	?: number,
  /**
   * 菜单显示Y坐标, 存在event则失效
   */
  y ?: number,
  /**
   * 菜单样式z-index
   */
  zIndex ?: number,
  /**
   * 自定义菜单class
   */
  customClass	?:	string,
  /**
   * 主菜单最小宽度
   */
  minWidth ?: number,
}

export declare interface MenuItem {
  /**
   * 菜单项名称
   */
  label ?: string,
  /**
   * 菜单项图标, 生成<i></i>元素
   */
  icon ?: string,
  /**
   * 是否禁用菜单项
   */
  disabled ?: boolean,
  /**
   * 是否显示分割线
   */
  divided ?: boolean,
  /**
   * 自定义子菜单class
   */
  customClass ?: string,
  /**
   * 子菜单最小宽度
   */
  minWidth ?: number,
  /**
   * 菜单项点击事件
   */
  onClick ?: Function,
  /**
   * 子菜单结构信息
   */
  children ?: MenuItem[],
}

declare module 'vue/types/vue' {
  interface Vue {
    /**
     * vuecontextmenujs
     */
    $contextmenu: (options : MenuOptions) => void;
  }
}