export class EventHandler<T> {
  public listener : Array<{
    _this : any,
    callback : Function,
  }> = [];

  public addListener(_this : any, callback : T) {
    return this.listener.push({
      _this: _this,
      callback: <any>callback,
    }) - 1;
  }
  public removeListener(callback : T|number) {
    if(typeof callback == 'number') {
      this.listener.remove(callback);
    } else for(let i = this.listener.length - 1; i >= 0; i--)
      if(this.listener[i].callback == <any>callback) {
        this.listener.remove(i);
        break;
      }
  }
  public hasListener(callback : T) {
    for(let i = this.listener.length - 1; i >= 0; i--)
      if(this.listener[i].callback == <any>callback) {
        this.listener.remove(i);
        return false;
      }
    return true;
  }
  public invoke(...args : any) { 
    let rs : any = undefined;
    if(this.listener.length > 0) {
      let _args = arguments;
      this.listener.forEach((callback) => {
        if(typeof callback.callback == 'function')
          rs = callback.callback.apply(callback._this, _args)
      });
    }
    return rs;
  }
}

export type VoidDelegate = () => void; 
export type MouseEventDelegate = (e : MouseEvent) => any; 
