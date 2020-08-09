export class EventHandler<T> {
  public listener : Array<T> = [];

  public addListener(callback : T) {
    this.listener.push(callback);
  }
  public removeListener(callback : T) {
    this.listener.remove(callback);
  }
  public invoke(...args) {
    let _args = arguments;
    let _this = this;
    this.listener.forEach((callback) => {
      if(typeof callback == 'function')
        callback.apply(_this, _args)
    });
  }
}
