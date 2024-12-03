import { onBeforeUnmount, onMounted } from "vue";
import type { NodeGraphEditorContext, NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import HtmlUtils from "@/node-blueprint/Base/Utils/HtmlUtils";

/**
 * 键盘控制器上下文函数
 */
export interface NodeEditorKeyBoardControllerContext {
  keyboardManager: {
    /**
     * Register a keyboard shortcut
     * @param callbackFn Exec callback
     * @returns Id for unregister
     */
    registerShortcut: (config: ShortcutConfig) => number;
    /**
     * Unregister a keyboard shortcut
     * @param id Id returns from `registerShortcut`
     * @returns 
     */
    unregisterShortcut: (id: number) => void;
    /**
     * Retrieve whether the user has pressed the Alt key in the editor
     * @returns 
     */
    isKeyAltDown: () => boolean;
    /**
     * Retrieve whether the user has pressed the Ctrl key in the editor
     * @returns 
     */
    isKeyControlDown: () => boolean;
  },
}

type ShortcutCallback = (context: NodeGraphEditorContext) => void;
export interface ShortcutConfig {
  id?: number;
  /**
   * Main Key
   */
  key: string;
  /**
   * Is trigger in keydown event, otherwise in keyup event.
   * @default false
   */
  keyDown?: boolean;
  /**
   * Need Ctrl key be pressed
   * @default false
   */
  keyControl?: boolean;
  /**
   * Need CAltrl key be pressed
   * @default false
   */
  keyAlt?: boolean;
  /**
   * Need Shift key be pressed
   * @default false
   */
  keyShift?: boolean;
  /**
   * Handler Callback
   */
  callback: ShortcutCallback;
}

/**
 * 编辑器的键盘控制器
 * @param options 
 * @returns 
 */
export function useEditorKeyBoardController(context: NodeGraphEditorInternalContext) {
  
  let keyControlDown = false;
  let keyShiftDown = false;
  let keyAltDown = false;

  let shortcutsLastId = 0;
  const shortcuts = new Map<string, ShortcutConfig>();

  function onKeyDown(e : KeyboardEvent) {
    if(HtmlUtils.isEventInControl(e))
      return;
    switch(e.code) {
      case 'ShiftRight':
      case 'ShiftLeft':
        keyShiftDown = true;
        break;
      case 'ControlRight':
      case 'ControlLeft':
        keyControlDown = true;
        break;
      case 'AltRight':
      case 'AltLeft':
        keyAltDown = true;
        break;
      default: {
        const shortcut = shortcuts.get(e.code);
        if (
          shortcut && !shortcut.keyDown
          && (
            (!shortcut.keyAlt || keyAltDown)
            || (!shortcut.keyShift || keyShiftDown)
            || (!shortcut.keyControl || keyControlDown)
          )
        )
          shortcut.callback(context);
        break;
      }
    }
  }
  function onKeyUp(e : KeyboardEvent) {
    if(HtmlUtils.isEventInControl(e))
      return;
    switch(e.code) {
      case 'ShiftRight':
      case 'ShiftLeft':
        keyShiftDown = false;
        break;
      case 'ControlRight':
      case 'ControlLeft':
        keyControlDown = false;
        break;
      case 'AltRight':
      case 'AltLeft':
        keyAltDown = false;
        break;
      default: {
        const shortcut = shortcuts.get(e.code);
        if (
          shortcut && shortcut.keyDown
          && (
            (!shortcut.keyAlt || keyAltDown)
            || (!shortcut.keyShift || keyShiftDown)
            || (!shortcut.keyControl || keyControlDown)
          )
        )
          shortcut.callback(context);
        break;
      }
    }

  }

  context.keyboardManager = {
    isKeyAltDown: () => keyAltDown,
    isKeyControlDown: () => keyControlDown,
    registerShortcut(config) {
      const id = ++ shortcutsLastId;
      config.id = id;
      shortcuts.set(config.key, config);
      return id;
    },
    unregisterShortcut(id) {
      for (const element of shortcuts) {
        if (element[1].id === id)  {
          shortcuts.delete(element[0]);
          break;
        }
      }
    },
  }

  onMounted(() => {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  });
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
  });

  return {
    onKeyDown,
    onKeyUp,
  }
}