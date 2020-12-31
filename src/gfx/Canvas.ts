export class Canvas {
  private ctx: CanvasRenderingContext2D;
  private buffers: ImageData[] = [];
  private currentBuffer = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    width: number,
    height: number
  ) {
    this.ctx = this.canvas.getContext('2d', { desynchronized: true });
    this.buffers = [
      this.ctx.createImageData(width, height),
      this.ctx.createImageData(width, height),
    ];
  }

  public get context(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public swap(): void {
    this.currentBuffer = (this.currentBuffer + 1) % this.buffers.length;
    this.ctx.putImageData(this.buffers[this.currentBuffer], 0, 0);
  }
}
