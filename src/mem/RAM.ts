import { Cartridge } from '../rom/Cartridge';

export interface RAM {
  read(addr: number): number;
  write(addr: number, value: number): void;
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
    this.memory[addr] = value & 0xff;
  }
}
