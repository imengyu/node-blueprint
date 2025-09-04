export class ReadyDispatcher {
  private cbs : Array<{
    resolve: () => void,
    reject: (e?: any) => void,
  }> = [];

  setReadyState() {
    this.cbs.forEach((cb) => cb.resolve());
    this.cbs.clear();
  }
  setErrorState(e: any) {
    this.cbs.forEach((cb) => cb.reject(e));
    this.cbs.clear();
  }
  waitReadyState() {
    return new Promise<void>((resolve, reject) => this.cbs.push({ resolve, reject }));
  }
}