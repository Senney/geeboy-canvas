import { RAM } from '../mem/RAM';
import { CPU } from './CPU';

/**
 * If the IME flag (interrupt master enable) is set, all interrupts are disabled.
 * When an interrupt is generated:
 *  1. The IF flag will be set according to the interrupt which was generated.
 *  2. If interrupts are enabled
 *
 *
 * The IF Flag:
 *  4 P10-P13 transtion - button press has occurred.
 *  3 Serial I/O transfer complete
 *  2 Timer overflow
 *  1 LCDC
 *  0 V-Blank
 *
 * The IE Flag:
 * Enables and disables specific interrupts.
 *
 *  4 - Button press interrupt
 *  3 - Serial I/O transfer interrupt
 *  2 - Timer overflow interrupt
 *  1 - LCDC interrupt
 *  0 - V-Blank
 */

type Interrupt = 'Button' | 'Serial' | 'Timer' | 'LCDC' | 'VBlank';

const IF_REGISTER = 0xff0f;
const IE_REGISTER = 0xffff;
const INTERRUPT_BUTTON = 0b10000;
const INTERRUPT_SERIAL = 0b01000;
const INTERRUPT_TIMER = 0b00100;
const INTERRUPT_LCDC = 0b00010;
const INTERRUPT_VBLANK = 0b00001;

export class InterruptManager {
  constructor(private cpu: CPU, private memory: RAM) {}

  fire(interrupt: Interrupt) {
    switch (interrupt) {
      case 'Button':
        this.setIFRegister(INTERRUPT_BUTTON);
        break;
      case 'Serial':
        this.setIFRegister(INTERRUPT_SERIAL);
        break;
      case 'Timer':
        this.setIFRegister(INTERRUPT_TIMER);
        break;
      case 'LCDC':
        this.setIFRegister(INTERRUPT_LCDC);
        break;
      case 'VBlank':
        this.setIFRegister(INTERRUPT_VBLANK);
        break;
    }
  }

  hasInterrupt(): boolean {
    const int = this.memory.read(IF_REGISTER);
    const ie = this.memory.read(IE_REGISTER);

    if ((int & ie) === 0) {
      return false;
    }

    return true;
  }

  handleInterrupt(): void {
    const int = this.memory.read(IF_REGISTER);
    if ((int & INTERRUPT_VBLANK) > 0) {
      this.cpu.interrupt(0x40);
    } else if ((int & INTERRUPT_LCDC) > 0) {
      this.cpu.interrupt(0x48);
    } else if ((int & INTERRUPT_TIMER) > 0) {
      this.cpu.interrupt(0x50);
    } else if ((int & INTERRUPT_SERIAL) > 0) {
      this.cpu.interrupt(0x58);
    } else if ((int & INTERRUPT_BUTTON) > 0) {
      this.cpu.interrupt(0x60);
    }
  }

  clearInterrupts() {
    this.memory.write(IF_REGISTER, 0x0000);
  }

  private setIFRegister(value: number) {
    this.memory.write(IF_REGISTER, this.memory.read(IF_REGISTER) | value);
  }
}
