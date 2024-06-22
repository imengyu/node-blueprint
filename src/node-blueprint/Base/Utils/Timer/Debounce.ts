export class Debounce {

  private timer = 0;
  private delay;
  private cb : () => void;

  constructor(delay: number, cb: () => void) {
    this.cb = cb;
    this.delay = delay;
  }

  execute() {
    if (this.timer > 0)
      return;
    this.cb();
    this.timer = setTimeout(() => this.timer = 0, this.delay);
  }
  executeWithDelay(delay = -1) {
    if (this.timer > 0)
      return;
    if (delay <= 0)
      delay = this.delay;
    this.timer = setTimeout(() => {
      this.timer = 0;
      this.execute();
    }, delay);
  }
}