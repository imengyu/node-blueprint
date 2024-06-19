import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";

export class ReadyDispatcher {
  private cbs : Array<{
    resolve: () => void,
    reject: (e?: any) => void,
  }> = [];

  setReadyState() {
    this.cbs.forEach((cb) => cb.resolve());
    ArrayUtils.clear(this.cbs);
  }
  setErrorState(e: any) {
    this.cbs.forEach((cb) => cb.reject(e));
    ArrayUtils.clear(this.cbs);
  }
  waitReadyState() {
    return new Promise<void>((resolve, reject) => this.cbs.push({ resolve, reject }));
  }
}