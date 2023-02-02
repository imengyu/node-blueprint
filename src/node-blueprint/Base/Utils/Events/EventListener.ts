const EventListener = {
  /**
   * Listen to DOM events during the bubble phase.
   *
   * @param target DOM element to register listener on.
   * @param eventType Event type, e.g. 'click' or 'mouseover'.
   * @param callback Callback function.
   * @return Object with a `remove` method.
   */
  listen(target : EventTarget, eventType : string, callback : EventListenerOrEventListenerObject) : EventListenerEvent {
    target.addEventListener(eventType, callback, false);
    return {
      remove() {
        target.removeEventListener(eventType, callback, false);
      }
    };
  }
};

export interface EventListenerEvent {
  remove(): void;
}

export default EventListener;