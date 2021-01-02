import { Cartridge } from '../rom/Cartridge';
import { RAMBase } from './RAM';

const ramBankSize = 0xbfff - 0xa000;
export class MBC1 extends RAMBase {
  private hasRam: boolean;
  private ramEnabled: boolean;
  private romBank: number;
  private ramBank: number;

  private memoryModel: number;

  private cartRam: Uint8Array;

  constructor(rom: Cartridge) {
    super(rom);

    this.memoryModel = 0;
    this.hasRam = rom.metadata.ramType !== 0;
    this.ramEnabled = true;
    this.romBank = 1;
    this.ramBank = 1;

    this.cartRam = new Uint8Array(rom.metadata.ramSize);

    // Initial value of LCDC is 0x91.
    this.write(0xff40, 0x91);
  }

  public read(addr: number): number {
    // 0x0000 to 0x3FFF always reads from the first bank of the ROM.
    if (0x0000 <= addr && addr <= 0x3fff) {
      return this.readRomData(addr);
    }

    // 0x4000 to 0x7FFF read from the currently referenced bank.
    if (0x4000 <= addr && addr <= 0x7fff) {
      return this.readRomData(addr, this.romBank);
    }

    // 0xA000 to 0xBFFF indicate a write to the memory onboard the cart.
    if (0xa000 <= addr && addr <= 0xbfff) {
      const bankAddr = addr + ramBankSize * (this.ramBank - 1);
      return this.cartRam[bankAddr];
    }

    return super.read(addr);
  }

  public write(addr: number, value: number): void {
    if (0x0000 <= addr && addr <= 0x1fff) {
      if ((value & 0xa) === 0xa) {
        this.ramEnabled = true;
      } else {
        this.ramEnabled = false;
      }
      return;
    }

    if (0x2000 <= addr && addr <= 0x3fff) {
      this.selectRomBank(value & 0x1f);
      return;
    }

    if (0x4000 <= addr && addr <= 0x5fff) {
      switch (this.memoryModel) {
        // 16 Mbit/8 Kbyte
        case 0:
          break;
        // 4 MBit/32 Kbyte
        case 1:
          // Support MBC3 automatically.
          this.ramBank = value & 0b1111111;
          break;
      }
    }

    if (0x6000 <= addr && addr <= 0x7fff) {
      this.memoryModel = value & 0b1;
      return;
    }

    if (0xa000 <= addr && addr <= 0xbfff) {
      const bankAddr = addr + ramBankSize * (this.ramBank - 1);
      this.cartRam[bankAddr] = value;
      return;
    }

    return super.write(addr, value);
  }

  private readRomData(addr: number, bank = 0) {
    const region = 0x4000 * bank;
    let bankAddr;
    if (bank === 0) {
      bankAddr = region + addr;
    } else {
      bankAddr = region + (addr - 0x4000);
    }
    if (bankAddr > this.rom.metadata.romSize) {
      throw new Error('Attempted to access ROM out of bounds.');
    }

    return this.rom.readByte(bankAddr);
  }

  private selectRomBank(bank: number) {
    if ([0x0, 0x20, 0x40, 0x60].includes(bank)) {
      bank += 1;
    }

    this.romBank = bank;
  }
}
