import { Cartridge } from '../rom/Cartridge';
import { RegisterSet } from './RegisterSet';
import { InstructionMetadata } from './InstructionMetadata';

import { instructionSet } from './instructions';
import { RAM } from '../mem/RAM';

export class CPU {
  private r: RegisterSet;
  private halt: boolean;
  private interruptsEnabled: boolean;

  public hasUnimplemented = false;

  constructor(private rom: Cartridge, private mem: RAM) {
    this.r = new RegisterSet();
    this.halt = false;
  }

  public step(): void {
    if (this.halt) {
      return;
    }

    let instr = this.rom.readByte(this.r.PC);
    if (instr === 0xcb) {
      instr = (instr << 8) | this.rom.readByte(this.r.PC + 1);
    }

    const meta = InstructionMetadata.get(instr);
    console.log(`0x${instr.toString(16)}`);
    if (instr === 0x76) {
      this.halt = true;
      return;
    }

    const func = instructionSet[instr];

    if (!func) {
      this.hasUnimplemented = true;
      console.log(
        `Instruction [0x${instr.toString(16)} - ${
          meta.name
        }] has not been implemented.`
      );
      this.r.PC += meta.size;
      return;
    }

    console.log(`Running ${meta.name}`);
    const cycles = func(this.r, this.mem, this, meta) ?? meta.cycles[0];

    this.r.PC += meta.size;
  }

  public enableInterrupts(): boolean {
    this.interruptsEnabled = true;
    return true;
  }

  public disableInterrupts(): boolean {
    this.interruptsEnabled = false;
    return false;
  }

  public get registers(): RegisterSet {
    return this.r;
  }
}
