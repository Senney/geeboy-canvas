import { Cartridge } from '../rom/Cartridge';

export interface RAM {
  read(addr: number): number;
  write(addr: number, value: number): void;
  writeLCDCInternal(value: number): void;
}

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
    return this.memory[addr];
  }

  write(addr: number, value: number): void {
    // LCDC Address
    //   Protect the lower 3 bits.
    if (addr === 0xff41) {
      value = value | (this.memory[addr] & 0b00000111);
    }

    this.memory[addr] = value & 0xff;

    // DMA Transfer address
    //   Allows data to be copied from ROM/RAM to the Object Attribute Memory.
    if (addr === 0xff46) {
      this.handleDMATransfer(addr);
    }
  }

  writeLCDCInternal(value: number): void {
    this.memory[0xff41] = value;
  }

  private handleDMATransfer(addr: number) {
    const dmaCopyAmount = 0x8c;
    for (let i = 0; i < dmaCopyAmount; i++) {
      this.write(0xfe00 + i, this.read(addr + i));
    }
  }
}
