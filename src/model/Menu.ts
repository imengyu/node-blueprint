
export class MenuData {
  public name = '';
  public enable = true;
  public checked = false;
  public show = true;
  public shortcut = '';
  public separator = false;
  public callback : MenuCallback = null;
  public childs : Array<MenuData> = null;
  public enter = true;

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

//Vue contextmenu js
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
