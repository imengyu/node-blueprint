export class SimpleDelay<T = any> {

  private executor: (data: T) => void;
  private interval: number;
  private data: T;
  private timer = 0;

  public constructor(data: T, executor: (d: T) => void, interval: number) {
    this.executor = executor;
    this.interval = interval;
    this.data = data;
  }

  public isWaiting() {
    return this.timer > 0;
  }
  public start() {
    if (this.timer)
      clearTimeout(this.timer);
    this.timer = setTimeout(() => 
      this.executor(this.data), 
      this.interval
    ) as unknown as number;
  }
  public stop() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = 0;
    }
  }

}
export class SimpleTimer<T = any> {

  private executor: (data: T) => void;
  private interval: number;
  private data: T;
  private timer = 0;
  private executorTimeLimitWarnCount = 0;
  private lasExecuteTime = 0;

  public constructor(data: T, executor: (d: T) => void, interval: number) {
    this.executor = executor;
    this.interval = interval;
    this.data = data;
  }

  public start() {
    if (this.timer)
      clearInterval(this.timer);
    this.timer = setInterval(() => {

      const startTime = new Date();
      try {
        this.executor(this.data);
      } catch {
        clearInterval(this.timer);
        this.timer = 0;
      }

      //计算执行时间
      const executeTime = new Date().getTime() - startTime.getTime();

      //如果与上一次触发时间过近，则取消
      const lastInterval = startTime.getTime() - this.lasExecuteTime
      if (this.lasExecuteTime > 0 && lastInterval < (this.interval - 200)) {
        console.warn('The execution time of the timer is too fast, lastInterval: ' + lastInterval, 'executor:', this.executor);
        return;
      }

      this.lasExecuteTime = startTime.getTime();

      //如果执行时间过长，则警告
      if (executeTime > this.interval * 0.5 && this.executorTimeLimitWarnCount < 1) {
        console.warn('The execution time of the timer is too long, exceeding the timing for ' + this.interval + 'ms. executor:', this.executor, 'count:', this.executorTimeLimitWarnCount);
        this.executorTimeLimitWarnCount++;
      } else
        this.executorTimeLimitWarnCount--;

    }, this.interval) as unknown as number;
  }
  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = 0;
    }
  }

}