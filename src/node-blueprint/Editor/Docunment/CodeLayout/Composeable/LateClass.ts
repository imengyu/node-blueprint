export type  LateClassCallback = (...args: any[]) => any;

export class LateClass {
  private lateNotifyCallbacks = new Map<string, LateClassCallback>();
  private lateNotifyItems : {
    name: string,
    args: any[],
    resolve: (d: any) => void,
    reject: (e: any) => void,
  }[] = [];

  listenLateAction(name: string, cb: LateClassCallback) {
    this.lateNotifyCallbacks.set(name, cb);
    this.applyLateActions(name);
  }
  unlistenLateAction(name: string) {
    this.lateNotifyCallbacks.delete(name);
  }
  unlistenAllLateAction() {
    this.lateNotifyCallbacks.clear();
  }
  applyLateActions(name: string) {
    const cb = this.lateNotifyCallbacks.get(name);
    if (cb) {
      for(let i = this.lateNotifyItems.length - 1; i >= 0; i--) {
        const iterator = this.lateNotifyItems[i];
        if (iterator.name === name) {
          try {
            iterator.resolve(cb(...iterator.args));
          } catch (e) {
            iterator.reject(e);
          }
          this.lateNotifyItems.splice(i, 1);
        }
      }
    }
  }

  pushLateAction(name: string, ...args: any[]) : Promise<any> {
    const cb = this.lateNotifyCallbacks.get(name);
    if (cb) {
      try {
        return Promise.resolve(cb(...args));
      } catch (e) {
        return Promise.reject(e);
      }
    }
    else {
      return new Promise<any>((resolve, reject) => {
        const instance = { name, args, resolve, reject };
        this.lateNotifyItems.push(instance);
      });
    }
  }
}