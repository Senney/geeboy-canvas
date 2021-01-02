import { RAM } from '../mem/RAM';
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

export class GPU {
  private currentV = -1;
  private vblank = false;

  constructor(
    private canvas: Canvas,
    private memory: RAM,
    private interruptManager: InterruptManager
  ) {
    this.currentV = -1;
  }

  step(currentCycle: number): void {
    // Each scan-line gets 456 cycles to render.
    // 1/6 of the time is spent in OAM search
    // 2/6 of the time is spent in data transfer.
    // 3/6 of the time is spent in H-Blank (render of scanline).
    const currentRenderPhase = currentCycle % SCANLINE_CYCLES;
    if (currentRenderPhase < OAM_PHASE) {
      // When we begin to render the next line, we set the next V.
      if (this.getModeFlag() === 0) {
        this.currentV = (this.currentV + 1) % TOTAL_SCAN_LINES;
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

      this.renderBackground(this.currentV);
    }

    if (currentCycle >= VBLANK_SCANLINE * SCANLINE_CYCLES) {
      // Fire vblank interrupt when transitioning.
      if (!this.vblank) {
        this.interruptManager.fire('VBlank');
      }

      this.vblank = true;
      this.setModeFlag(1);
    }
  }

  private renderBackground(scanline: number): void {}

  private get lcdc(): number {
    return this.memory.read(0xff41);
  }

  private setModeFlag(mode: number) {
    const newValue = (this.lcdc & 0b11111100) | (mode & 0b11);
    this.memory.writeLCDCInternal(newValue);
  }

  private getModeFlag() {
    return this.lcdc & 0b11;
  }

  private get backgroundTileDataSource(): number {
    return (this.lcdc & 0b10000) >> 4;
  }

  private get backgroundDisplayMemoryBase(): number {
    const option = (this.lcdc & 0b1000) >> 3;
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
