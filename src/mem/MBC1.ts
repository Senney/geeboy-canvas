import { Cartridge } from '../rom/Cartridge';
import { RAMBase } from './RAM';

enum BankMode {
  ROM = 0x0,
  RAM = 0x1,
}

export class MBC1 extends RAMBase {
  private bankMode: BankMode;
  private hasRam: boolean;
  private ramEnabled: boolean;
  private romBank: number;
  private ramBank: number;

  constructor(rom: Cartridge) {
    super(rom);

    this.bankMode = BankMode.ROM;
    this.hasRam = rom.metadata.ramType !== 0;
    this.ramEnabled = true;
    this.romBank = 1;
    this.ramBank = 1;
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
      throw new Error('Not implemented.');
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

    if (0x6000 <= addr && addr <= 0x7fff) {
      throw Error('Switching memory mdoels is not supported');
    }

    if (0xa000 <= addr && addr <= 0xbfff) {
      throw new Error('Writing to external memory is not supported.');
    }

    return super.write(addr, value);
  }

  private readRomData(addr: number, bank = 0) {
    const region = 0x4000 * bank;
    const bankAddr = region + addr;
    if (bankAddr > this.rom.metadata.romSize) {
      throw new Error('Attempted to access RAM out of bounds.');
    }

    return this.rom.readByte(bankAddr);
  }

  private selectRomBank(bank: number) {
    if ([0x0, 0x20, 0x40, 0x60].includes(bank)) {
      bank += 1;
    }

    console.log('Setting selected rom bank to', bank);
    this.romBank = bank;
  }
}
