export class FPSCalculator {
  lastTime = 0;
  fps = 0;

  calculateFps() : number {
    const now = (+new Date), fps = 1000/(now - this.lastTime);
    this.lastTime = now;
    this.fps = fps;
    return fps;
  }
}

