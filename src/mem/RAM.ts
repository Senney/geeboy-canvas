import { Cartridge } from '../rom/Cartridge';

export interface RAM {
  read(addr: number): number;
  write(addr: number, value: number): void;
  writeLCDCInternal(value: number): void;

  dma(): Uint8Array;
}

const specialMemoryRegisters = {
  0xff00: 'P1 - Controls',
  0xff01: 'serial bus',
  0xff02: 'sio control',
  0xff04: 'divider',
  0xff05: 'timer',
  0xff06: 'timer modulo',
  0xff07: 'timer control',
  // 0xff0f: 'interrupt flag',
  0xff40: 'lcdc',
  // 0xff41: 'stat',
  0xff42: 'scroll y',
  0xff43: 'scroll x',
  // 0xff44: 'lcdc y',
  // 0xff45: 'lcdc compare',
  0xff46: 'dma',
  0xff47: 'background palette',
  0xff48: 'object palette 0 data',
  0xff49: 'object palette 1 data',
  0xff4a: 'window y pos',
  0xff4b: 'window x pos',
  // 0xffff: 'interrupt enable',
};

export class RAMBase implements RAM {
  protected memory: Uint8Array;

  constructor(protected rom: Cartridge) {
    this.memory = Uint8Array.from({ length: 0xffff + 1 }).fill(
      0,
      0,
      0xffff + 1
    );
  }

  read(addr: number): number {
    if (specialMemoryRegisters[addr]) {
      console.log(
        'reading',
        specialMemoryRegisters[addr],
        this.memory[addr].toString(2)
      );
    }

    return this.memory[addr];
  }

  write(addr: number, value: number): void {
    if (specialMemoryRegisters[addr]) {
      console.log('writing', specialMemoryRegisters[addr], value.toString(2));
    }

    // LCDC Address
    //   Protect the lower 3 bits.
    if (addr === 0xff41) {
      value = value | (this.memory[addr] & 0b00000111);
    }

    if (addr === 0xffff) {
      console.log('Interrupts enabled:', value.toString(2));
    }

    this.memory[addr] = value & 0xff;

    // DMA Transfer address
    //   Allows data to be copied from ROM/RAM to the Object Attribute Memory.
    if (addr === 0xff46) {
      this.handleDMATransfer(value);
    }
  }

  dma(): Uint8Array {
    return this.memory;
  }

  writeLCDCInternal(value: number): void {
    this.memory[0xff41] = value;
  }

  private handleDMATransfer(value: number) {
    const dmaCopyAmount = 0x8c;
    const source = value << 8;
    console.log('DMA transfer', value.toString(16));
    for (let i = 0; i < dmaCopyAmount; i++) {
      this.write(0xfe00 + i, this.read(source + i));
    }
  }
}
