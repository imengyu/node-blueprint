import { NodePort, type NodePortState } from "@/node-blueprint/Base/Flow/Node/NodePort";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import type { NodeConnectorEditor } from "./NodeConnectorEditor";

export class NodePortEditor extends NodePort {
  public state: NodePortState = 'normal';
  
  private pos = new Vector2();

  /**
   * 获取当前端口连接点的相对位置
   * 【由 NodePort.vue 挂载】
   */
  public getPortPositionRelative : (() => Vector2)|null = null;
   /**
   * 钩子，仅供编辑器使用
   */
  public editorHooks = {
    callbackTwinkle: null as null|((time: number) => void),
  };

  /**
   * 获取当前节点的主颜色
   */
  public getTypeColor() : string {
    return this.paramType.define?.typeColorMerger ? 
      this.paramType.define.typeColorMerger(this.paramType) : 
      (this.paramType.define?.typeColor || '');
  }

  /**
   * 触发闪烁
   * @param time 闪烁时长，毫秒
   */
  public twinkle(time = 1400) {
    this.editorHooks.callbackTwinkle?.(time);
  }

  /**
   * 获取当前端口连接点的绝对视口位置。
   * 此函数需要等待VUE实际渲染节点完成才能获取正确数据。
   * @returns 
   */
  public getPortPositionViewport() : Vector2 {
    if(this.getPortPositionRelative) {
      this.pos.set(this.parent.position);
      this.pos.add(this.getPortPositionRelative());
    }
    return this.pos;
  }

  /**
   * 同步更新所有连接线的颜色值等等信息
   */
  public updatePortValue() {
    for (const connector of this.connectedFromPort)
      (connector as NodeConnectorEditor).updatePortValue();
    for (const connector of this.connectedToPort)
      (connector as NodeConnectorEditor).updatePortValue();
  }
}