import type { IKeyValueObject } from "../BaseTypes";
import { CreateObjectFactory, SerializableObject } from "../../Serializable/SerializableObject";

CreateObjectFactory.addObjectFactory('Vector2', () => new Vector2());

/**
 * 2D Vector
 */
export class Vector2 extends SerializableObject<IKeyValueObject> {

  /**
   * X axis
   */
  public x = 0;
  /**
   * Y axis
   */
  public y = 0;

  public constructor(x: number|Vector2 = 0, y = 0) {
    super('Vector2', undefined, {
      serializeSchemes: {
        default: {
          serializableProperties: [ 'x', 'y' ],
        },
      }
    });
    if (typeof x === 'object') {
      this.y = x.y;
      this.x = x.x;
    } else {
      this.y = y;
      this.x = x;
    }
  }

  /**
   * Set new vector values
   * @param x X axis or other Vector
   * @param y Y axis or none
   */
  public set(x : number|Vector2, y = 0) : Vector2 {
    if(typeof x === "number") {
      this.y = typeof y === 'number' ? y : x;
      this.x = x;
    } else {
      this.y = x.y;
      this.x = x.x;
    }
    return this;
  }
  /**
   * Clone a new item
   * @returns 
   */
  public clone() : Vector2 {
    return new Vector2(this.x, this.y);
  }
  /**
   * 将当前二维向量加指定数字 【Adds the specified number to the current 2D vector】
   * @param v 
   * @returns 
   */
  public add(v : number|Vector2) : Vector2 {
    if(typeof v === "number") {
      this.x += v;
      this.y += v;
    }
    else if(typeof v === "object") {
      this.x += v.x;
      this.y += v.y;
    }
    return this;
  }
  /**
   * 将当前二维向量减以指定数字【Subtract the current 2D vector to specify a number】
   * @param v 
   * @returns 
   */
  public substract(v : number|Vector2) : Vector2 {
    if(typeof v === "number") {
      this.x -= v;
      this.y -= v;
    }
    else if(typeof v === "object") {
      this.x -= v.x;
      this.y -= v.y;
    }
    return this;
  }
  /**
   * 将当前二维向量乘以指定数字 【Multiplies the current 2D vector by the specified number】
   * @param v 
   * @returns 
   */
  public multiply(v : number) : Vector2 {
    this.x *= v;
    this.y *= v;
    return this;
  }
  /**
   * 将当前二维向量除以指定数字 【Divides the current 2D vector by the specified number】
   * @param v 
   * @returns 
   */
  public divide(v : number) : Vector2 {
    this.x /= v;
    this.y /= v;
    return this;
  }
  /**
   * Test two vector2's value is equal
   */
  public equal(another : Vector2) : boolean {
    return this.x === another.x && this.y === another.y;
  }
  /**
   * 转为字符串
   * @returns 
   */
  public toString() : string {
    return `{x=${this.x},y=${this.y}}`;
  }
}
