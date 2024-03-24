export class ConcatableArray<T> {
  private array?: T[];

  concat(items: T[]): void {
    this.array = this.array ? this.array.concat(items) : items;
  }

  getArray() {
    return this.array;
  }
}