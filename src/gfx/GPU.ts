import { RAM } from '../mem/RAM';
import { signed } from '../sys/instructions/util';
import { InterruptManager } from '../sys/InterruptManager';
import { Canvas } from './Canvas';

/**
 * Page 23 of the Gameboy CPU Manual
 * Screen buffer is 256x256 pixels, or 32x32 tiles.
 * Screen itself is 160x144 pixels, background is rendered based on SCROLLX and SCROLLY memory locations.
 * The background wraps.
 *
 * Background Tile Map is a 32x32 area of memory, each byte containing a number which references
 * a background tile that should be rendered.
 *
 * Tile patterns are loaded from 0x8000-0x8fff, or 0x8800-0x97ff (???)
 *   - First case, tiles have unsigned numbers (0-255)
 *   - Second case, tiles have signed numbers (-128-127) - Pattern 0 lives at 0x9000
 * Tile data table address is found in the LCDC register.
 * The table at 0x8000 to 0x8fff can be used for sprites, background and window.
 * The table at 0x8fff can be used for only background and window.
 *
 * Window layer overlays the background. Window location on the screen is in WNDPOSX and WNDPOSY.
 * Tile data table contains the window tiles as well.
 *
 * Background and Window layers can be enabled/disabled via the LCDC register.
 *
 */

const TOTAL_SCAN_LINES = 154;
const SCANLINE_CYCLES = 456;
const VBLANK_SCANLINE = 144;

const OAM_PHASE = SCANLINE_CYCLES * (1 / 6);
const LCD_TRANSFER_PHASE = OAM_PHASE + SCANLINE_CYCLES * (2 / 6);
const HBLANK_PHASE = LCD_TRANSFER_PHASE + SCANLINE_CYCLES * (3 / 6);

const palette = [
  { r: 255, g: 255, b: 255 },
  { r: 75, g: 75, b: 75 },
  { r: 175, g: 175, b: 175 },
  { r: 0, g: 0, b: 0 },
];

export class GPU {
  private currentV = -1;
  private hblank: boolean;
  private vblank = false;

  constructor(
    private canvas: Canvas,
    private memory: RAM,
    private interruptManager: InterruptManager
  ) {
    this.currentV = -1;
    this.hblank = false;
  }

  step(currentCycle: number): void {
    // Each scan-line gets 456 cycles to render.
    // 1/6 of the time is spent in OAM search
    // 2/6 of the time is spent in data transfer.
    // 3/6 of the time is spent in H-Blank (render of scanline).
    const currentRenderPhase = currentCycle % SCANLINE_CYCLES;
    if (currentRenderPhase < OAM_PHASE) {
      this.hblank = false;

      // When we begin to render the next line, we set the next V.
      if (this.getModeFlag() === 0) {
        this.memory.write(0xff44, this.currentV);
        // TODO: Set the 2nd bit of the LCDC register.
        if (this.memory.read(0xff45) === this.currentV) {
          this.interruptManager.fire('LCDC');
        }
      }

      this.setModeFlag(2);
    } else if (currentRenderPhase < LCD_TRANSFER_PHASE) {
      this.setModeFlag(3);
    } else if (currentRenderPhase < HBLANK_PHASE) {
      this.setModeFlag(0);

      if (!this.hblank) {
        this.renderBackground(this.currentV);
        this.renderWindow(this.currentV);

        this.hblank = true;
        this.currentV += 1;
      }
    }

    if (currentCycle >= VBLANK_SCANLINE * SCANLINE_CYCLES) {
      // Fire vblank interrupt when transitioning.
      if (!this.vblank) {
        this.currentV = 0;
        this.interruptManager.fire('VBlank');
        this.canvas.swap();
      }

      this.vblank = true;
      this.setModeFlag(1);
    } else {
      this.vblank = false;
    }
  }

  public dumpSpriteTable(): ImageData {
    const base = this.bgWindowTileDataSource;
    const dst = this.canvas.context.createImageData(256, 96);
    const mem = this.memory.dma();

    for (let i = 0; i < 384; i++) {
      const row = Math.floor(i / 32);
      const col = i - row * 32;

      const tileAddr = this.getTileDataAddr(base, i);
      for (let j = 0; j < 16; j += 2) {
        const y = row * 8 + Math.floor(j / 2);
        const d1 = mem[tileAddr + j];
        const d2 = mem[tileAddr + j + 2];
        for (let k = 0; k < 7; k++) {
          const pixel = this.getPixel(d1, d2, k);
          const x = col * 8 + (7 - k);
          const base = x * 4 + y * 4 * 256;
          dst.data[base] = palette[pixel].r;
          dst.data[base + 1] = palette[pixel].g;
          dst.data[base + 2] = palette[pixel].b;
          dst.data[base + 3] = 255;
        }
      }
    }

    return dst;
  }

  private renderBackground(scanline: number): void {
    const baseAddr = this.backgroundDisplayMemoryBase;
    const row = Math.floor(scanline / 8);
    const ds = this.bgWindowTileDataSource;

    this.renderBackgroundOrWindowScanline(baseAddr, row, scanline, ds);
  }

  private renderWindow(scanline: number): void {
    if (!this.windowEnabled) {
      return;
    }

    const baseAddr = this.windowDisplayMemoryBase;
    const row = Math.floor(scanline / 8);
    const ds = this.bgWindowTileDataSource;

    this.renderBackgroundOrWindowScanline(baseAddr, row, scanline, ds);
  }

  private renderBackgroundOrWindowScanline(
    baseAddr: number,
    row: number,
    scanline: number,
    tileDataAddressBase: number
  ) {
    const mem = this.memory.dma();

    for (let i = 32; i > 0; i--) {
      const addr = baseAddr + row * 32 + (i - 1);
      const tile = mem[addr];
      const tileRow = scanline - row * 8;
      const tileAddr =
        this.getTileDataAddr(tileDataAddressBase, tile) + tileRow * 2;
      const rowData1 = mem[tileAddr];
      const rowData2 = mem[tileAddr + 1];

      for (let j = 7; j >= 0; j--) {
        const pixelValue = this.getPixel(rowData1, rowData2, j);

        const x = (i - 1) * 8 + (7 - j);
        const y = scanline;
        this.canvas.setPixel(x, y, palette[pixelValue]);
      }
    }
  }

  private getPixel(rowData1: number, rowData2: number, j: number) {
    return (
      ((rowData1 & (0b1 << j)) >> j) | (((rowData2 & (0b1 << j)) >> j) << 1)
    );
  }

  private get lcdc(): number {
    return this.memory.dma()[0xff41];
  }

  private setModeFlag(mode: number) {
    const newValue = (this.lcdc & 0b11111100) | (mode & 0b11);
    this.memory.writeLCDCInternal(newValue);
  }

  private getModeFlag() {
    return this.lcdc & 0b11;
  }

  private getTileDataAddr(source: number, tileIdx: number): number {
    if (source === 0) {
      return 0x8000 + tileIdx * 16;
    } else {
      return 0x9000 + signed(tileIdx) * 16;
    }
  }

  private get bgWindowTileDataSource(): number {
    return (this.lcdc & (0b1 << 4)) >> 4;
  }

  private get backgroundDisplayMemoryBase(): number {
    const option = (this.lcdc & 0b1000) >> 3;
    return option === 1 ? 0x9c00 : 0x9800;
  }

  private get windowEnabled(): boolean {
    return (this.lcdc & (0b1 << 5)) === 1;
  }

  private get windowDisplayMemoryBase(): number {
    const option = this.lcdc & (0b1 << 6);
    return option === 1 ? 0x9c00 : 0x9800;
  }

  private get backgroundScrollY(): number {
    return this.memory.read(0xff42);
  }

  private get backgroundScrollX(): number {
    return this.memory.read(0xff43);
  }

  private get windowY(): number {
    return this.memory.read(0xff4a);
  }

  private get windowX(): number {
    return this.memory.read(0xff4b);
  }

  private get backgroundPalette(): number {
    return this.memory.read(0xff47);
  }
}
