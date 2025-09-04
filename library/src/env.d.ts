/// <reference types="vite/client" />

interface Array<T> {
  remove<T>(item: T) : boolean;
  removeAt<T>(index: number) : boolean;
  insert<T>(i: number, item: T) : this;
  clear<T>() : this;
  addOnce<T>(item: T) : number;
}