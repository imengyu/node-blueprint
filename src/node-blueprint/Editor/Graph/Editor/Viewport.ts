import { Rect } from "@/node-blueprint/Base/Utils/Base/Rect";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import type { IKeyValueObject } from "@/node-blueprint/Base/Utils/BaseTypes";
import { SerializableObject } from "@/node-blueprint/Base/Utils/Serializable/SerializableObject";

/**
 * 编辑器视图信息结构体
 */
export class NodeGraphEditorViewport extends SerializableObject<INodeGraphEditorViewport> {
  /**
   * 编辑器的元素绝对位置
   */
  editorAbsolutePos = new Vector2();
  /**
   * 视图位置
   */
  position = new Vector2();
  /**
   * 视图的真实大小
   */
  size = new Vector2();
  /**
   * 视图缩放 (0-2, 0%-200%, 默认1)
   */
  scale = 1;

  constructor() {
    super('NodeGraphEditorViewport');
    this.serializableProperties = [ 'position', 'scale' ]
  }

  /**
   * 设置为另一个结构的数据
   * @param other 
   */
  set(other : NodeGraphEditorViewport) : void {
    this.position.set(other.position);
    this.scale = other.scale;
  }

  /**
   * 按照指定坐标缩放视图
   * @param newScale 
   * @param center 
   */
  scaleAndCenter(newScale: number, center?: Vector2) {
    let viewZoom = this.scale;
    if (viewZoom === newScale)
      return;
    const viewSize = this.size;
    const pos = center ? center : this.rect().calcCenter();
    pos.x = pos.x / viewZoom;
    pos.y = pos.y / viewZoom;
    this.scale = newScale;
    viewZoom = this.scale;
    pos.x = pos.x * viewZoom - viewSize.x / 2;
    pos.y = pos.y * viewZoom - viewSize.y / 2;
    this.position = pos;
  }

  /**
   * 获取视口矩形
   * @returns 
   */
  rect(): Rect {
    const rect = new Rect();
    rect.setPos(this.position);
    rect.setSize(this.size);
    return rect;
  }

  /**
   * 检测一个屏幕坐标是否显示在视口中
   * @param point
   */
  testPointVisibleInViewport(point: Vector2): boolean {
    return point.x > this.position.x && point.y > this.position.y 
      && point.x < this.position.x + this.size.x && point.y > this.position.y + this.size.y;
  }
  /**
   * 编辑器坐标转屏幕坐标
   * @param point 编辑器坐标
   * @param dest 编辑器坐标，结果被赋值到这里
   */
  viewportPointToScreenPoint(point: Vector2, dest: Vector2): void {
    dest.set(
      point.x - this.position.x + this.editorAbsolutePos.x,
      point.y - this.position.y + this.editorAbsolutePos.y
    );
  }
  /**
   * 屏幕坐标转编辑器坐标
   * @param point 屏幕坐标
   * @param dest 编辑器坐标，结果被赋值到这里
   */
  screenPointToViewportPoint(point: Vector2, dest: Vector2): void {
    dest.set(
      this.position.x + (point.x - this.editorAbsolutePos.x),
      this.position.y + (point.y - this.editorAbsolutePos.y)
    );
  }
  /**
   * 屏幕坐标减去编辑器绝对坐标
   */
  fixScreenPosWithEditorAbsolutePos(point: Vector2): Vector2 {
    point.substract(this.editorAbsolutePos);
    return point
  }
}

export interface INodeGraphEditorViewport {
  position: IKeyValueObject;
  scale: number;
}