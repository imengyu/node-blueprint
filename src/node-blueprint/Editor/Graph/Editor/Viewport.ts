
import { Rect } from "@/node-blueprint/Base/Utils/Base/Rect";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import type { IKeyValueObject } from "@/node-blueprint/Base/Utils/BaseTypes";
import { SerializableObject } from "@/node-blueprint/Base/Utils/Serializable/SerializableObject";

/**
 * 编辑器视图信息结构体
 */
export class NodeGraphEditorViewport extends SerializableObject<INodeGraphEditorViewport> {

  constructor() {
    super('NodeGraphEditorViewport');
    this.serializableProperties = [ 'position', 'scale', 'scaledPosition', '_scaledPosition' ]
  }

  /**
   * 编辑器的元素绝对位置（屏幕坐标）
   */
  editorAbsolutePos = new Vector2();
  /**
   * 视图位置（图表坐标）
   */
  position = new Vector2();
  /**
   * 视图的真实大小（屏幕坐标）
   */
  size = new Vector2();
  /**
   * 视图的大小（图表坐标）
   */
  get viewportSize() {
    this.viewportSizeTemp.set(this.size);
    this.scaleScreenSizeToViewportSize(this.viewportSizeTemp);
    return this.viewportSizeTemp;
  }
  /**
   * 视图缩放 (0-2, 0%-200%, 默认1)
   */
  scale = 1;

  private viewportSizeTemp = new Vector2();

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
   * @param newScale 新的缩放大小
   * @param center 居中坐标，如果不填写，则默认按照矩形的中心进行缩放
   */
  scaleAndCenter(newScale: number, center?: Vector2) {
    const viewZoom = this.scale;
    if (viewZoom === newScale)
      return;
    
    this.scale = newScale;

    if (center) {
      const pecX = 1 + (center.x - this.size.x / 2) / (this.size.x / 2);
      const pecY = 1 + (center.y - this.size.y / 2) / (this.size.y / 2);
      /**
       * 
       * 偏心计算，目标位置减去矩形缩放后的差值/2*偏向百分比
       */
      this.position.x -= pecX * ((this.size.x / newScale - this.size.x / viewZoom) / 2);
      this.position.y -= pecY * ((this.size.y / newScale - this.size.y / viewZoom) / 2);
    } else {
      /**
       * 无偏心计算，目标位置减去矩形缩放后的差值/2
       */
      this.position.x -= (this.size.x / newScale - this.size.x / viewZoom) / 2;
      this.position.y -= (this.size.y / newScale - this.size.y / viewZoom) / 2;
    }
  }

  /**
   * 获取视口矩形（图表坐标）
   * @returns 
   */
  rect(): Rect {
    const rect = new Rect();
    rect.setPos(this.position);
    rect.setSize(this.viewportSize);
    return rect;
  }

  /**
   * 编辑器坐标转屏幕坐标
   * @param point 编辑器坐标
   * @param dest 编辑器坐标，结果被赋值到这里
   */
  viewportPointToScreenPoint(point: Vector2, dest?: Vector2): Vector2 {
    if (!dest)
      dest = new Vector2();
    dest.set(
      (point.x - this.position.x) * this.scale + this.editorAbsolutePos.x,
      (point.y - this.position.y) * this.scale + this.editorAbsolutePos.y,
    );
    return dest;
  }
  /**
   * 屏幕坐标转编辑器坐标
   * @param point 屏幕坐标
   * @param dest 编辑器坐标，结果被赋值到这里
   */
  screenPointToViewportPoint(point: Vector2, dest?: Vector2): Vector2 {
    if (!dest)
      dest = new Vector2();
    dest.set(
      (this.position.x + (point.x - this.editorAbsolutePos.x) / this.scale),
      (this.position.y + (point.y - this.editorAbsolutePos.y) / this.scale),
    );
    return dest;
  }

  /**
   * 转换屏幕真实像素大小为视口画布大小
   * @param size 
   */
  scaleScreenSizeToViewportSize<T>(size: T) : T {
    if (typeof size === 'number')
      return size / this.scale as T;
    if (size instanceof Vector2)
      return size.divide(this.scale) as T;
    return size;
  }
  /**
   * 转换视口画布大小为屏幕真实像素大小
   * @param size 
   */
  scaleViewportSizeToScreenSize<T>(size: T) : T {
    if (typeof size === 'number')
      return size * this.scale as T;
    if (size instanceof Vector2)
      return size.multiply(this.scale) as T;
    return size;
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