const SCREEN_WIDTH = 160;
const SCREEN_HEIGHT = 144;

type Color = {
  r: number;
  g: number;
  b: number;
};

export class Canvas {
  private ctx: CanvasRenderingContext2D;
  private buffers: ImageData[] = [];
  private currentBuffer = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = this.canvas.getContext('2d', { desynchronized: true });
    this.buffers = [
      this.ctx.createImageData(256, 256),
      this.ctx.createImageData(256, 256),
    ];
  }

  public get context(): CanvasRenderingContext2D {
    return this.ctx;
  }

  public swap(): void {
    this.ctx.putImageData(this.frameBuffer, 0, 0, 0, 0, 160, 144);
    this.buffers[this.currentBuffer] = this.ctx.createImageData(256, 256);
    this.currentBuffer = (this.currentBuffer + 1) % this.buffers.length;
  }

  public clear(): void {
    this.buffers[this.currentBuffer] = this.ctx.createImageData(256, 256);
    this.ctx.putImageData(this.frameBuffer, 0, 0, 0, 0, 160, 144);
  }

  public setPixel(x: number, y: number, color: Color): void {
    const base = x * 4 + y * 4 * 256;
    this.frameBuffer.data[base] = color.r;
    this.frameBuffer.data[base + 1] = color.g;
    this.frameBuffer.data[base + 2] = color.b;
    this.frameBuffer.data[base + 3] = 255;
  }

  public get frameBuffer(): ImageData {
    return this.buffers[this.currentBuffer];
  }
}
