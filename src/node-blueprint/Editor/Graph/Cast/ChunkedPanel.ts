import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import { Rect } from "@/node-blueprint/Base/Utils/Base/Rect";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import type { ISaveableTypes } from "@/node-blueprint/Base/Utils/BaseTypes";
import type { NodeGraphEditorViewport } from "../NodeGraphEditor";

/**
 * 区块式平面碰撞检测器。
 * @description 该检测器用于编辑器进行二维平面中的矩形碰撞检测。
 */
export class ChunkedPanel {
  chunkWidth = 500;
  chunkHeight = 300;
  chunk = new Map<number, ChunkContatiner>();

  /**
   * 绘制调试信息
   * @param viewPort 视口
   * @param ctx CanvasRenderingContext2D
   * @returns 
   */
  renderDebugInfo(viewPort : NodeGraphEditorViewport, ctx : CanvasRenderingContext2D) : void {
    if(!ctx) return;

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#00f';

    const startPos = viewPort.position;
    const viewPortSize = viewPort.size;
    const scale = viewPort.scale;
    const scaledGridWidth = scale * this.chunkWidth;
    const scaledGridHeight = scale * this.chunkHeight;

    const xStartOffset = startPos.x % scaledGridWidth;
    const yStartOffset = startPos.y % scaledGridHeight;

    for(let x = -xStartOffset; x < viewPortSize.x; x += scaledGridWidth) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, viewPortSize.y);
      ctx.closePath();
      ctx.stroke();
    }
    for(let y = -yStartOffset; y < viewPortSize.y; y += scaledGridHeight) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(viewPortSize.x, y);
      ctx.closePath();
      ctx.stroke();      
    }

    const regionStartIndexX = Math.floor(startPos.x / scaledGridWidth);
    const regionStartIndexY = Math.floor(startPos.y / scaledGridHeight);
    const regionVisibleX = Math.ceil(viewPortSize.x / scaledGridWidth);
    const regionVisibleY = Math.ceil(viewPortSize.y / scaledGridHeight);
  
    for(let x = regionStartIndexX; x < regionStartIndexX + regionVisibleX; x ++) {
      for(let y = regionStartIndexY; y < regionStartIndexY + regionVisibleY; y++) {
        const chunk = this.getChunk(x, y, true);
        const xc = x * scaledGridWidth - startPos.x;
        const yc = y * scaledGridHeight - startPos.y;
        
        if (!chunk)
          continue;

        ctx.strokeStyle = '#ff0';
        ctx.strokeRect(xc, yc, scaledGridWidth, scaledGridHeight);
        ctx.fillText(`Chunk:${x},${y}`, xc, yc);

        ctx.strokeStyle = '#f00';
        chunk.childs.forEach((c) => {
          const pos = new Vector2(c.rect.x, c.rect.y);
          viewPort.viewportPointToScreenPoint(pos, pos);
          ctx.strokeRect(pos.x, pos.y, c.rect.w * scale, c.rect.h * scale);
          ctx.fillText(c.rect.toString(), pos.x, pos.y);
        });

      }
    }
  }

  /**
   * 添加实例至检测器中使其可以被检测碰撞
   * @param instance 
   */
  addInstance(instance : ChunkInstance) : void {
    const chunks = this.getRectChunks(instance.rect);
    chunks.forEach((c) => {
      c.childs.push(instance);
      instance.parents.push(c);
    })
  }
  /**
   * 从检测器中移除实例
   * @param instance 
   */
  removeInstance(instance : ChunkInstance) : void {
    instance.parents.forEach((p) => {
      ArrayUtils.remove(p.childs, instance);
      this.checkChunkContatinerIfEmptyRemove(p);
    });
    ArrayUtils.clear(instance.parents);
  }
  /**
   * 更新实例的矩形。
   * 注意，ChunkInstance 的 Rect 矩形更改后必须调用此方法以使碰撞检测器正确检测。
   * @param instance 
   */
  updateInstance(instance : ChunkInstance) : void {
    const chunks = this.getRectChunks(instance.rect);
    const needCheckEmptyChunks : ChunkContatiner[] = [];
    for (let i = instance.parents.length - 1; i >= 0; i--) {
      const p = instance.parents[i];
      if(!chunks.includes(p)) {
        ArrayUtils.remove(p.childs, instance);
        ArrayUtils.removeAt(instance.parents, i);
        needCheckEmptyChunks.push(p);
      }
    }
    chunks.forEach((c) => {
      ArrayUtils.addOnce(c.childs, instance);
      ArrayUtils.addOnce(instance.parents, c);
    });
    needCheckEmptyChunks.forEach(p =>  this.checkChunkContatinerIfEmptyRemove(p));
  }


  /**
   * 获取块容器
   * @param x 索引X
   * @param y 索引Y
   * @param forceNoCreate 强制不创建
   * @returns 
   */
  private getChunk(x : number, y : number, forceNoCreate = false) {
    const chunkHash = x + y * 1000;
    let chunk = this.chunk.get(chunkHash);
    if(!forceNoCreate && !chunk) {
      chunk = new ChunkContatiner();
      chunk.hash = chunkHash;
      chunk.pos.set(x, y);
      this.chunk.set(chunkHash, chunk);
    }
    return chunk;
  }

  /**
   * 根据坐标轴矩形获取与矩形相交的块容器
   * @param rect 坐标轴矩形
   * @param forceNoCreate 强制不创建
   * @returns 
   */
  private getRectChunks(rect : Rect, forceNoCreate = false) {
    const result = new Array<ChunkContatiner>();
    const start = this.getPointChunkIndex(rect.x, rect.y);
    const end = this.getPointChunkIndex(rect.getRight(), rect.getBottom());

    for(let x = start.x; x <= end.x; x++) {
      for(let y = start.y; y <= end.y; y++) {
        const c = this.getChunk(x, y, forceNoCreate);
        if(c) result.push(c);
      }
    }

    return result;
  }
  /**
   * 根据坐标轴XY坐标计算获取块容器
   * @param pt 坐标轴XY坐标
   * @param forceNoCreate 强制不创建
   * @returns 
   */
  private getPointChunk(pt : Vector2, forceNoCreate = false) {
    const index = this.getPointChunkIndex(pt);
    return this.getChunk(index.x, index.y, forceNoCreate);
  }
  /**
   * 根据坐标轴XY坐标计算获取块容器索引
   * @param x X坐标
   * @param y Y坐标
   * @returns 
   */
  private getPointChunkIndex(x : Vector2|number, y ?:number) {
    if(typeof x === 'object') {
      return new Vector2(Math.floor(x.x / this.chunkWidth), Math.floor(x.y / this.chunkHeight));
    }
    else {
      return new Vector2(Math.floor(x / this.chunkWidth), Math.floor((y || 0) / this.chunkHeight));
    }
  }

  /**
   * 检查块是否空的，如果为空，则执行删除操作
   * @param chunkContatiner 
   */
  private checkChunkContatinerIfEmptyRemove(chunkContatiner: ChunkContatiner) {
    //移除容器
    if (chunkContatiner.childs.length === 0) {
      this.chunk.delete(chunkContatiner.hash);
    }
  }

  /**
   * 检测与指定矩形区域碰撞的实例
   * @param rect 指定矩形区域
   * @returns 返回碰撞的实例数组
   */
  testRectCast(rect : Rect) : Array<ChunkInstance> {
    return this.testRectCastTag(rect);
  }
  /**
   * 检测与指定点碰撞的实例
   * @param point 指定点
   * @returns 返回碰撞的实例数组
   */
  testPointCast(point : Vector2) : Array<ChunkInstance> {
    return this.testPointCast(point);
  }
  /**
   * 检测与指定矩形区域碰撞指定标签的实例
   * @param rect 指定矩形区域
   * @param tag 指定标签
   * @returns 返回碰撞的实例数组
   */
  testRectCastTag(rect : Rect, tag ?: string) : Array<ChunkInstance> {
    const castObjects = new Array<ChunkInstance>();
    const chunks = this.getRectChunks(rect, true);
    for (let j = chunks.length - 1; j >= 0; j--) {
      const chunk = chunks[j];
      for (let i = chunk.childs.length - 1; i >= 0; i--) {
        const c = chunk.childs[i];
        if(c.rect.testRectCross(rect) && (typeof tag === 'undefined' || c.tag == tag))
          castObjects.push(c);
      }    
    }
    return castObjects;
  }
  /**
   * 检测与指定点碰撞的指定标签的实例
   * @param point 指定点
   * @param tag 指定标签
   * @returns 返回碰撞的实例数组
   */
  testPointCastTag(point : Vector2, tag ?: string) : Array<ChunkInstance> {
    const castObjects = new Array<ChunkInstance>();
    const chunk = this.getPointChunk(point, true);
    if(chunk) {
      for (let i = chunk.childs.length - 1; i >= 0; i--) {
        const c = chunk.childs[i];
        if(c.rect.testInRect(point) && (typeof tag === 'undefined' || c.tag == tag))
          castObjects.push(c);
      }
    }
    return castObjects;
  }
}


/**
 * 区块容器
 */
export class ChunkContatiner {
  hash = 0;
  pos = new Vector2();
  childs = new Array<ChunkInstance>();
}

/**
 * 区块内的实例
 */
export class ChunkInstance {
  /**
   * 当前实例的矩形。
   * 更新此字段后请使用 ChunkedPanel.updateInstance 来更新区块信息。
   */
  rect = new Rect();
  /**
   * 自定义数据
   */
  data : null|ISaveableTypes = null;
  /**
   * 父级标签
   */
  parents = new Array<ChunkContatiner>();
  /**
   * 标签
   */
  tag = '';

  constructor(rect : Rect|undefined, tag : string, data : null|ISaveableTypes = null) {
    this.rect = rect || new Rect();
    this.data = data;
    this.tag = tag;
  }
}