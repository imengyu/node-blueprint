import type { Vector2 } from "./Vector2";

export function calc2PointDistance(pos1: Vector2, pos2: Vector2) {
  return Math.sqrt(Math.pow(Math.abs(pos1.x - pos2.x), 2) + Math.pow(Math.abs(pos1.y - pos2.y), 2));
}