import { h, render, type VNode } from "vue";
import AlertInner from "./AlertInner.vue";
import AlertLoading from "./AlertLoading.vue";
import Modal from "./Modal.vue";

export interface AlertProps {
  icon?: 'help'|'warning'|'error'|'prompt'|'success'|''|(() => VNode);
  content?: string|(() => VNode);
  title?: string|(() => VNode);
  confirmProps?: object,
  confirmText?: string,
  cancelProps?: object,
  cancelText?: string,
  showCancel?: boolean,
  width?: number|string,
  teleport?: string,
  onConfirm?: () => Promise<void>|void,
  onCancel?: () => Promise<void>|void,
}

export interface ModalContext {
  close: () => void;
}

/**
 * 显示全局占用的加载中对话框
 * @param text 提示文字
 * @returns 
 */
function loading(text: string) {

  const container = document.createElement('div');
  const vnode = h(AlertLoading, {
    show: true,
    title: text,
  });

  document.body.appendChild(container);
  render(vnode, container);

  return {
    close: () => {
      render(null, container);
      document.body.removeChild(container);
    }
  }
}


function help(props: AlertProps) {
  alert({
    icon: 'help',
    ...props,
  });
}
function warning(props: AlertProps) {
  alert({
    icon: 'warning',
    ...props,
  });
}
function error(props: AlertProps) {
  alert({
    icon: 'error',
    ...props,
  });
}
function prompt(props: AlertProps) {
  alert({
    icon: 'prompt',
    ...props,
  });
}
function success(props: AlertProps) {
  alert({
    icon: 'success',
    ...props,
  });
}

/**
 * 显示确定对话框
 * @param props 
 */
function confirm(props: AlertProps) {
  return alert({
    ...props,
    showCancel: true,
  });
}

/**
 * 显示内置弹出对话框
 * @param props 
 * @returns 返回一个Promise，它的值代表用户是否点击了确定按钮
 */
function alert(props: AlertProps) {
  return new Promise<boolean>((resolve) => {
    const container = document.createElement('div');
    const vnode = h(Modal, {
      show: true,
      blur: true,
      showClose: !props.showCancel,
      width: props.width,
      teleport: props.teleport,
      onClose: () => {
        document.body.removeChild(container);
        render(null, container);
      }
    }, {
      default: () => h(AlertInner, {
        title: typeof props.title === 'string' ? props.title : undefined,
        content: typeof props.content === 'string' ? props.content : undefined,
        icon: typeof props.icon === 'string' ? props.icon : undefined,
        showCancel: props.showCancel,
        confirmText: props.confirmText,
        cancelText: props.cancelText,
        cancelProps: props.cancelProps,
        confirmProps: props.confirmProps,
        draggable: false,
        mask: true,
        onConfirm: props.onConfirm,
        onCancel: props.onCancel,
        onFinishCancel: () => resolve(false),
        onFinishConfirm: () => resolve(true),
      }, {
        title: typeof props.title === 'function' ? props.title : undefined,
        content: typeof props.content === 'function' ? props.content : undefined,
        icon: typeof props.icon === 'function' ? props.icon : undefined,
      })
    });

    document.body.appendChild(container);
    render(vnode, container);
  });
}



export default {
  help,
  warning,
  success,
  prompt,
  error,
  alert,
  loading,
  confirm,
}